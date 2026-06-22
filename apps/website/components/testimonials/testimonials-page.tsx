'use client';

import { Star, Quote } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';

/* ─── Data ───────────────────────────────────────────────────────────── */

type Review = {
  kind: 'image' | 'text';
  quote: string;
  name: string;
  university: string;
  photo: string; // background photo (image card) or avatar (text card)
};

const REVIEWS: Review[] = [
  {
    kind: 'image',
    quote:
      'Highly recommend Amelia. She was knowledgeable, provided insights into both academic and social aspects of life at Indiana University, and was very friendly. Thanks Amelia!',
    name: 'Amelia O',
    university: 'Indiana University',
    photo: 'https://i.pravatar.cc/600?img=44',
  },
  {
    kind: 'text',
    quote:
      'Chloe was super nice and friendly! We went to the different campuses, and she answered all my questions perfectly. By the end, I felt like I really had a great picture of Cornell, so the tour was super helpful!',
    name: 'Chloe C',
    university: 'Cornell University',
    photo: 'https://i.pravatar.cc/120?img=47',
  },
  {
    kind: 'image',
    quote:
      'We had a great experience with Nicolas! He took the time to show us around the university and explained many interesting things about the campus and student life. He was very friendly and knowledgeable.',
    name: 'Nicolas G',
    university: 'New York University',
    photo: 'https://i.pravatar.cc/600?img=12',
  },
  {
    kind: 'text',
    quote:
      'My daughter loves music, and pre-law and Ian is a competitive student athlete — they clicked and we had a great tour. Highly recommend. Thanks Ian.',
    name: 'Ian S',
    university: 'Dartmouth College',
    photo: 'https://i.pravatar.cc/120?img=15',
  },
  {
    kind: 'image',
    quote:
      'Angel was really accommodating and shared his experience openly. We left understanding exactly what student life is like day to day.',
    name: 'Angel T',
    university: 'UC San Diego',
    photo: 'https://i.pravatar.cc/600?img=33',
  },
  {
    kind: 'text',
    quote:
      'Whitney catered her tour to our interests and really gave thought to what information would help us. She was very knowledgeable on a wide variety of issues and was a joy to spend the afternoon with.',
    name: 'Whitney W',
    university: 'Clemson University',
    photo: 'https://i.pravatar.cc/120?img=45',
  },
  {
    kind: 'image',
    quote:
      'Rory was such an amazing tour guide! We loved the school and also loved our time with her. This was the best way to experience UMich!',
    name: 'Rory P',
    university: 'University of Michigan',
    photo: 'https://i.pravatar.cc/600?img=32',
  },
  {
    kind: 'text',
    quote:
      'Yosef was an incredible tour guide — so welcoming, warm, and genuinely inspiring. He took the time to connect with both Matthew and Luke, and made the experience truly meaningful. We highly recommend him to any family visiting Stanford.',
    name: 'Yosef A',
    university: 'Stanford University',
    photo: 'https://i.pravatar.cc/120?img=13',
  },
  {
    kind: 'image',
    quote:
      'Jocelyn was a great guide and representative of Duke. She shared all the insights of campus life, and we were truly impressed with her knowledge and hospitality. We highly recommend Jocelyn.',
    name: 'Jocelyn M',
    university: 'Duke University',
    photo: 'https://i.pravatar.cc/600?img=5',
  },
  {
    kind: 'text',
    quote:
      'Informative, friendly, nice… who could ask for anything more!? Sonia gave us the inside scoop. She’s great!',
    name: 'Sonia P',
    university: 'UCLA',
    photo: 'https://i.pravatar.cc/120?img=20',
  },
  {
    kind: 'image',
    quote:
      'Outstanding! Christian was a phenomenal tour guide. Incredibly personable and knowledgeable. Cannot recommend him enough.',
    name: 'Christian V',
    university: 'University of Florida',
    photo: 'https://i.pravatar.cc/600?img=7',
  },
  {
    kind: 'text',
    quote:
      'Mathew is a bright, extremely personable and very positive tour guide. He knows the University of Michigan very well and gave us a comprehensive tour of the campus. I recommend Mathew very highly.',
    name: 'Matthew N',
    university: 'University of Michigan',
    photo: 'https://i.pravatar.cc/120?img=51',
  },
  {
    kind: 'text',
    quote:
      'Grey was fantastic and had a lot of information about everything we asked. He made the whole campus feel like home within an hour.',
    name: 'Grey M',
    university: 'University of Georgia',
    photo: 'https://i.pravatar.cc/120?img=68',
  },
  {
    kind: 'image',
    quote:
      'Vidhi was fun-loving, helpful, and ready to help us discover UPenn! She showed us everything that mattered to our family.',
    name: 'Vidhi P',
    university: 'University of Pennsylvania',
    photo: 'https://i.pravatar.cc/600?img=44',
  },
  {
    kind: 'text',
    quote:
      'Annalise was an absolute pleasure. She was very thoughtful, answered every question, and we left feeling confident about the school.',
    name: 'Annalise L',
    university: 'University of South Carolina',
    photo: 'https://i.pravatar.cc/120?img=25',
  },
];

