/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        qvix: {
          bg: '#0A0A0F',
          surface: '#12121A',
          card: '#1A1A26',
          border: '#2A2A3E',
          accent: '#7B5FF5',
          'accent-glow': '#9B7FFF',
          warp: '#00D4FF',
          pulse: '#FF3D6B',
          'pulse-glow': '#FF6B8A',
          gold: '#FFD700',
          success: '#00E676',
          text: '#F0F0FF',
          muted: '#8888AA',
          dim: '#4A4A6A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'warp-in': 'warpIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'warp-out': 'warpOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'ticker': 'ticker 15s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'prism-spin': 'prismSpin 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'feed-drop': 'feedDrop 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'sound-wave': 'soundWave 1.2s ease-in-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        warpIn: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        warpOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(123, 95, 245, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(123, 95, 245, 0.9), 0 0 80px rgba(123, 95, 245, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        prismSpin: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(90deg)' },
        },
        feedDrop: {
          '0%': { transform: 'translateY(-100vh)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        soundWave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      backgroundImage: {
        'quantum-gradient': 'linear-gradient(135deg, #7B5FF5 0%, #00D4FF 50%, #FF3D6B 100%)',
        'warp-gradient': 'linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.1) 50%, transparent 100%)',
        'pulse-gradient': 'radial-gradient(circle at center, rgba(255, 61, 107, 0.3) 0%, transparent 70%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
