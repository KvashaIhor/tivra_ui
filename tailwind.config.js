/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['var(--font-manrope)', 'sans-serif'],
        sans: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        surface: {
          primary: '#f8fafc',
          secondary: '#f1f5f9',
          tertiary: '#e2e8f0',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        'gradient-accent': 'linear-gradient(135deg, #e94560 0%, #ff6b6b 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-warning': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        'gradient-error': 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      },
      boxShadow: {
        'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
        'elevation-3': '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px rgba(0, 0, 0, 0.15), 0 8px 12px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 16px rgba(16, 185, 129, 0.4)',
      },
      backdropBlur: {
        glass: '10px',
        'glass-strong': '20px',
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slide-up 0.3s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'blink-bar': 'blink-bar 1.2s step-end infinite',
        'fade-in-long': 'fadeIn 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'blink-bar': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1200px 0' },
          '100%': { backgroundPosition: '1200px 0' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
