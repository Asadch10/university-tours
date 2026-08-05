// Shared design tokens — mirrors the website's Tailwind palette so mobile and web
// look like one brand (collegiate maroon + gold accent).
//
// The app ships BOTH themes with a toggle in the home header; dark is the default.
// React Native evaluates `StyleSheet.create` once at import, so a module-scope sheet
// freezes its colours — screens define `makeStyles(tc)` and call `useStyles(makeStyles)`
// inside the component instead. See theme-context.tsx.
import { Dimensions, PixelRatio } from 'react-native';

export type ThemeName = 'light' | 'dark';

/**
 * Palette shape. Keys are unchanged from the original light-only theme so existing
 * call sites keep compiling — only the *values* differ per theme.
 *
 * `ink` is a CONTRAST scale, not a lightness scale: ink900 is always the strongest
 * foreground against the canvas (near-black on light, near-white on dark). That is what
 * lets one set of token names serve both themes.
 */
export interface Palette {
  maroon900: string;
  maroon800: string;
  maroon700: string;
  maroon50: string;
  gold500: string;
  gold300: string;
  ink900: string;
  ink600: string;
  ink500: string;
  ink300: string;
  ink200: string;
  ink100: string;
  /** Page background. */
  ivory: string;
  /** Alternating band / subtle fill. */
  cream: string;
  /** Card + sheet surface. Named `white` for call-site compatibility; NOT #fff on dark. */
  white: string;
  danger: string;
  /** True white — for icons/text on a maroon fill or over photography, in both themes. */
  onBrand: string;

  /* Status chip pairs (background + foreground). Previously hardcoded pastels in
     MyToursScreen, which read as washed-out blocks on a dark canvas. */
  successBg: string;
  successFg: string;
  warnBg: string;
  warnFg: string;
  dangerBg: string;
  dangerFg: string;
}

export const lightColors: Palette = {
  maroon900: '#6b1521',
  maroon800: '#7a1a32',
  maroon700: '#9e2040',
  maroon50: '#fdf3f4',
  gold500: '#cf9526',
  gold300: '#eccb72',
  ink900: '#1f1a16',
  ink600: '#6c5b4b',
  ink500: '#85725f',
  ink300: '#bfb2a4',
  ink200: '#d9d1c8',
  ink100: '#ece8e3',
  ivory: '#fbf8f3',
  cream: '#f6f0e7',
  white: '#ffffff',
  danger: '#bd2c4d',
  onBrand: '#ffffff',

  successBg: '#e4f3ec',
  successFg: '#137a4d',
  warnBg: '#faf1d8',
  warnFg: '#8a6d1f',
  dangerBg: '#fbe9ec',
  dangerFg: '#bd2c4d',
};

/** Values mirror the website's `:root` (dark) block in apps/website/app/theme.css. */
export const darkColors: Palette = {
  maroon900: '#a32741', // fill — white text 6.3:1
  maroon800: '#b92e4b', // hover / active fill
  maroon700: '#c0304f',
  maroon50: '#25141a',  // soft brand tint
  gold500: '#e0aa3e',
  gold300: '#f0cd83',
  ink900: '#f7f3ef',    // primary text
  ink600: '#c2b8ae',
  ink500: '#a89c92',
  ink300: '#6f6459',
  ink200: '#4d443c',    // hairlines / field borders — lifted so inputs read clearly
  ink100: '#2b2521',
  ivory: '#0d0b0a',     // canvas
  cream: '#131010',     // canvas-alt
  white: '#1a1614',     // surface
  danger: '#e04b51',
  onBrand: '#ffffff',

  successBg: '#153123',
  successFg: '#4ecf94',
  warnBg: '#3a2c14',
  warnFg: '#e0aa3e',
  dangerBg: '#3a181a',
  dangerFg: '#f08c8f',
};

export const PALETTES: Record<ThemeName, Palette> = { light: lightColors, dark: darkColors };

/**
 * Fallback for modules that still import `colors` directly (module-scope const maps).
 * Dark, matching the app default — these do NOT react to the toggle; converted screens
 * use `useThemeColors()` / `useStyles()` instead.
 */
export const colors = darkColors;

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
