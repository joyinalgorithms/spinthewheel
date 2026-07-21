import { useEffect, useRef, useState } from 'react';
import { playTickSound } from '../utils/audio';
import { Participant } from '../types';

interface WheelCanvasProps {
  names: Participant[];
  spinDuration: number; // in seconds
  soundEnabled: boolean;
  onSpinStart: () => void;
  onSpinComplete: (winner: Participant) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  themeMode: 'light' | 'dark';
}

// Earthy Green palettes for wheel segments
const LIGHT_SEGMENT_COLORS = [
  '#3E5F44', // Forest Slate
  '#5E7B5A', // Muted Sage
  '#7FA36B', // Accent Moss
  '#8FA08B', // Leaf Grey
  '#A3C1AD', // Pale Sage
  '#4C6E52', // Darker Moss
];

const DARK_SEGMENT_COLORS = [
  '#243126', // Deep Card Green
  '#3E5F44', // Forest Slate
  '#5E7B5A', // Muted Sage
  '#18221A', // Darkest Olive
  '#4C6E52', // Darker Moss
  '#7FA36B', // Moss Accent
];

// Easing function for realistic deceleration (easeOutQuart - starts fast, long suspenseful tail)
function easeOutQuart(x: number): number {
  return 1 - Math.pow(1 - x, 4);
}

