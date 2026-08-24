'use client';

import Link from 'next/link';
import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * The homepage's horizontal profile slider, shared by Featured tour guides and
 * Featured college counselors.
 *
 * Extracted rather than duplicated so the two sections are identical by
 * construction — card size, gap, snap behaviour, arrows and scroll step all live
 * here, and a change to one is a change to both.
 */

export interface ProfileCard {
  id: string;
  /** Bold three-line headline — the listing title / professional headline. */
  headline: string;
  /** Secondary line: a guide's school, a counselor's practice. */
  subtitle: string;
  name: string;
  photo: string;
  href: string;
}

function Card({ item }: { item: ProfileCard }) {
  return (
    <Link
      href={item.href}
      data-card
      className="group block w-[80vw] max-w-[288px] shrink-0 snap-start overflow-hidden rounded-2xl bg-surface transition-shadow duration-200 hover:shadow-lift sm:w-[288px]"
    >
      <div className="aspect-square overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.photo}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy" decoding="async"/>
      </div>

      <div className="px-1 py-4">
        <p className="line-clamp-3 text-[0.875rem] font-bold leading-snug text-ink-900">
          {item.headline}
        </p>
        {item.subtitle && <p className="mt-2 text-[0.8rem] text-ink-500">{item.subtitle}</p>}
        <p className="text-[0.8rem] text-ink-500">{item.name}</p>
      </div>
    </Link>
  );
}

/** Matches the card's silhouette so the strip doesn't jump when data lands. */
function CardSkeleton() {
  return (
    <div className="w-[80vw] max-w-[288px] shrink-0 sm:w-[288px]" aria-hidden="true">
      <div className="aspect-square animate-pulse rounded-2xl bg-ink-100" />
      <div className="px-1 py-4">
        <div className="h-3.5 w-full animate-pulse rounded bg-ink-100" />
        <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded bg-ink-100" />
        <div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-ink-100" />
      </div>
    </div>
  );
}

export function ProfileCarousel({
  title,
  subtitle,
  items,
  loading,
  empty,
}: {
  title: string;
  /** The "Browse all …" line under the heading. */
  subtitle: ReactNode;
  items: ProfileCard[];
  loading: boolean;
  /** Shown when loading has finished and there is nothing to display. */
  empty: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 308;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  // Arrows are pointless with nothing to scroll, and would sit over the empty state.
  const showArrows = !loading && items.length > 0;

  return (
    <section className="bg-surface py-10 sm:py-12">
      <div className="container-page mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h2>
        <p className="mt-3 text-[0.9rem] text-ink-600">{subtitle}</p>
      </div>

      <div className="relative">
        {showArrows && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={`Previous ${title.toLowerCase()}`}
            className="absolute left-3 top-[calc(50%-2rem)] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-700 shadow-md transition-shadow hover:shadow-lift"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {loading ? (
          <div className="overflow-hidden">
            <div className="flex gap-5 pl-4 pr-4 sm:pl-14 sm:pr-14">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : items.length > 0 ? (
          <div
            ref={scrollRef}
            className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="flex gap-5 pl-4 pr-4 sm:pl-14 sm:pr-14">
              {items.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="container-page">{empty}</div>
        )}

        {showArrows && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={`Next ${title.toLowerCase()}`}
            className="absolute right-3 top-[calc(50%-2rem)] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-700 shadow-md transition-shadow hover:shadow-lift"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}

/** Shared empty-state card, so both sections fail gracefully in the same way. */
export function CarouselEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-ink-300 bg-canvas-alt px-6 py-14 text-center">
      <p className="font-display text-xl font-semibold text-ink-900">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
    </div>
  );
}
