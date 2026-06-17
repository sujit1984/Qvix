'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WarpDropOverlayProps {
  onComplete: () => void;
}

export function WarpDropOverlay({ onComplete }: WarpDropOverlayProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(onComplete, 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Hyper-speed star-warp lines */}
      {Array.from({ length: 60 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-qvix-warp"
          style={{
            width: 1,
            height: Math.random() * 80 + 20,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transformOrigin: 'top center',
            rotate: Math.random() * 360,
            opacity: 0.6 + Math.random() * 0.4,
          }}
          animate={{
            scaleY: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.8,
            delay: Math.random() * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Central warp burst */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ scale: [0.5, 1.5, 0.8], opacity: [0, 1, 0] }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      >
        <div
          className="w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.9) 0%, rgba(123,95,245,0.6) 50%, transparent 100%)',
            boxShadow: '0 0 80px rgba(0,212,255,0.8), 0 0 160px rgba(123,95,245,0.4)',
          }}
        />
        <motion.p
          className="absolute font-display font-black text-white text-xl tracking-widest"
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          WARP
        </motion.p>
      </motion.div>

      {/* Label */}
      <motion.p
        className="absolute bottom-32 text-qvix-warp text-sm font-display tracking-[0.3em]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        DROPPING INTO QUANTUM FEED...
      </motion.p>
    </motion.div>
  );
}
