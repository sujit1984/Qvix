'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function TopBar() {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-safe pt-3 pb-2">
      {/* Warp Speed button */}
      <Link href="/warp">
        <motion.button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: 'rgba(0,212,255,0.12)',
            border: '1px solid rgba(0,212,255,0.35)',
          }}
          whileTap={{ scale: 0.95 }}
          aria-label="Warp Speed"
        >
          <motion.span
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚡
          </motion.span>
          <span className="text-qvix-warp tracking-wider">WARP SPEED</span>
        </motion.button>
      </Link>

      {/* Qvix wordmark */}
      <Link href="/">
        <span className="font-display font-black text-xl text-gradient-quantum select-none">
          QVIX
        </span>
      </Link>

      {/* Settings */}
      <Link href="/settings">
        <button
          className="w-9 h-9 rounded-xl bg-qvix-card/80 border border-qvix-border
                     flex items-center justify-center text-lg hover:bg-qvix-surface transition-colors"
          aria-label="Settings"
        >
          ⚙️
        </button>
      </Link>
    </div>
  );
}
