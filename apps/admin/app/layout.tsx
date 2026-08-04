import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { inter, plexMono } from './fonts';
import { Providers } from './providers';
import { ThemeProvider, THEME_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'UCPT Admin — Operations Console',
  description: 'University Campus Private Tours — admin operations console.',
  robots: { index: false, follow: false }, // operations console — never indexed
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning on <html>: the pre-paint script below mutates its class
    // list, so the client tree legitimately differs from the server HTML.
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* MUST run before first paint, otherwise a light-theme admin sees a dark flash
            on every navigation. Inline and synchronous by design. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-canvas text-ink-900 antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
