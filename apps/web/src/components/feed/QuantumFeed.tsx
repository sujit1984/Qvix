'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { VideoCard } from './VideoCard';
import { WarpDropOverlay } from './WarpDropOverlay';
import { useQuantumFeed } from '@/hooks/useQuantumFeed';
import { useVideoStore } from '@/store/videoStore';
import type { FeedVideo } from '@qvix/shared';

type SwipeDirection = 'up' | 'down' | 'left' | 'right' | null;

export function QuantumFeed() {
  const { videos, loadMore, isLoading } = useQuantumFeed();
  const { currentIndex, setCurrentIndex, isWarpActive, setWarpActive } = useVideoStore();
  const [swipeDir, setSwipeDir] = useState<SwipeDirection>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [showCreatorProfile, setShowCreatorProfile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  const swipeThreshold = 60;

  const currentVideo = videos[currentIndex] as FeedVideo | undefined;

  // Pre-load adjacent videos
  useEffect(() => {
    if (currentIndex >= videos.length - 3) {
      loadMore();
    }
  }, [currentIndex, videos.length, loadMore]);

  const handleSwipeDown = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setVariantIndex(0);
    }
  }, [currentIndex, videos.length, setCurrentIndex]);

  const handleSwipeUp = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setVariantIndex(0);
    } else {
      setShowCreatorProfile(true);
    }
  }, [currentIndex, setCurrentIndex]);

  const handleSwipeRight = useCallback(() => {
    const maxVariants = currentVideo?.variants?.length ?? 0;
    if (variantIndex < maxVariants - 1) {
      setVariantIndex((v) => v + 1);
    }
  }, [currentVideo?.variants?.length, variantIndex]);

  const handleSwipeLeft = useCallback(() => {
    if (variantIndex > 0) {
      setVariantIndex((v) => v - 1);
    }
  }, [variantIndex]);

  function onPanEnd(_: PointerEvent, info: PanInfo) {
    const { offset, velocity } = info;
    const absY = Math.abs(offset.y);
    const absX = Math.abs(offset.x);
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    if (speed < 50 && absY < swipeThreshold && absX < swipeThreshold) return;

    if (absY > absX) {
      if (offset.y < -swipeThreshold) {
        setSwipeDir('up');
        handleSwipeDown(); // swipe up body = next video
      } else if (offset.y > swipeThreshold) {
        setSwipeDir('down');
        handleSwipeUp(); // swipe down body = prev or creator profile
      }
    } else {
      if (offset.x > swipeThreshold) {
        setSwipeDir('right');
        handleSwipeRight();
      } else if (offset.x < -swipeThreshold) {
        setSwipeDir('left');
        handleSwipeLeft();
      }
    }
    setSwipeDir(null);
  }

  if (isLoading && videos.length === 0) {
    return <QuantumFeedSkeleton />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence mode="popLayout">
        {currentVideo && (
          <motion.div
            key={`${currentVideo.id}-${variantIndex}`}
            className="absolute inset-0"
            initial={getInitialVariant(swipeDir)}
            animate={{ x: 0, y: 0, rotateY: 0, opacity: 1 }}
            exit={getExitVariant(swipeDir)}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.15}
            onPanEnd={onPanEnd}
            style={{ y: dragY, x: dragX }}
          >
            <VideoCard
              video={
                variantIndex > 0 && currentVideo.variants?.[variantIndex - 1]
                  ? currentVideo.variants[variantIndex - 1]
                  : currentVideo
              }
              isActive
              variantIndex={variantIndex}
              totalVariants={(currentVideo.variants?.length ?? 0) + 1}
              onPulseTriggerTap={() => {/* camera module */}}
              onPulseTriggerHold={() => setWarpActive(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warp Drop Overlay */}
      <AnimatePresence>
        {isWarpActive && (
          <WarpDropOverlay onComplete={() => setWarpActive(false)} />
        )}
      </AnimatePresence>

      {/* Creator Profile Drawer */}
      <AnimatePresence>
        {showCreatorProfile && currentVideo && (
          <motion.div
            className="absolute inset-0 z-50 bg-qvix-bg/95 backdrop-blur-xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <div className="p-6 pt-12">
              <button
                onClick={() => setShowCreatorProfile(false)}
                className="absolute top-6 right-6 text-qvix-muted hover:text-qvix-text"
              >
                ✕
              </button>
              <h2 className="font-display text-2xl font-bold text-gradient-quantum">
                @{currentVideo.creator.username}
              </h2>
              <p className="text-qvix-muted mt-2">{currentVideo.creator.bio}</p>
              <div className="mt-4 flex gap-6">
                <div className="text-center">
                  <p className="font-bold text-qvix-text">{currentVideo.creator.followersCount}</p>
                  <p className="text-xs text-qvix-muted">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-qvix-text">{currentVideo.creator.videosCount}</p>
                  <p className="text-xs text-qvix-muted">Videos</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe direction hints */}
      <SwipeHints variantCount={(currentVideo?.variants?.length ?? 0) + 1} />
    </div>
  );
}

function getInitialVariant(dir: SwipeDirection) {
  switch (dir) {
    case 'up': return { y: -100, opacity: 0 };
    case 'down': return { y: 100, opacity: 0 };
    case 'left': return { x: -100, rotateY: -90, opacity: 0 };
    case 'right': return { x: 100, rotateY: 90, opacity: 0 };
    default: return { y: '-100%', opacity: 0 };
  }
}

function getExitVariant(dir: SwipeDirection) {
  switch (dir) {
    case 'up': return { y: 100, opacity: 0 };
    case 'down': return { y: -100, opacity: 0 };
    case 'left': return { x: 100, rotateY: 90, opacity: 0 };
    case 'right': return { x: -100, rotateY: -90, opacity: 0 };
    default: return { y: '100%', opacity: 0 };
  }
}

function SwipeHints({ variantCount }: { variantCount: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {variantCount > 1 && (
        <>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-qvix-warp/40 text-xs">
            ◄ ALT
          </div>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-qvix-warp/40 text-xs">
            NEXT ►
          </div>
        </>
      )}
    </div>
  );
}

function QuantumFeedSkeleton() {
  return (
    <div className="h-screen bg-qvix-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-quantum-gradient animate-pulse" />
        <p className="text-qvix-muted text-sm animate-pulse">Calibrating Quantum Feed...</p>
      </div>
    </div>
  );
}
