import { create } from 'zustand';

interface VideoStore {
  currentIndex: number;
  isWarpActive: boolean;
  isMuted: boolean;
  setCurrentIndex: (index: number) => void;
  setWarpActive: (active: boolean) => void;
  setMuted: (muted: boolean) => void;
}

export const useVideoStore = create<VideoStore>((set) => ({
  currentIndex: 0,
  isWarpActive: false,
  isMuted: true,
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setWarpActive: (active) => set({ isWarpActive: active }),
  setMuted: (muted) => set({ isMuted: muted }),
}));
