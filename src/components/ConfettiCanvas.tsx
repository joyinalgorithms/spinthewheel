import { useEffect, useRef } from 'react';

interface ConfettiCanvasProps {
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

const CELEBRATION_COLORS = [
  '#3E5F44', // Primary Earth Green
  '#7FA36B', // Accent Green
  '#DDE8D5', // Light Green
  '#E9B44C', // Festive Gold
  '#E58C8A', // Soft Coral Rose
  '#8FB8DE', // Soft Pastel Blue
  '#F4E285', // Warm Yellow
];

export default function ConfettiCanvas({ active }: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles when active becomes true
    if (active) {
      const particleCount = 120;
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * -canvas.height - 20, // Spawn offscreen top
          size: Math.random() * 8 + 6,
          color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 5 + 4, // Downward velocity
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 4 - 2,
          wobble: Math.random() * Math.PI,
          wobbleSpeed: Math.random() * 0.05 + 0.02,
          opacity: 1,
        });
      }
      particlesRef.current = newParticles;
    } else {
      particlesRef.current = [];
    }

    const updateAndDraw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      let activeParticles = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.wobble) * 0.5;
        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;

        // Fade out as they near the bottom or after some time
        if (p.y > canvas.height * 0.7) {
          p.opacity -= 0.02;
        }

        if (p.opacity > 0 && p.y < canvas.height) {
          activeParticles = true;

          // Render ribbon
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          // Draw custom rectangle ribbon shape
          const rw = p.size;
          const rh = p.size * 1.8;
          ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
          ctx.restore();
        }
      }

      if (active && (activeParticles || particles.length > 0)) {
        animationFrameRef.current = requestAnimationFrame(updateAndDraw);
      }
    };

    if (active) {
      animationFrameRef.current = requestAnimationFrame(updateAndDraw);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      id="confetti-canvas"
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}
