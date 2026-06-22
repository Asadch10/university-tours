'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────── */

type ImageCard = {
  kind: 'image';
  photo: string;
  rating: number;
  quote: string;
  name: string;
  university: string;
};

type TextCard = {
  kind: 'text';
  rating: number;
  quote: string;
  name: string;
  university: string;
  initials: string;
  avatarBg: string;
};

type ReviewCard = ImageCard | TextCard;

/* ─── Dummy data (alternating image / text cards) ────────────────────── */

const REVIEWS: ReviewCard[] = [
  {
    kind: 'image',
    photo: 'https://i.pravatar.cc/600?img=47',
    rating: 5,
    quote:
      'Highly recommend! She was knowledgeable, provided insights into both academic and social aspects of campus life, and was very friendly. Thanks so much!',
    name: 'Sarah L.',
    university: 'Stanford University',
  },
  {
    kind: 'text',
    rating: 5,
    quote:
      'Daniel was an incredible guide — so welcoming, warm, and genuinely inspiring. He took the time to connect with our whole family and made the experience truly meaningful. His journey gave our son a new level of motivation and confidence. We are so grateful and highly recommend him to any family.',
    name: 'James T.',
    university: 'Harvard University',
    initials: 'JT',
    avatarBg: '#6b1521',
  },
  {
    kind: 'image',
    photo: 'https://i.pravatar.cc/600?img=45',
    rating: 5,
    quote:
      'We had a great experience with Sofia! She took the time to show us around UCLA and explained many interesting things about campus life and the surrounding community.',
    name: 'Rachel M.',
    university: 'UCLA',
  },
  {
    kind: 'text',
    rating: 5,
    quote:
      'Aiden was fun-loving, helpful, and ready to help us discover NYU! He gave us an in-depth tour of the campus, including buildings relevant to my daughter\'s intended major and the residential halls. We highly recommend him to anyone wanting a fair and comprehensive overview.',
    name: 'Karen P.',
    university: 'New York University',
    initials: 'KP',
    avatarBg: '#7a1a32',
  },
  {
    kind: 'image',
    photo: 'https://i.pravatar.cc/600?img=44',
    rating: 5,
    quote:
      'Priya was such an amazing guide! We loved how she personalized the tour and made the whole family feel at home. Best way to experience any campus.',
    name: 'David N.',
    university: 'University of Michigan',
  },
  {
    kind: 'text',
    rating: 5,
    quote:
      'Olivia went above and beyond showing us UC Berkeley. Her passion and knowledge were exceptional and she helped us see the campus through a real student\'s eyes — from the best study cafés to the hidden spots that make Berkeley unique.',
    name: 'Tom W.',
    university: 'UC Berkeley',
    initials: 'TW',
    avatarBg: '#6b1521',
  },
  {
    kind: 'image',
    photo: 'https://i.pravatar.cc/600?img=15',
    rating: 5,
    quote:
      'Jordan gave us the most authentic Austin experience. He knew every secret spot and made the entire family feel welcome right from the first minute of the tour.',
    name: 'Mike B.',
    university: 'UT Austin',
  },
  {
    kind: 'text',
    rating: 5,
    quote:
      'Hannah was warm, insightful, and incredibly prepared. She took us on a tour of Columbia that no brochure could replicate. Our daughter left feeling excited and confident about her future there.',
    name: 'Lisa C.',
    university: 'Columbia University',
    initials: 'LC',
    avatarBg: '#7a1a32',
  },
];

/* ─── Sub-components ────────────────────────────────────────────────── */

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={17}
          className={
            i < rating
              ? 'fill-gold-500 text-gold-500'
              : 'fill-ink-200 text-ink-200'
          }
        />
      ))}
    </div>
  );
}

function ImgCard({ card }: { card: ImageCard }) {
  return (
    <article
      data-card
      className="relative h-[400px] w-72 shrink-0 overflow-hidden rounded-2xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.photo}
        alt={card.name}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {/* Bottom gradient for text legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)',
        }}
        aria-hidden
      />
      <footer className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <Stars rating={card.rating} />
        <blockquote className="mt-2 line-clamp-3 text-[0.8rem] leading-relaxed text-white/90">
          {card.quote}
        </blockquote>
        <div className="mt-3">
          <p className="text-sm font-semibold">{card.name}</p>
          <p className="text-xs text-white/65">{card.university}</p>
        </div>
      </footer>
    </article>
  );
}

function TxtCard({ card }: { card: TextCard }) {
  return (
    <article
      data-card
      className="relative flex h-[400px] w-72 shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 shadow-soft"
    >
      {/* Decorative large quote mark */}
      <span
        className="pointer-events-none absolute right-4 top-2 select-none font-display text-8xl font-bold leading-none text-ink-100"
        aria-hidden
      >
        "
      </span>

      <div className="relative">
        <Stars rating={card.rating} />
        <blockquote className="mt-4 line-clamp-6 text-[0.825rem] leading-relaxed text-ink-700">
          {card.quote}
        </blockquote>
      </div>

      <footer className="mt-4 flex items-center gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold text-white"
          style={{ background: card.avatarBg }}
        >
          {card.initials}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">{card.name}</p>
          <p className="text-xs text-ink-500">{card.university}</p>
        </div>
      </footer>
    </article>
  );
}

/* ─── Main section ───────────────────────────────────────────────────── */

export function TrustedReviews() {
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
        <h2 className="mx-auto max-w-xl font-display text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
          Trusted by thousands of families at top colleges nationwide
        </h2>

        {/* Rating badge */}
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <span className="text-sm font-semibold text-ink-900">Excellent</span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < 4
                    ? 'fill-emerald-500 text-emerald-500'
                    : 'fill-emerald-300 text-emerald-300'
                }
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-ink-900">Trustpilot</span>
        </div>
      </div>

      {/* ── Carousel ──────────────────────────────────────────────────
          Outer wrapper: relative, no overflow → arrows are children
          here and are NOT clipped by the inner scroll container.
          Inner scroll div: overflow-x hidden, scrollable via JS.     */}
      <div className="relative">

        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Previous reviews"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Cards strip — overflows are hidden; JS scrollBy drives motion */}
        <div
          ref={scrollRef}
          className="overflow-x-hidden"
        >
          <div className="flex gap-5 pl-14 pr-14">
            {REVIEWS.map((card, i) =>
              card.kind === 'image' ? (
                <ImgCard key={i} card={card} />
              ) : (
                <TxtCard key={i} card={card} />
              ),
            )}
          </div>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Next reviews"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
