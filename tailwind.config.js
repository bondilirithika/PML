/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        sidebar: '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.07), 0 8px 24px rgba(0,0,0,0.04)',
        'card-lg':  '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -8px rgba(0,0,0,0.08)',
        'card-xl':  '0 8px 32px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)',
        'glow-sm':  '0 0 12px 2px rgba(99,102,241,0.25)',
        'glow-md':  '0 0 24px 4px rgba(99,102,241,0.20)',
        'inner-sm': 'inset 0 1px 2px rgba(0,0,0,0.06)',
        'nav-active': '0 4px 14px rgba(99,102,241,0.4)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'sidebar-active':   'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'card-shimmer':     'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
        'hero-gradient':    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 1.8s infinite',
        'bounce-sm':  'bounceSm 0.4s ease-out',
        'ping-slow':  'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'modal-in':   'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                                to: { opacity: '1' } },
        slideIn:  { from: { transform: 'translateX(-12px)', opacity: '0'}, to: { transform: 'translateX(0)', opacity: '1' } },
        slideUp:  { from: { transform: 'translateY(16px)', opacity: '0'}, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' },              to: { backgroundPosition: '200% 0' } },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        modalIn: {
          from: { transform: 'scale(0.95) translateY(10px)', opacity: '0' },
          to:   { transform: 'scale(1) translateY(0)',       opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
