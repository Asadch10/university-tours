import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared layout for legal pages (Terms, Privacy). Deliberately light — a clean
 * white page with a small icon badge and a single related campus photo, instead
 * of a full maroon banner. The page's legal copy is passed as `children` inside a
 * standard prose container.
 */
export function LegalShell({
  icon: Icon,
  title,
  updated,
  intro,
  image,
  imageAlt,
  children,
}: {
  icon: LucideIcon;
  title: string;
  updated: string;
  intro: string;
  image: string;
  imageAlt: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-white pt-[var(--header-h)]">
      <div className="container-page py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-maroon-50 text-maroon-800">
              <Icon size={17} aria-hidden />
            </span>
            Legal
          </div>

          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm font-medium text-ink-400">Last updated: {updated}</p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">{intro}</p>

          {/* Related campus photo — slim banner, neutral overlay (no red) */}
          <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-3xl border border-ink-100 bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/25 via-transparent to-transparent" aria-hidden />
          </div>

          {/* Legal copy */}
          <div className="prose prose-ink mt-12 max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:font-medium prose-a:text-maroon-800 hover:prose-a:text-maroon-900">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
