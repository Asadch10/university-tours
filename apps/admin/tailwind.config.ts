import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * University Campus Private Tours — Admin Portal design tokens.
 *
 * The console ships BOTH themes with a toggle, mirroring the public site (see
 * apps/website/design.md). Every colour resolves to a CSS variable defined twice in
 * `app/theme.css`:
 *
 *   :root   → dark values  (the default, so a no-JS or pre-hydration render is dark)
 *   .light  → light values (applied by the theme script when the admin opts in)
 *
 * Channel triplets (`99 102 241`) rather than hex, so `<alpha-value>` keeps working and
 * `bg-surface/60` / `ring-brand-500/20` still resolve.
 *
 * ── Scales ─────────────────────────────────────────────────────────────────────────
 *
 * `ink` and `gold` are CONTRAST scales, not lightness scales: higher = more contrast
 * against the current canvas. So `text-ink-900` is near-black in light mode and near-white
 * in dark, and every existing call site stays correct without a `dark:` variant.
 *
 * `brand` is BLUE and stays the console's identity. **`brand-500`/`brand-600` are byte
 * identical in both themes** so the primary button and active nav look exactly as they do
 * today. The high end (`brand-800`+) is the *text* end and flips: deep indigo on light,
 * pale indigo on dark. In short: `bg-brand-500` for fills, `text-brand-800` for foregrounds.
 */

const t = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, t(`${name}-${s}`)]));

const FULL = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  // Dark is the default, so "dark" means "the .light class is absent".
  darkMode: ['selector', ':root:not(.light)'],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem', xl: '2.5rem' },
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        canvas: t('canvas'),
        'canvas-alt': t('canvas-alt'),
        surface: t('surface'),
        'surface-2': t('surface-2'),
        'surface-3': t('surface-3'),
        'surface-4': t('surface-4'),

        brand: scale('brand', FULL),
        gold: scale('gold', FULL),
        ink: scale('ink', FULL),

        ivory: t('ivory'),
        cream: t('cream'),

        /* Console status palette (kept distinct from the brand scales). */
        info: t('info'),
        warn: t('warn'),
        danger: t('danger'),
        success: t('success'),
        verified: t('verified'),

        /* Solid counterparts, dark enough to carry white text at AA in both themes.
           One token cannot clear 4.5:1 both as text on the canvas AND as a fill under
           white text — on a near-black canvas those two requirements multiply to a
           constant, so the roles have to split. */
        'info-solid': t('info-solid'),
        'warn-solid': t('warn-solid'),
        'danger-solid': t('danger-solid'),
        'success-solid': t('success-solid'),

        red: { 600: t('red-600') },
        green: { 600: t('green-600') },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Headings use Inter too — a single, clean corporate sans across the console.
        display: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Tabular numerics: KPI values, money, IDs.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
        'ring-focus': 'var(--shadow-ring-focus)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'brand-gradient': 'var(--grad-brand)',
        'gold-sheen': 'var(--grad-gold)',
        'radial-fade': 'var(--grad-radial-fade)',
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
      /* @tailwindcss/typography injects its own --tw-prose-* variables, which default to
         the light grey ramp and would be invisible on the dark canvas. */
      typography: {
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(var(--ink-700))',
            '--tw-prose-headings': 'rgb(var(--ink-900))',
            '--tw-prose-links': 'rgb(var(--brand-800))',
            '--tw-prose-bold': 'rgb(var(--ink-900))',
            '--tw-prose-counters': 'rgb(var(--ink-500))',
            '--tw-prose-bullets': 'rgb(var(--ink-300))',
            '--tw-prose-hr': 'rgb(var(--ink-200))',
            '--tw-prose-quotes': 'rgb(var(--ink-800))',
            '--tw-prose-quote-borders': 'rgb(var(--ink-200))',
            '--tw-prose-code': 'rgb(var(--ink-900))',
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
