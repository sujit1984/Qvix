'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface DiscoverPortalProps {
  onClose: () => void;
}

export function DiscoverPortal({ onClose }: DiscoverPortalProps) {
  const router = useRouter();

  return (
    <motion.div
      className="absolute inset-0 z-50 flex"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <div className="flex-1" onClick={onClose} />
      <div
        className="w-80 h-full bg-qvix-surface/98 backdrop-blur-2xl border-l border-qvix-border flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-qvix-border">
          <span className="font-display font-bold text-qvix-text flex items-center gap-2">
            <span className="text-qvix-warp">💠</span> DISCOVER
          </span>
          <button
            onClick={onClose}
            className="text-qvix-muted hover:text-qvix-text text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-qvix-border">
          <input
            type="text"
            placeholder="Search trends, creators, audio..."
            className="w-full bg-qvix-card border border-qvix-border rounded-xl px-4 py-2.5 text-sm
                       text-qvix-text placeholder:text-qvix-dim focus:outline-none focus:border-qvix-warp
                       transition-colors"
          />
        </div>

        {/* Trending section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-qvix-dim uppercase tracking-widest mb-3">
              🔥 Trending Now
            </h3>
            <div className="space-y-2">
              {MOCK_TRENDS.map((trend) => (
                <button
                  key={trend.tag}
                  onClick={() => {
                    onClose();
                    router.push(`/trend/${trend.tag}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-qvix-card
                             transition-colors text-left group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: trend.color }}
                  >
                    {trend.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-qvix-text group-hover:text-qvix-warp transition-colors">
                      #{trend.tag}
                    </p>
                    <p className="text-xs text-qvix-muted">{trend.count} clips</p>
                  </div>
                  <span className="text-qvix-dim text-xs">›</span>
                </button>
              ))}
            </div>
          </div>

          {/* Creator analytics teaser */}
          <div className="qvix-card p-4">
            <h3 className="text-xs font-bold text-qvix-dim uppercase tracking-widest mb-2">
              📊 Your Creator Stats
            </h3>
            <p className="text-xs text-qvix-muted">
              Sign in to view your Quantum Feed analytics and creator dashboard.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="qvix-btn-primary w-full mt-3 text-xs"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const MOCK_TRENDS = [
  { tag: 'QuantumVibes', count: '2.4M', emoji: '⚛️', color: 'rgba(123,95,245,0.3)' },
  { tag: 'WarpSpeed', count: '1.8M', emoji: '⚡', color: 'rgba(0,212,255,0.3)' },
  { tag: 'PulseTrigger', count: '940K', emoji: '🔘', color: 'rgba(255,61,107,0.3)' },
  { tag: 'MultiThread', count: '730K', emoji: '🔀', color: 'rgba(0,230,118,0.3)' },
  { tag: 'NovaDrop', count: '510K', emoji: '🌟', color: 'rgba(255,215,0,0.3)' },
];
