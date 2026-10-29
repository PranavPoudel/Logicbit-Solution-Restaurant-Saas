import { useSoundStore } from "@/store/sound-store";

const SOUNDS = {
  added: { notes: [880], gap: 0, length: 0.12, volume: 0.11 },
  removed: { notes: [494], gap: 0, length: 0.12, volume: 0.05 },
  tap: { notes: [660, 880], gap: 0.07, length: 0.14, volume: 0.07 },
  placed: { notes: [523, 659, 784], gap: 0.12, length: 0.45, volume: 0.12 },
  chime: { notes: [660, 880], gap: 0.15, length: 0.3, volume: 0.15 },
  rider: { notes: [880, 660, 880], gap: 0.13, length: 0.3, volume: 0.15 },
  status: { notes: [698, 880], gap: 0.12, length: 0.35, volume: 0.09 },
  success: { notes: [587, 784], gap: 0.08, length: 0.2, volume: 0.08 },
  error: { notes: [262, 196], gap: 0.1, length: 0.2, volume: 0.09 },
};

let context: AudioContext | undefined;

export function playSound(sound: keyof typeof SOUNDS) {
  if (useSoundStore.getState().muted) return;
  try {
    const audio = (context ??= new AudioContext());
    if (audio.state === "suspended") void audio.resume();
    const { notes, gap, length, volume } = SOUNDS[sound];
    notes.forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + i * gap;
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + length);
      tone.connect(gain).connect(audio.destination);
      tone.start(start);
      tone.stop(start + length);
    });
  } catch {}
}
