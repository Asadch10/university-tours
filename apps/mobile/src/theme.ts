// Shared design tokens — mirrors the website's Tailwind palette so mobile and web
// look like one brand (collegiate maroon + gold accent + warm ivory canvas).
import { Dimensions, PixelRatio } from 'react-native';

export const colors = {
  maroon900: '#6b1521', // crest maroon
  maroon800: '#7a1a32', // brand core / primary buttons
  maroon700: '#9e2040',
  maroon50: '#fdf3f4',

  gold500: '#cf9526', // accent core
  gold300: '#eccb72',

  ink900: '#1f1a16', // primary text
  ink600: '#6c5b4b',
  ink500: '#85725f', // muted text
  ink300: '#bfb2a4',
  ink200: '#d9d1c8', // borders
  ink100: '#ece8e3',

  ivory: '#fbf8f3', // warm canvas
  cream: '#f6f0e7',
  white: '#ffffff',
  danger: '#bd2c4d',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const spacing = (n: number) => n * 4;

// ── Responsive typography ────────────────────────────────────────────────────
// Font sizes scale with the device width so text looks right on small phones and
// large phones/tablets alike. Baseline is a 375pt-wide phone (iPhone 11/12/13).
const GUIDELINE_BASE_WIDTH = 375;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
// Clamp the ratio so tiny phones stay readable and tablets don't get huge text.
const WIDTH_SCALE = clamp(SCREEN_WIDTH / GUIDELINE_BASE_WIDTH, 0.9, 1.25);

/**
 * Responsive font size. `size` is the design value at the 375pt baseline; it's
 * nudged toward the device-width scale by `factor` (0 = never scale, 1 = scale
 * fully). 0.5 gives a gentle, professional adjustment.
 */
export function font(size: number, factor = 0.5): number {
  const scaled = size + (size * WIDTH_SCALE - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}
