'use client';

import { motion } from 'framer-motion';
import type { AudioTrack } from '@qvix/shared';

interface AudioRemixNodeProps {
  isOpen: boolean;
  audioTrack?: AudioTrack;
  onTap: () => void;
}

export function AudioRemixNode({ isOpen, onTap }: AudioRemixNodeProps) {
  return (
    <button
      onClick={onTap}
      className="audio-remix-node"
      aria-label="Audio Remix"
    >
      {/* Geometric glowing ring */}
      <motion.div
        className="relative w-10 h-10 flex items-center justify-center"
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Outer rotating hexagon ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-qvix-accent/80"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
        />
        {/* Inner pulse */}
        <div className="w-5 h-5 rounded-full bg-qvix-accent/60 flex items-center justify-center">
          <span className="text-[10px]">📢</span>
        </div>
      </motion.div>
      {/* Label */}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-qvix-accent/80 whitespace-nowrap font-medium">
        REMIX
      </span>
    </button>
  );
}
