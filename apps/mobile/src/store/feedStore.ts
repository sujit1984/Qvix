import { create } from 'zustand';
import type { FeedVideo } from '@qvix/shared';

interface FeedState {
  videos: FeedVideo[];
  currentIndex: number;
  variantIndex: number;
  isWarpActive: boolean;
  setVideos: (videos: FeedVideo[]) => void;
  nextVideo: () => void;
  prevVideo: () => void;
  nextVariant: () => void;
  prevVariant: () => void;
  triggerWarp: () => void;
  resetWarp: () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  videos: [],
  currentIndex: 0,
  variantIndex: 0,
  isWarpActive: false,
  setVideos: (videos) => set({ videos }),
  nextVideo: () => {
    const { currentIndex, videos } = get();
    if (currentIndex < videos.length - 1) {
      set({ currentIndex: currentIndex + 1, variantIndex: 0 });
    }
  },
  prevVideo: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, variantIndex: 0 });
    }
  },
  nextVariant: () => {
    const { videos, currentIndex, variantIndex } = get();
    const max = (videos[currentIndex]?.variants?.length ?? 0);
    if (variantIndex < max) {
      set({ variantIndex: variantIndex + 1 });
    }
  },
  prevVariant: () => {
    const { variantIndex } = get();
    if (variantIndex > 0) {
      set({ variantIndex: variantIndex - 1 });
    }
  },
  triggerWarp: () => set({ isWarpActive: true }),
  resetWarp: () => set({ isWarpActive: false }),
}));
