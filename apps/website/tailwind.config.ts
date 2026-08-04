import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * University Campus Private Tours — design tokens.
 *
 * The site ships BOTH themes and lets the visitor choose. Every colour below resolves to a
 * CSS variable defined twice in `app/globals.css`:
 *
 *   :root   → dark values  (the default, so a no-JS or pre-hydration render is already dark)
 *   .light  → light values (applied by the theme script when the visitor opts in)
 *
 * Channel triplets (`13 11 10`) rather than hex, so Tailwind's `<alpha-value>` slot keeps
 * working — `bg-surface/60` and `ring-brand/20` still resolve correctly.
 *
 * ── How to read the scales ─────────────────────────────────────────────────────────────
 *
 * `ink`, `gold`, `red`, `blue` and `emerald` are CONTRAST scales, not lightness scales:
 * the higher the number, the more it contrasts against the current canvas. So `ink-900` is
 * near-black in light mode and warm white in dark mode, and `text-ink-900` is correct in
 * both without a `dark:` variant. This is what lets ~70 component files be theme-agnostic.
 *
 * `maroon` is a FILL scale — deep enough to carry white text in either theme. It is not
 * readable as text on the canvas, so brand-coloured foregrounds use the `brand` tokens:
 * **`bg-maroon-*` for fills, `text-brand` / `border-brand` / `ring-brand` for foregrounds.**
 *
 * `ivory`, `cream` and `onbrand-accent` are THEME-INVARIANT. They are only used on
 * brand-filled bands and over photography, which stay dark in both themes — so they must
 * not follow the canvas.
 */

/** Token → `rgb(var(--token) / <alpha-value>)`, so opacity modifiers keep working. */
const t = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, t(`${name}-${s}`)]));

const FULL = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const SHORT = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  // Dark is the default, so "dark" means "the .light class is absent".
  darkMode: ['selector', ':root:not(.light)'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        /* Elevation ramp: canvas → canvas-alt → surface → surface-2 → 3 → 4 */
        canvas: t('canvas'),
        'canvas-alt': t('canvas-alt'),
        surface: t('surface'),
        'surface-2': t('surface-2'),
        'surface-3': t('surface-3'),
        'surface-4': t('surface-4'),

        /* Brand foregrounds (text, borders, rings) + soft brand fills. */
        brand: {
          DEFAULT: t('brand'),
          soft: t('brand-soft'),
          muted: t('brand-muted'),
          tint: t('brand-tint'),
          'tint-strong': t('brand-tint-strong'),
        },

        maroon: scale('maroon', FULL),
        gold: scale('gold', FULL),
        ink: scale('ink', FULL),
        red: scale('red', SHORT),
        emerald: scale('emerald', SHORT),
        blue: { ...scale('blue', SHORT), 950: t('blue-950') },

        verified: t('verified'),
        'verified-solid': t('verified-solid'),
        'danger-solid': t('danger-solid'),

        /* Theme-invariant — only for use on brand bands / over photography. */
        ivory: '#fbf8f3',
        cream: '#f6f0e7',
        'onbrand-accent': '#eccb72',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Headings use Inter too — a single, clean sans across the site.
        display: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Tabular numerics: prices, IDs.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'display-lg': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-0.03em' }],
      },
      /* Light elevation is a soft drop shadow; dark elevation is an inset top highlight
         plus a deep ambient shadow. Both live behind the same token name. */
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
        'brand-glow': 'var(--shadow-brand-glow)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'maroon-gradient': 'var(--grad-maroon)',
        'gold-sheen': 'var(--grad-gold)',
        'radial-fade': 'var(--grad-radial-fade)',
        'surface-glow': 'var(--grad-surface-glow)',
        'edge-fade': 'var(--grad-edge-fade)',
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
      /* @tailwindcss/typography injects its own `--tw-prose-*` variables, which default to
         the light-theme grey ramp. They are pointed at the token variables directly (no
         `<alpha-value>` slot, which would not resolve here) so prose follows the theme. */
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(var(--ink-700))',
            '--tw-prose-headings': 'rgb(var(--ink-900))',
            '--tw-prose-lead': 'rgb(var(--ink-600))',
            '--tw-prose-links': 'rgb(var(--brand))',
            '--tw-prose-bold': 'rgb(var(--ink-900))',
            '--tw-prose-counters': 'rgb(var(--ink-500))',
            '--tw-prose-bullets': 'rgb(var(--ink-300))',
            '--tw-prose-hr': 'rgb(var(--ink-200))',
            '--tw-prose-quotes': 'rgb(var(--ink-800))',
            '--tw-prose-quote-borders': 'rgb(var(--brand-muted))',
            '--tw-prose-captions': 'rgb(var(--ink-500))',
            '--tw-prose-kbd': 'rgb(var(--ink-900))',
            '--tw-prose-code': 'rgb(var(--ink-900))',
            '--tw-prose-pre-code': 'rgb(var(--ink-800))',
            '--tw-prose-pre-bg': 'rgb(var(--surface-2))',
            '--tw-prose-th-borders': 'rgb(var(--ink-200))',
            '--tw-prose-td-borders': 'rgb(var(--ink-100))',
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
