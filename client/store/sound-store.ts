import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useIsMounted } from "@/hooks/use-is-mounted";

interface SoundState {
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      muted: false,
      setMuted: (muted) => set({ muted }),
    }),
    { name: "sound-storage" }
  )
);

export function useSoundMuted() {
  const mounted = useIsMounted();
  const muted = useSoundStore((s) => s.muted) && mounted;
  const setMuted = useSoundStore((s) => s.setMuted);
  return [muted, setMuted] as const;
}
