import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { inter, playfair } from './fonts';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  metadataBase: new URL('https://ucpt.example'),
  title: {
    default: 'University Campus Private Tours — Private tours led by real students',
    template: '%s · University Campus Private Tours',
  },
  description:
    'Book private campus tours and video consultations with verified current students. Discover universities, get honest insight, and see the real campus before you decide.',
  keywords: [
    'campus tours',
    'private university tours',
    'student ambassadors',
    'college visits',
    'virtual campus tour',
  ],
  openGraph: {
    type: 'website',
    title: 'University Campus Private Tours',
    description:
      'Private campus tours and video consultations with verified current students.',
    siteName: 'University Campus Private Tours',
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, playfair.variable)}>
      <body className="min-h-dvh bg-ivory text-ink-900 antialiased" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-maroon-900 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ivory"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
