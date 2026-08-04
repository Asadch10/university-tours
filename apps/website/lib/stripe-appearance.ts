import type { Appearance } from '@stripe/stripe-js';
import type { Theme } from '@/lib/theme';

/**
 * Stripe Elements renders inside a cross-origin iframe, so none of the site's CSS or
 * Tailwind tokens reach it — the card form has to be themed through this object or it
 * ships in the wrong theme in the middle of checkout.
 *
 * Values mirror `app/theme.css`. Note that Stripe reads `appearance` only when Elements
 * mounts, so callers must remount on a theme change — see the `key={theme}` on <Elements>
 * in booking-payment.tsx and payments-settings.tsx.
 */
const DARK: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#f0879b', // brand
    colorBackground: '#221d1a', // surface-2
    colorText: '#f7f3ef', // ink-900
    colorTextSecondary: '#a89c92', // ink-500
    colorTextPlaceholder: '#8d8177', // ink-400
    colorDanger: '#e04b51', // red-600
    colorIcon: '#a89c92',
    borderRadius: '12px',
    fontFamily: 'inherit',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #3a322c', boxShadow: 'none' },
    '.Input:focus': {
      border: '1px solid #f0879b',
      boxShadow: '0 0 0 3px rgba(240,135,155,0.14)',
    },
    '.Input--invalid': { border: '1px solid #e04b51', boxShadow: 'none' },
    '.Label': { color: '#c2b8ae', fontWeight: '600' },
    '.Tab': { backgroundColor: '#221d1a', border: '1px solid #3a322c', color: '#c2b8ae' },
    '.Tab:hover': { backgroundColor: '#2b2521' },
    '.Tab--selected': {
      backgroundColor: '#2b2521',
      border: '1px solid #f0879b',
      color: '#f7f3ef',
    },
    '.Error': { color: '#e04b51' },
  },
};

const LIGHT: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#7a1a32', // brand-soft
    colorBackground: '#ffffff', // surface
    colorText: '#1f1a16', // ink-900
    colorTextSecondary: '#85725f', // ink-500
    colorTextPlaceholder: '#9f8e7c', // ink-400
    colorDanger: '#dc2626', // red-600
    colorIcon: '#85725f',
    borderRadius: '12px',
    fontFamily: 'inherit',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': { border: '1px solid #d9d1c8', boxShadow: 'none' },
    '.Input:focus': {
      border: '1px solid #7a1a32',
      boxShadow: '0 0 0 3px rgba(107,21,33,0.08)',
    },
    '.Input--invalid': { border: '1px solid #dc2626', boxShadow: 'none' },
    '.Label': { color: '#6c5b4b', fontWeight: '600' },
    '.Tab': { backgroundColor: '#f7f5f3', border: '1px solid #d9d1c8', color: '#6c5b4b' },
    '.Tab:hover': { backgroundColor: '#ece8e3' },
    '.Tab--selected': {
      backgroundColor: '#ffffff',
      border: '1px solid #7a1a32',
      color: '#1f1a16',
    },
    '.Error': { color: '#dc2626' },
  },
};

export function stripeAppearanceFor(theme: Theme): Appearance {
  return theme === 'light' ? LIGHT : DARK;
}
