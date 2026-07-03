import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { inter, plexMono } from './fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'UCPT Admin — Operations Console',
  description: 'University Campus Private Tours — admin operations console.',
  robots: { index: false, follow: false }, // operations console — never indexed
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh bg-white text-ink-900 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
