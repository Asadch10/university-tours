'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── Dummy guide cards ──────────────────────────────────────────────── */

type GuideCard = {
  id: string;
  headline: string;
  university: string;
  name: string;
  photo: string;
  href: string;
};

const GUIDES: GuideCard[] = [
  {
    id: 'g1',
    headline: 'CS junior at Stanford sharing real research culture, dorm life, and the startup scene',
    university: 'Stanford University',
    name: 'Maya R.',
    photo: 'https://i.pravatar.cc/480?img=47',
    href: '/ambassadors/a1',
  },
  {
    id: 'g2',
    headline: 'Harvard Economics Senior guiding families through the House system and financial aid',
    university: 'Harvard University',
    name: 'Daniel O.',
    photo: 'https://i.pravatar.cc/480?img=12',
    href: '/ambassadors/a2',
  },
  {
    id: 'g3',
    headline: 'UCLA Film student giving behind-the-scenes campus tours with an Angeleno twist',
    university: 'UCLA',
    name: 'Sofia M.',
    photo: 'https://i.pravatar.cc/480?img=45',
    href: '/ambassadors/a3',
  },
  {
    id: 'g4',
    headline: 'Third-Year @ NYU; Finance + City Life — showing families how to navigate an urban campus',
    university: 'New York University',
    name: 'Aiden C.',
    photo: 'https://i.pravatar.cc/480?img=33',
    href: '/ambassadors/a4',
  },
  {
    id: 'g5',
    headline: 'Senior Pre-Med Student at the University of Michigan and orientation leader',
    university: 'University of Michigan',
    name: 'Priya N.',
    photo: 'https://i.pravatar.cc/480?img=44',
    href: '/ambassadors/a5',
  },
  {
    id: 'g6',
    headline: 'UT Austin CS Senior sharing Hook \'em Longhorn culture, dorms, and Austin startup scene',
    university: 'UT Austin',
    name: 'Jordan B.',
    photo: 'https://i.pravatar.cc/480?img=15',
    href: '/ambassadors/a6',
  },
  {
    id: 'g7',
    headline: 'Data Science junior at UC Berkeley exploring the Glade, cafés, and Bay Area energy',
    university: 'UC Berkeley',
    name: 'Olivia B.',
    photo: 'https://i.pravatar.cc/480?img=5',
    href: '/ambassadors/a7',
  },
  {
    id: 'g8',
    headline: 'Columbia Journalism student showing Morningside Heights and NYC life to visiting families',
    university: 'Columbia University',
    name: 'Hannah C.',
    photo: 'https://i.pravatar.cc/480?img=32',
    href: '/ambassadors/a9',
  },
];

/* ─── Card component ────────────────────────────────────────────────── */

function GuideCardItem({ guide }: { guide: GuideCard }) {
  return (
    <Link
      href={guide.href}
      data-card
      className="group block w-[288px] shrink-0 overflow-hidden rounded-2xl bg-white transition-shadow duration-200 hover:shadow-lift"
    >
      {/* Guide photo — square aspect ratio */}
      <div className="aspect-square overflow-hidden rounded-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={guide.photo}
          alt={guide.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      {/* Text content */}
      <div className="px-1 py-4">
        <p className="line-clamp-3 text-[0.875rem] font-bold leading-snug text-ink-900">
          {guide.headline}
        </p>
        <p className="mt-2 text-[0.8rem] text-ink-500">{guide.university}</p>
        <p className="text-[0.8rem] text-ink-500">{guide.name}</p>
      </div>
    </Link>
  );
}

/* ─── Section ───────────────────────────────────────────────────────── */

export function FeaturedGuides() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 308;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section className="bg-white py-10 sm:py-12">

      {/* Heading */}
      <div className="container-page mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Featured tour guides
        </h2>
        <p className="mt-3 text-[0.9rem] text-ink-600">
          Browse all tour guides{' '}
          <Link
            href="/search"
            className="text-maroon-900 underline-offset-2 hover:underline"
          >
            here
          </Link>
        </p>
      </div>

      {/* ── Carousel (same pattern as TrustedReviews) ────────────────── */}
      <div className="relative">

        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Previous guides"
          className="absolute left-3 top-[calc(50%-2rem)] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Cards strip */}
        <div ref={scrollRef} className="overflow-x-hidden">
          <div className="flex gap-5 pl-14 pr-14">
            {GUIDES.map((guide) => (
              <GuideCardItem key={guide.id} guide={guide} />
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Next guides"
          className="absolute right-3 top-[calc(50%-2rem)] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
