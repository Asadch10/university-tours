import { Inter, IBM_Plex_Mono } from 'next/font/google';

/**
 * Corporate console type system: Inter for all UI + headings (clean, neutral, highly legible),
 * IBM Plex Mono for tabular numerics (KPI values, money, IDs) so financial figures align.
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});
