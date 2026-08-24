'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useUniversities } from '@/lib/schools';

/* ─── School artwork ─────────────────────────────────────────────────────
   The carousel is driven by the live catalog (`GET /api/v1/schools`) so it can
   only ever link to a school that actually has a page — it used to be a
   hardcoded list of twelve, half of which 404'd. Schools without an uploaded
   image fall back to a campus photo we've matched by slug, then to a generic
   one, so a new school still renders before anyone uploads artwork. */

const CAMPUS_PHOTOS: Record<string, string> = {
  harvard:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/960px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg',
  stanford:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/960px-Stanford_University_campus_in_2016.jpg',
  ucla: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/960px-2019_UCLA_Royce_Hall_1.jpg',
  nyu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/960px-Washington_Square_Park_in_2012.jpg',
};

const GENERIC_CAMPUS = '/photos/campus-exterior.webp';

/* ─── Component ──────────────────────────────────────────────────────── */

export function PopularSchools() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { universities, loading } = useUniversities();

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 240;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  // Nothing published yet — don't render an empty carousel.
  if (!loading && universities.length === 0) return null;

  const showArrows = universities.length > 4;

  return (
    <section className="bg-surface py-10 sm:py-12">

      {/* Heading */}
      <div className="container-page mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Popular schools
        </h2>
        <p className="mt-3 text-[0.9rem] text-ink-600">
          Explore all schools{' '}
          <Link href="/universities" className="text-brand underline-offset-2 hover:underline">
            here
          </Link>
        </p>
      </div>

      {/* ── Carousel ─────────────────────────────────────────────────── */}
      <div className="relative">

        {/* Left arrow */}
        {showArrows && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous schools"
            className="absolute left-3 top-[140px] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-700 shadow-md transition-shadow hover:shadow-lift"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Cards strip — overflow-x-auto enables touch swipe; scrollbar hidden */}
        <div ref={scrollRef} className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-4 pl-4 pr-4 sm:gap-5 sm:pl-14 sm:pr-14">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[55vw] max-w-[210px] shrink-0 sm:w-[210px]">
                    <div className="aspect-[3/4] animate-pulse rounded-2xl bg-ink-100" />
                    <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-ink-100" />
                  </div>
                ))
              : universities.map((school) => (
                  <Link
                    key={school.id}
                    href={school.href}
                    data-card
                    className="group block w-[55vw] max-w-[210px] shrink-0 snap-start sm:w-[210px]"
                  >
                    {/* Portrait card image — 3:4 ratio */}
                    <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-ink-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={school.image ?? CAMPUS_PHOTOS[school.id] ?? GENERIC_CAMPUS}
                        alt={school.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" decoding="async"/>
                    </div>

                    {/* Name below card */}
                    <p className="mt-3 text-sm font-bold leading-snug text-ink-900 group-hover:text-ink-700">
                      {school.name}
                    </p>
                  </Link>
                ))}
          </div>
        </div>

        {/* Right arrow */}
        {showArrows && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next schools"
            className="absolute right-3 top-[140px] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-700 shadow-md transition-shadow hover:shadow-lift"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}
