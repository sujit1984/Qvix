'use client';

import { motion } from 'framer-motion';

interface SoundToggleNodeProps {
  isMuted: boolean;
  onTap: () => void;
}

// 5 bars that animate to the audio rhythm
const BAR_DELAYS = [0, 0.15, 0.3, 0.15, 0];

export function SoundToggleNode({ isMuted, onTap }: SoundToggleNodeProps) {
  return (
    <button
      onClick={onTap}
      className="sound-toggle-node"
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      <div className="flex items-center gap-0.5 h-8 relative">
        {BAR_DELAYS.map((delay, i) => (
          <motion.div
            key={i}
            className="sound-bar"
            animate={
              isMuted
                ? { scaleY: 0.2 }
                : {
                    scaleY: [0.4, 1, 0.4],
                    transition: {
                      duration: 1.2,
                      delay,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }
            }
            style={{ height: '24px', transformOrigin: 'bottom' }}
          />
        ))}
        {isMuted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-0.5 bg-qvix-warp/60 rotate-45 absolute" />
          </div>
        )}
      </div>
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-qvix-warp/80 whitespace-nowrap font-medium">
        {isMuted ? 'MUTED' : 'SOUND'}
      </span>
    </button>
  );
}