/* ─── Sub-components ──────────────────────────────────────────────────── */

function Stars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16} className="fill-gold-500 text-gold-500" />
      ))}
    </div>
  );
}

function ImageCard({ r }: { r: Review }) {
  return (
    <figure className="relative mb-5 break-inside-avoid overflow-hidden rounded-2xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={r.photo} alt={r.name} loading="lazy" className="w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05) 100%)',
        }}
        aria-hidden
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
        <Quote size={26} className="mb-2 text-white/40" />
        <p className="text-[0.9rem] leading-relaxed text-white/95">{r.quote}</p>
        <p className="mt-4 text-sm font-bold">{r.name}</p>
        <p className="text-xs text-white/70">{r.university}</p>
      </figcaption>
    </figure>
  );
}

function TextCard({ r }: { r: Review }) {
  return (
    <figure className="relative mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-ink-50 p-6">
      <Quote
        size={28}
        className="pointer-events-none absolute right-5 top-5 text-ink-200"
        aria-hidden
      />
      <Stars />
      <blockquote className="mt-4 text-[0.92rem] leading-relaxed text-ink-700">
        {r.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.photo} alt={r.name} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <p className="text-sm font-bold text-ink-900">{r.name}</p>
          <p className="text-xs text-ink-500">{r.university}</p>
        </div>
      </figcaption>
    </figure>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */

export function TestimonialsPage() {
  return (
    <div className="bg-white pt-[var(--header-h)]">
      {/* Header */}
      <section className="container-page pb-12 pt-16 text-center sm:pt-20">
        <Reveal>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.1] text-ink-900 sm:text-5xl">
            See why thousands of families love and trust University Campus Private Tours
          </h1>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
            Read real reviews from students who got the inside scoop on a personalized campus tour.
          </p>
        </Reveal>

        {/* Trustpilot-style badge */}
        <Reveal delay={0.1}>
          <div className="mt-7 flex items-center justify-center gap-2.5">
            <span className="text-sm font-bold text-ink-900">Excellent</span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < 4 ? 'fill-emerald-500 text-emerald-500' : 'fill-emerald-300 text-emerald-300'}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-ink-900">Trustpilot</span>
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.15}>
          <div className="mx-auto mt-10 flex max-w-xl items-center justify-center divide-x divide-ink-200">
            {[
              { value: '1,000+', label: 'Guides' },
              { value: '100+', label: 'Schools' },
              { value: '4.98', label: 'Average rating', star: true },
            ].map((s) => (
              <div key={s.label} className="px-8 text-center first:pl-0 last:pr-0">
                <p className="flex items-center justify-center gap-1.5 font-display text-4xl font-bold text-ink-900 sm:text-[2.75rem]">
                  {s.star && <Star size={24} className="fill-gold-500 text-gold-500" />}
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-ink-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Masonry grid */}
      <section className="container-page pb-24">
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {REVIEWS.map((r, i) =>
            r.kind === 'image' ? <ImageCard key={i} r={r} /> : <TextCard key={i} r={r} />,
          )}
        </div>
      </section>
    </div>
  );
}
