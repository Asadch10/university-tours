'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Content & images ───────────────────────────────────────────────── */

const ITEMS = [
  {
    title: 'Private, personalized college tours',
    body: 'Unlike group tours that rush you through campus, our private tours are entirely focused on you. Your guide adapts to your pace, answers every question, and shows you the spots that matter most to your family.',
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1280px-Stanford_University_campus_in_2016.jpg',
    alt: 'Stanford campus walkway',
  },
  {
    title: 'Choose your own tour guide',
    body: "On a typical college tour, the school assigns you a guide. With University Campus Private Tours, you choose one who matches your interests and personality, so you get authentic insight from someone who truly gets you.",
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/1280px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg',
    alt: 'Harvard Yard',
  },
  {
    title: 'No scripts, just scoops',
    body: "Our student guides don't follow a script. They share what they actually know — the real dining halls, the best study spots, and the hidden gems that never make it into the admissions brochure.",
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/1280px-2019_UCLA_Royce_Hall_1.jpg',
    alt: 'UCLA Royce Hall',
  },
  {
    title: 'Find the school for you',
    body: "Whether you're choosing between two schools or exploring options for the first time, a private tour gives you the honest, unfiltered perspective you need to make a confident, informed decision.",
    image:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/1280px-Washington_Square_Park_in_2012.jpg',
    alt: 'Washington Square Park — NYU',
  },
];

/* ─── Component ─────────────────────────────────────────────────────── */

export function PersonalWay() {
  const [active, setActive] = useState(1); // "Choose your own tour guide" open by default

  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="container-page">

        {/* Heading */}
        <h2 className="text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          The more personal way to tour colleges
        </h2>

        {/* Two-column grid */}
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ── Left: accordion ──────────────────────────────────────── */}
          <div className="space-y-1">
            {ITEMS.map((item, i) => {
              const isOpen = active === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className={cn(
                      'flex w-full items-start justify-between gap-4 rounded-2xl px-5 py-5 text-left transition-colors duration-200',
                      isOpen ? 'bg-ink-50' : 'hover:bg-ink-50/60',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[0.95rem] font-bold leading-snug transition-colors',
                        isOpen ? 'text-ink-900' : 'text-ink-800',
                      )}
                    >
                      {item.title}
                    </span>
                    <span className="mt-0.5 shrink-0 text-ink-500">
                      {isOpen ? <X size={18} /> : <Plus size={18} />}
                    </span>
                  </button>

                  {/* Expanded body */}
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-premium',
                      isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0',
                    )}
                  >
                    <p className="px-5 pb-5 pt-1 text-[0.9rem] leading-relaxed text-ink-600">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: image panel — swaps on accordion change ───────── */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            {ITEMS.map((item, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={item.image}
                alt={item.alt}
                loading="lazy"
                className={cn(
                  'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
                  active === i ? 'opacity-100' : 'opacity-0',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
