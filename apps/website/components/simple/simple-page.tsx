import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Lightweight layout for short marketing/info pages: a two-column hero (copy +
 * one image) and an optional row of three points. Keeps these pages minimal and
 * consistent so no footer link 404s.
 */
export function SimplePage({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  cta,
  points,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  imageAlt: string;
  cta?: { href: string; label: string };
  points?: { title: string; body: string }[];
  children?: ReactNode;
}) {
  return (
    <main className="bg-surface pt-[var(--header-h)]">
      <div className="container-page py-12 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">{eyebrow}</span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-600">{intro}</p>
            {cta && (
              <Link
                href={cta.href}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-maroon-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
              >
                {cta.label} <ArrowRight size={16} />
              </Link>
            )}
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-ink-100 bg-ink-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={imageAlt} className="h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async"/>
          </div>
        </div>

        {points && points.length > 0 && (
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {points.map((p) => (
              <div key={p.title} className="rounded-2xl border border-ink-200/70 bg-surface p-6 shadow-soft">
                <h3 className="font-display text-lg font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.body}</p>
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </main>
  );
}
