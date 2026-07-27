// Shared design tokens — mirrors the website's Tailwind palette so mobile and web
// look like one brand (collegiate maroon + gold accent + warm ivory canvas).
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
