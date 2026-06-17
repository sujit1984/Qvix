'use client';

import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface PulseTriggerProps {
  onTap: () => void;
  onHold: () => void;
}

const LONG_PRESS_MS = 600;

export function PulseTrigger({ onTap, onHold }: PulseTriggerProps) {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didFire = useRef(false);

  const startPress = useCallback(() => {
    didFire.current = false;
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      didFire.current = true;
      setIsHolding(false);
      onHold(); // Warp Drop
    }, LONG_PRESS_MS);
  }, [onHold]);

  const endPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    if (!didFire.current) {
      onTap(); // Camera module
    }
    didFire.current = false;
  }, [onTap]);

  return (
    <motion.button
      className="pulse-trigger"
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      whileTap={{ scale: 0.9 }}
      animate={isHolding ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3, repeat: isHolding ? Infinity : 0 }}
      aria-label="Pulse Trigger — tap to record, hold for Warp Drop"
    >
      {/* Central dot */}
      <motion.div
        className="w-6 h-6 rounded-full bg-white"
        animate={{ scale: isHolding ? [1, 0.7, 1] : 1 }}
        transition={{ duration: 0.3, repeat: isHolding ? Infinity : 0 }}
      />
      {/* Hold progress ring */}
      {isHolding && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 64 64"
        >
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
            strokeDasharray="175.9"
            strokeDashoffset={175.9}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: LONG_PRESS_MS / 1000, ease: 'linear' }}
          />
        </svg>
      )}
    </motion.button>
  );
}
