/**
 * Web Audio API synthesizer for the Wheel of Names.
 * Generates dynamic sound effects without external audio assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API is not supported or was blocked by browser permissions.', e);
    return null;
  }
}

/**
 * Plays a quick, crisp "tick" sound when the wheel crosses a divider segment.
 */
export function playTickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Dynamic high-frequency woodblock tick with extremely fast exponential decay
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Fail silently if audio context cannot play yet
  }
}

/**
 * Plays a pleasant, harmonious major-chord fanfare when a winner is chosen.
 */
export function playSuccessSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Beautiful, arpeggiated C-major chord (C4, E4, G4, C5)
    const notes = [261.63, 329.63, 392.0, 523.25];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      // Arpeggiate the notes slightly apart
      const noteTime = now + idx * 0.1;
      osc.frequency.setValueAtTime(freq, noteTime);

      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(0.12, noteTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.start(noteTime);
      osc.stop(noteTime + 0.7);
    });
  } catch (e) {
    // Fail silently
  }
}
