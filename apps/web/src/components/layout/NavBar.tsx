'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

const TABS = [
  { href: '/', label: 'Feed', icon: '⚡' },
  { href: '/explore', label: 'Explore', icon: '🔍' },
  { href: '/upload', label: 'Upload', icon: '⬆' },
  { href: '/inbox', label: 'Inbox', icon: '💬' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pb-safe">
      <div
        className="flex items-center justify-around px-2 py-1.5 mx-3 mb-3 rounded-2xl"
        style={{
          background: 'rgba(18, 18, 26, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(42, 42, 62, 0.8)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.4)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className="nav-tab relative">
              <motion.div
                className="relative"
                animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span
                  className="text-xl"
                  style={
                    isActive
                      ? {
                          filter: 'drop-shadow(0 0 6px rgba(123,95,245,0.8))',
                        }
                      : {}
                  }
                >
                  {tab.icon}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-qvix-accent"
                  />
                )}
              </motion.div>
              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? 'text-qvix-accent' : 'text-qvix-dim'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
