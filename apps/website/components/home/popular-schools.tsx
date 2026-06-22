'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── School data ────────────────────────────────────────────────────── */

type School = {
  id: string;
  name: string;
  image: string;
  href: string;
};

const SCHOOLS: School[] = [
  {
    id: 'harvard',
    name: 'Harvard University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/960px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg',
    href: '/universities/harvard',
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/960px-Stanford_University_campus_in_2016.jpg',
    href: '/universities/stanford',
  },
  {
    id: 'ucla',
    name: 'University of California, Los Angeles',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/960px-2019_UCLA_Royce_Hall_1.jpg',
    href: '/universities/ucla',
  },
  {
    id: 'cornell',
    name: 'Cornell University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/960px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg',
    href: '/universities/cornell',
  },
  {
    id: 'nyu',
    name: 'New York University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/960px-Washington_Square_Park_in_2012.jpg',
    href: '/universities/nyu',
  },
  {
    id: 'umich',
    name: 'University of Michigan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/960px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg',
    href: '/universities/umich',
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Washington_Square_Park_in_2012.jpg/960px-Washington_Square_Park_in_2012.jpg',
    href: '/universities/columbia',
  },
  {
    id: 'duke',
    name: 'Duke University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/960px-Stanford_University_campus_in_2016.jpg',
    href: '/universities/duke',
  },
  {
    id: 'yale',
    name: 'Yale University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/960px-2019_UCLA_Royce_Hall_1.jpg',
    href: '/universities/yale',
  },
  {
    id: 'princeton',
    name: 'Princeton University',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg/960px-Harvard_Yard%2C_Harvard_University%2C_Cambridge_MA.jpg',
    href: '/universities/princeton',
  },
  {
    id: 'berkeley',
    name: 'UC Berkeley',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/960px-Stanford_University_campus_in_2016.jpg',
    href: '/universities/berkeley',
  },
  {
    id: 'utexas',
    name: 'UT Austin',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/2019_UCLA_Royce_Hall_1.jpg/960px-2019_UCLA_Royce_Hall_1.jpg',
    href: '/universities/utexas',
  },
];

/* ─── Component ──────────────────────────────────────────────────────── */

export function PopularSchools() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 240;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section className="bg-white py-10 sm:py-12">

      {/* Heading */}
      <div className="container-page mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Popular schools
        </h2>
        <p className="mt-3 text-[0.9rem] text-ink-600">
          Explore all schools{' '}
          <Link href="/universities" className="text-maroon-900 underline-offset-2 hover:underline">
            here
          </Link>
        </p>
      </div>

      {/* ── Carousel ─────────────────────────────────────────────────── */}
      <div className="relative">

        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Previous schools"
          className="absolute left-3 top-[140px] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Cards strip */}
        <div ref={scrollRef} className="overflow-x-hidden">
          <div className="flex gap-5 pl-14 pr-14">
            {SCHOOLS.map((school) => (
              <Link
                key={school.id}
                href={school.href}
                data-card
                className="group block w-[210px] shrink-0"
              >
                {/* Portrait card image — 3:4 ratio */}
                <div className="aspect-[3/4] overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={school.image}
                    alt={school.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
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
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Next schools"
          className="absolute right-3 top-[140px] z-10 -translate-y-1/2 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}