export default function WheelCanvas({
  names,
  spinDuration,
  soundEnabled,
  onSpinStart,
  onSpinComplete,
  isSpinning,
  setIsSpinning,
  themeMode,
}: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [angle, setAngle] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const spinStateRef = useRef({
    startTime: 0,
    startAngle: 0,
    totalRotation: 0,
    lastTickSegment: -1,
    lastTickTime: 0,
  });

  // Ensure responsive canvas sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const size = Math.min(container.clientWidth, 600);
      canvas.width = size * window.devicePixelRatio;
      canvas.height = size * window.devicePixelRatio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      drawWheel(angle);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [names, themeMode, angle]);

  // Handle drawing the wheel
  const drawWheel = (currentAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 24 * dpr; // Margins for pointer

    ctx.clearRect(0, 0, width, height);

    const segmentColors = themeMode === 'light' ? LIGHT_SEGMENT_COLORS : DARK_SEGMENT_COLORS;
    const N = names.length || 1;
    const arcSize = (2 * Math.PI) / N;

    // Draw Outer Shadow Ring for Premium 3D depth
    ctx.save();
    ctx.shadowColor = themeMode === 'light' ? 'rgba(31, 42, 32, 0.15)' : 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 16 * dpr;
    ctx.shadowOffsetX = 2 * dpr;
    ctx.shadowOffsetY = 6 * dpr;
    ctx.fillStyle = themeMode === 'light' ? '#EBF0E8' : '#141C16';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12 * dpr, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw segment slices
    for (let i = 0; i < N; i++) {
      const startAngle = currentAngle + i * arcSize;
      const endAngle = startAngle + arcSize;

      ctx.save();

      // Create rich gradient fill for each slice
      const grad = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
      const baseColor = names.length > 0 ? segmentColors[i % segmentColors.length] : '#8FA08B';
      grad.addColorStop(0, baseColor);
      // Softly darken toward the outer edge
      grad.addColorStop(1, baseColor === '#FFFFFF' ? '#F4F5F0' : darkenColor(baseColor, 15));

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();

      // Thin separation lines
      ctx.strokeStyle = themeMode === 'light' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.stroke();

      // Draw Names
      if (names.length > 0) {
        const nameText = names[i].name;
        ctx.save();
        ctx.translate(centerX, centerY);
        // Rotate to the center of the segment slice
        ctx.rotate(startAngle + arcSize / 2);

        // Responsive font calculation
        let fontSize = 15;
        if (N > 40) fontSize = 8;
        else if (N > 25) fontSize = 10;
        else if (N > 15) fontSize = 12;
        else if (N > 8) fontSize = 14;

        ctx.font = `bold ${fontSize * dpr}px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        // Select high contrast text color
        const isLightSegment = isColorLight(baseColor);
        ctx.fillStyle = isLightSegment ? '#1F2A20' : '#FFFFFF';

        // Add small text shadow for perfect legibility
        ctx.shadowColor = isLightSegment ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 2 * dpr;

        // Truncate name if it's too long
        let displayName = nameText;
        const maxLen = N > 20 ? 10 : 20;
        if (displayName.length > maxLen) {
          displayName = displayName.substring(0, maxLen) + '...';
        }

        ctx.fillText(displayName, radius - 15 * dpr, 0);
        ctx.restore();
      }

      ctx.restore();
    }

    // Outer gold/bronze metallic rim
    ctx.save();
    ctx.strokeStyle = themeMode === 'light' ? '#3E5F44' : '#7FA36B';
    ctx.lineWidth = 6 * dpr;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // Draw little perimeter pegs/dots on segment dividers for tactile depth
    for (let i = 0; i < N; i++) {
      const pegAngle = currentAngle + i * arcSize;
      const pegX = centerX + radius * Math.cos(pegAngle);
      const pegY = centerY + radius * Math.sin(pegAngle);

      ctx.save();
      ctx.fillStyle = themeMode === 'light' ? '#DDE8D5' : '#7FA36B';
      ctx.strokeStyle = themeMode === 'light' ? '#3E5F44' : '#1F2A20';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.arc(pegX, pegY, 4 * dpr, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Glassmorphic Center Hub & SPIN Label
    ctx.save();
    const hubRadius = radius * 0.24;

    // Outer Hub shadow/bezel
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 8 * dpr;
    ctx.shadowOffsetY = 4 * dpr;
    ctx.fillStyle = themeMode === 'light' ? '#FFFFFF' : '#243126';
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 4 * dpr, 0, 2 * Math.PI);
    ctx.fill();

    // Inner Glassmorphic Fill
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const hubGrad = ctx.createLinearGradient(
      centerX - hubRadius,
      centerY - hubRadius,
      centerX + hubRadius,
      centerY + hubRadius
    );
    if (themeMode === 'light') {
      hubGrad.addColorStop(0, '#FFFFFF');
      hubGrad.addColorStop(1, '#DDE8D5');
    } else {
      hubGrad.addColorStop(0, '#3E5F44');
      hubGrad.addColorStop(1, '#18221A');
    }
    ctx.fillStyle = hubGrad;
    ctx.strokeStyle = themeMode === 'light' ? '#3E5F44' : '#7FA36B';
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Gloss effect overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, Math.PI, 2 * Math.PI);
    ctx.fill();

    // Text "SPIN"
    ctx.fillStyle = themeMode === 'light' ? '#3E5F44' : '#FFFFFF';
    ctx.font = `bold ${Math.max(14, hubRadius * 0.45) * dpr}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
    ctx.restore();

    // Draw Triangular Pin/Pointer at the TOP (points downwards)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4 * dpr;
    ctx.shadowOffsetY = 2 * dpr;

    ctx.fillStyle = themeMode === 'light' ? '#3E5F44' : '#7FA36B';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2 * dpr;

    const pinWidth = 16 * dpr;
    const pinHeight = 24 * dpr;
    const pinY = centerY - radius - 10 * dpr;

    ctx.beginPath();
    ctx.moveTo(centerX, pinY); // Top tip
    ctx.lineTo(centerX - pinWidth / 2, pinY - pinHeight); // Upper left
    ctx.lineTo(centerX + pinWidth / 2, pinY - pinHeight); // Upper right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small glossy pointer pin cap
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(centerX, pinY - pinHeight + 4 * dpr, 3 * dpr, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  };

  // Trigger spin animation using precise ease-out curve
  const handleSpinClick = () => {
    if (isSpinning || names.length === 0) return;

    onSpinStart();
    setIsSpinning(true);

    const N = names.length;
    const totalDurationMs = spinDuration * 1000;

    // Random landing target (between 5 and 8 full rotations + extra offset)
    const extraRotations = 5 + Math.random() * 3;
    const finalAngleOffset = Math.random() * (2 * Math.PI);
    const totalRotation = extraRotations * 2 * Math.PI + finalAngleOffset;

    const startAngle = angle % (2 * Math.PI);
    const startTime = performance.now();

    spinStateRef.current = {
      startTime,
      startAngle,
      totalRotation,
      lastTickSegment: -1,
      lastTickTime: 0,
    };

    const animateSpin = (now: number) => {
      const elapsed = now - spinStateRef.current.startTime;
      const progress = Math.min(elapsed / totalDurationMs, 1);

      const easeProgress = easeOutQuart(progress);
      const currentAngle = spinStateRef.current.startAngle + spinStateRef.current.totalRotation * easeProgress;

      setAngle(currentAngle);
      drawWheel(currentAngle);

      // Auditory ticking physics
      // Pointer is located at angle -Math.PI / 2 (or 3/2 * Math.PI, i.e., 270 degrees)
      const pointerOffset = 1.5 * Math.PI;
      // Find the relative angle of the pointer relative to the wheel rotation
      const relativeAngle = (pointerOffset - currentAngle) % (2 * Math.PI);
      const normalizedAngle = relativeAngle < 0 ? relativeAngle + 2 * Math.PI : relativeAngle;

      const arcSize = (2 * Math.PI) / N;
      const currentSegment = Math.floor(normalizedAngle / arcSize) % N;

      if (currentSegment !== spinStateRef.current.lastTickSegment) {
        // Limit tick sound frequency at peak velocity to prevent muddy audio
        if (soundEnabled && now - spinStateRef.current.lastTickTime > 40) {
          playTickSound();
          spinStateRef.current.lastTickTime = now;
        }
        spinStateRef.current.lastTickSegment = currentSegment;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateSpin);
      } else {
        // Finished spinning!
        setIsSpinning(false);
        const winningIndex = (N - 1 - currentSegment) % N;
        const actualWinnerIndex = winningIndex < 0 ? winningIndex + N : winningIndex;
        onSpinComplete(names[actualWinnerIndex]);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateSpin);
  };

  // Keep drawing on render updates (e.g. category names or theme changes)
  useEffect(() => {
    drawWheel(angle);
  }, [names, themeMode, angle]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Helper color utilities
  function darkenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) - amt,
      G = ((num >> 8) & 0x00ff) - amt,
      B = (num & 0x0000ff) - amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 0 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  function isColorLight(hex: string): boolean {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // ITU-R BT.709
    return luma > 145;
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full aspect-square max-w-[500px] mx-auto relative select-none">
      {/* Decorative Outer Rings */}
      <div className="absolute inset-0 rounded-full border border-dashed border-neutral-300 dark:border-neutral-800 pointer-events-none scale-105" />
      <div className="absolute inset-0 rounded-full border border-neutral-200 dark:border-neutral-900 pointer-events-none scale-110 opacity-50" />

      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        className={`block z-10 cursor-pointer transition-shadow duration-300 ${
          isSpinning ? 'pointer-events-none shadow-2xl scale-[0.99]' : 'hover:shadow-lg hover:scale-[1.01]'
        }`}
        onClick={handleSpinClick}
      />

      {/* Under-wheel Spin Floating Shadows */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-radial from-neutral-800/20 to-transparent blur-md -z-10 pointer-events-none" />
    </div>
  );
}
