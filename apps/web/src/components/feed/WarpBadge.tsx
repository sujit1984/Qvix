'use client';

import { motion } from 'framer-motion';

export function WarpBadge() {
  return (
    <motion.div
      className="absolute top-20 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,95,245,0.2))',
        border: '1px solid rgba(0,212,255,0.5)',
        boxShadow: '0 0 15px rgba(0,212,255,0.3)',
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <motion.span
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        ⚡
      </motion.span>
      <span className="text-qvix-warp tracking-wider">WARP DROP</span>
    </motion.div>
  );
}
