'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { DiscoverPortal } from './DiscoverPortal';
import type { FeedVideo } from '@qvix/shared';
import { formatViews } from '@/lib/format';

interface DashboardDockProps {
  video: FeedVideo;
}

export function DashboardDock({ video }: DashboardDockProps) {
  const [showDiscover, setShowDiscover] = useState(false);
  const descriptionTooLong = video.description.length > 30;

  return (
    <>
      <div className="dashboard-dock pt-4">
        <div className="flex items-end justify-between gap-3">
          {/* ── Metadata Cluster (bottom-left) ── */}
          <div className="flex-1 min-w-0">
            {/* Creator handle */}
            <div className="flex items-center gap-2 mb-1">
              {video.creator.avatarUrl && (
                <Image
                  src={video.creator.avatarUrl}
                  alt={video.creator.username}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full border border-qvix-accent/50 object-cover"
                />
              )}
              <span className="font-display font-bold text-sm text-qvix-text">
                @{video.creator.username}
              </span>
              {video.creator.isVerified && (
                <span className="text-qvix-warp text-xs">✦</span>
              )}
            </div>

            {/* Description — ticker if too long */}
            <div className="overflow-hidden relative h-5">
              {descriptionTooLong ? (
                <div className="ticker-text text-xs text-qvix-muted">
                  {video.description} &nbsp;&nbsp;&nbsp; #{video.trendTitle}
                </div>
              ) : (
                <p className="text-xs text-qvix-muted truncate">
                  {video.description}
                  {video.trendTitle && (
                    <span className="text-qvix-warp"> #{video.trendTitle}</span>
                  )}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1">
              <button className="flex items-center gap-1 text-xs text-qvix-muted hover:text-qvix-pulse transition-colors">
                <span>❤️</span>
                <span>{formatViews(video.likesCount)}</span>
              </button>
              <button className="flex items-center gap-1 text-xs text-qvix-muted hover:text-qvix-warp transition-colors">
                <span>💬</span>
                <span>{formatViews(video.commentsCount)}</span>
              </button>
              <button className="flex items-center gap-1 text-xs text-qvix-muted hover:text-qvix-accent transition-colors">
                <span>↗</span>
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* ── Discover Portal (bottom-right) ── */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowDiscover(true)}
              className="discover-portal"
              aria-label="Discover"
            >
              <div className="grid grid-cols-2 gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-sm ${
                      i === 0 ? 'bg-qvix-warp' : i === 3 ? 'bg-qvix-accent' : 'bg-qvix-border'
                    }`}
                  />
                ))}
              </div>
            </button>
            <span className="text-[9px] text-qvix-warp/70 font-medium">DISCOVER</span>
          </div>
        </div>

        {/* Bottom navigation hint */}
        <div className="flex justify-center mt-3 gap-8 pb-1">
          <div className="text-center">
            <div className="text-qvix-dim text-[10px] mb-0.5">▲ PROFILE</div>
          </div>
          <div className="text-center">
            <div className="text-qvix-dim text-[10px] mb-0.5">▼ NEXT TREND</div>
          </div>
        </div>
      </div>

      {/* Discover Portal slide-in panel */}
      <AnimatePresence>
        {showDiscover && (
          <DiscoverPortal onClose={() => setShowDiscover(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
