'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { AudioRemixNode } from './AudioRemixNode';
import { SoundToggleNode } from './SoundToggleNode';
import { DashboardDock } from './DashboardDock';
import { PulseTrigger } from './PulseTrigger';
import { WarpBadge } from './WarpBadge';
import type { FeedVideo } from '@qvix/shared';
import { formatViews } from '@/lib/format';

interface VideoCardProps {
  video: FeedVideo;
  isActive: boolean;
  variantIndex: number;
  totalVariants: number;
  onPulseTriggerTap: () => void;
  onPulseTriggerHold: () => void;
}

export function VideoCard({
  video,
  isActive,
  variantIndex,
  totalVariants,
  onPulseTriggerTap,
  onPulseTriggerHold,
}: VideoCardProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    setIsPlaying(isActive);
  }, [isActive]);

  function handleProgress({ played }: { played: number }) {
    setProgress(played);
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* ── Full-bleed video (19.5:9 aspect in a letter-boxed container) ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <ReactPlayer
          ref={playerRef}
          url={video.videoUrl}
          playing={isPlaying}
          muted={isMuted}
          loop
          playsinline
          width="100%"
          height="100%"
          style={{ objectFit: 'cover', pointerEvents: 'none' }}
          onProgress={handleProgress}
          config={{
            file: {
              attributes: {
                style: { objectFit: 'cover', width: '100%', height: '100%' },
              },
            },
          }}
        />
      </div>

      {/* Subtle vignette overlay — no permanent text over center */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <div
          className="h-full bg-qvix-warp transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Warp Drop badge (shown on zero-follower creator content) */}
      {video.isWarpDrop && <WarpBadge />}

      {/* Variant indicator pills */}
      {totalVariants > 1 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex gap-1">
          {Array.from({ length: totalVariants }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === variantIndex
                  ? 'w-6 bg-qvix-warp'
                  : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* ── Horizon Interaction Nodes ── */}
      <AudioRemixNode
        isOpen={showAudioPanel}
        audioTrack={video.audioTrack}
        onTap={() => setShowAudioPanel((v) => !v)}
      />
      <SoundToggleNode isMuted={isMuted} onTap={() => setIsMuted((v) => !v)} />

      {/* ── Dashboard Control Dock (bottom 25%) ── */}
      <DashboardDock video={video} />

      {/* ── Pulse Trigger ── */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40">
        <PulseTrigger onTap={onPulseTriggerTap} onHold={onPulseTriggerHold} />
      </div>

      {/* Audio remix panel slide-in */}
      {showAudioPanel && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          className="absolute bottom-0 left-0 right-0 z-50 bg-qvix-surface/95 backdrop-blur-xl
                     rounded-t-3xl p-6 border-t border-qvix-border"
        >
          <div className="w-10 h-1 bg-qvix-border rounded-full mx-auto mb-4" />
          <h3 className="text-qvix-text font-display font-semibold mb-2">
            🎵 {video.audioTrack?.title ?? 'Original Audio'}
          </h3>
          <p className="text-qvix-muted text-sm mb-4">
            {video.audioTrack?.artist} · {formatViews(video.audioTrack?.usedByCount ?? 0)} clips
          </p>
          <button
            className="qvix-btn-primary w-full"
            onClick={() => {
              /* open camera with audio overlay */
            }}
          >
            🎬 Record with this Audio
          </button>
        </motion.div>
      )}
    </div>
  );
}
