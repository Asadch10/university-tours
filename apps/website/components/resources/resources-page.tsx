'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { universities } from '@/lib/data';
import { PHOTOS } from '@/lib/images';

/* ─── Assets ─────────────────────────────────────────────────────────── */

const HERO_BG = PHOTOS.library.src;
const CAFE_IMG = PHOTOS.studentsGroup.src;
const SOCIAL_IMG =
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/51/e05564e60b1ec5a1a68e5c2d2f40238b309c23?auto=format&crop=edges&fit=crop&h=800&w=800&s=a0a680149ba1e38fd65e8761a1334d13';

const uImg = (slug: string) => universities.find((u) => u.slug === slug)?.image ?? universities[0]!.image;

/* ─── Data ───────────────────────────────────────────────────────────── */

interface Resource {
  title: string;
  body: string;
  href: string;
  image: string;
}

const RESOURCES: Resource[] = [
  {
    title: 'Blog',
    body: 'Stay informed with articles on college applications, campus life, admissions insights, and student-led tour advice. Our blog gives students and families practical, up-to-date guidance for making smart college decisions.',
    href: '/blog',
    image: uImg('harvard'),
  },
  {
    title: 'Help Center',
    body: 'Find answers fast. Explore FAQs, step-by-step help articles, and support resources covering everything from booking tours to choosing a guide to navigating the platform.',
    href: '/help',
    image: CAFE_IMG,
  },
  {
    title: 'Social Media Templates',
    body: 'For guides: access ready-to-use social media templates that help you promote your tours, share your story, and attract more bookings with polished, engaging content.',
    href: '/become-a-guide',
    image: SOCIAL_IMG,
  },
  {
    title: 'For parents and families',
    body: 'Resources designed specifically for parents supporting their student’s college search. Learn how tours work, what to expect, and how to help your student evaluate fit and make confident decisions.',
    href: '/for-parents',
    image: uImg('ucla'),
  },
  {
    title: 'College partners',
    body: 'Learn how colleges work with us to support prospective applicants and strengthen campus visibility through authentic, personalized, student-led tours.',
    href: '/partnerships',
    image: uImg('uchicago'),
  },
];

/* ─── Page ───────────────────────────────────────────────────────────── */

export function ResourcesPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 380;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="relative flex min-h-[46vh] items-center overflow-hidden pt-[var(--header-h)] sm:min-h-[58vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO_BG} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" loading="eager" fetchPriority="high" decoding="async"/>
        <div className="absolute inset-0 bg-blue-950/25" aria-hidden />
        <div className="container-page relative py-16 text-center text-white sm:py-24">
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.1] drop-shadow-sm sm:text-5xl">
            Resource Center
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90 drop-shadow-sm">
            Discover resources and tools from University Campus Private Tours and our partners to
            support every step of your college search and admissions journey.
          </p>
        </div>
      </section>

      {/* Carousel */}
      <section className="py-16 sm:py-24">
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="absolute left-3 top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink-700 shadow-lift ring-1 ring-ink-200/60 transition-colors hover:bg-ink-50 sm:inline-flex sm:left-5"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-pl-5 px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-14"
          >
            {RESOURCES.map((r) => (
              <Link
                key={r.title}
                data-card
                href={r.href}
                className="group w-[80vw] max-w-[320px] shrink-0 snap-start sm:w-[340px] sm:max-w-none"
              >
                <div className="overflow-hidden rounded-2xl shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image}
                    alt={r.title}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105" decoding="async"/>
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-ink-900 transition-colors group-hover:text-brand">
                  {r.title}
                </h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-600">{r.body}</p>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="absolute right-3 top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-ink-700 shadow-lift ring-1 ring-ink-200/60 transition-colors hover:bg-ink-50 sm:inline-flex sm:right-5"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}
