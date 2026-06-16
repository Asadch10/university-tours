import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * University Campus Private Tours — Admin Portal design tokens.
 *
 * Shares the exact brand system as the public website (maroon + gold + ivory, Playfair + Inter)
 * so the two products feel like one. The admin layer adds a few console-tuned tokens — denser
 * shadows, a `sidebar` surface scale, and status colors — without touching the brand scales.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        maroon: {
          50: '#fdf3f4',
          100: '#fbe3e6',
          200: '#f6cbd1',
          300: '#eea3ae',
          400: '#e27185',
          500: '#d24762',
          600: '#bd2c4d',
          700: '#9e2040',
          800: '#7a1a32', // brand core
          900: '#6b1521', // crest maroon
          950: '#3d0a12',
        },
        gold: {
          50: '#fdfaf0',
          100: '#faf1d6',
          200: '#f3e1a8',
          300: '#eccb72',
          400: '#e3b347',
          500: '#cf9526', // accent core
          600: '#b4761d',
          700: '#90561a',
          800: '#77451c',
          900: '#653a1b',
          950: '#3a1d0c',
        },
        ink: {
          50: '#f7f5f3',
          100: '#ece8e3',
          200: '#d9d1c8',
          300: '#bfb2a4',
          400: '#9f8e7c',
          500: '#85725f',
          600: '#6c5b4b',
          700: '#57493e',
          800: '#473d35',
          900: '#1f1a16', // primary text
          950: '#14100d',
        },
        ivory: '#fbf8f3',
        cream: '#f6f0e7',
        verified: '#2f7d57',
        // Console status palette (kept distinct from brand scales)
        info: '#2563a8',
        warn: '#b4761d',
        danger: '#bd2c4d',
        success: '#2f7d57',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31,26,22,0.04), 0 4px 16px -4px rgba(31,26,22,0.08)',
        card: '0 2px 4px rgba(31,26,22,0.04), 0 12px 32px -12px rgba(31,26,22,0.12)',
        lift: '0 8px 16px rgba(31,26,22,0.06), 0 24px 48px -16px rgba(31,26,22,0.18)',
        glow: '0 0 0 1px rgba(207,149,38,0.25), 0 12px 32px -8px rgba(122,26,50,0.30)',
        'ring-focus': '0 0 0 3px rgba(207,149,38,0.30)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'maroon-gradient': 'linear-gradient(135deg, #7a1a32 0%, #6b1521 55%, #3d0a12 100%)',
        'gold-sheen': 'linear-gradient(135deg, #eccb72 0%, #cf9526 100%)',
        'radial-fade':
          'radial-gradient(60% 60% at 50% 0%, rgba(207,149,38,0.10) 0%, transparent 70%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22,1,0.36,1) both',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [typography],
};

export default config;
