import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * University Campus Private Tours — design tokens.
 * Brand: deep collegiate maroon (from the crest logo) + gold premium accent + warm ivory canvas.
 * Type: Playfair Display (display/serif) + Inter (body) — the "Classic Elegant" pairing.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Primary collegiate maroon scale
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
        // Gold premium accent
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
        // Warm neutral ink/canvas
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
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-lg': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31,26,22,0.04), 0 4px 16px -4px rgba(31,26,22,0.08)',
        card: '0 2px 4px rgba(31,26,22,0.04), 0 12px 32px -12px rgba(31,26,22,0.12)',
        lift: '0 8px 16px rgba(31,26,22,0.06), 0 24px 48px -16px rgba(31,26,22,0.18)',
        glow: '0 0 0 1px rgba(207,149,38,0.25), 0 12px 32px -8px rgba(122,26,50,0.30)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'maroon-gradient': 'linear-gradient(135deg, #7a1a32 0%, #6b1521 55%, #3d0a12 100%)',
        'gold-sheen': 'linear-gradient(135deg, #eccb72 0%, #cf9526 100%)',
        'radial-fade': 'radial-gradient(60% 60% at 50% 0%, rgba(207,149,38,0.10) 0%, transparent 70%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.6s ease both',
        marquee: 'marquee 32s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [typography],
};

export default config;
