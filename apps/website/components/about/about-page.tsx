'use client';

import { useState } from 'react';
import { ArrowRight, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';
import { universities } from '@/lib/data';

/* ─── Assets ─────────────────────────────────────────────────────────── */

const HERO_BG = 'https://d3m810mf773mim.cloudfront.net/static/about-us-bg.webp';
const CAROUSEL = [
  'https://d3m810mf773mim.cloudfront.net/static/about-carousel-1.avif',
  'https://d3m810mf773mim.cloudfront.net/static/about-carousel-2.avif',
];

const img = (slug: string) => universities.find((u) => u.slug === slug)?.image ?? universities[0]!.image;

/* ─── Section data ───────────────────────────────────────────────────── */

const STATS = [
  { value: '1,000+', label: 'Active student guides' },
  { value: '150+', label: 'Partner universities' },
  { value: '25,000+', label: 'Successful tours' },
  { value: '4.9/5', label: 'Student satisfaction' },
  { value: '40,000+', label: 'Families helped' },
  { value: '12,000+', label: 'Virtual sessions' },
];

const VALUE_BLOCKS = [
  {
    eyebrow: 'Tailored to you',
    title: 'Personalized campus experiences',
    body: 'Every student’s journey is different. Instead of a one-size-fits-all walk, your guide adapts the tour to what matters to you — the programs, dorms, dining halls, and corners of campus that will actually shape your decision.',
    image: img('stanford'),
    alt: 'Students walking through a campus quad',
  },
  {
    eyebrow: 'Your guide, your match',
    title: 'Choose your own student guide',
    body: 'Connect with current students who share your intended major, career goals, hometown, or interests. When your guide gets you, the conversation goes deeper — and the insight is far more useful than a scripted script.',
    image: img('harvard'),
    alt: 'Student guide chatting with a visiting family',
  },
  {
    eyebrow: 'No scripts',
    title: 'Real student perspectives',
    body: 'Our guides share authentic experiences, not rehearsed admissions presentations. You hear the honest story — what they love, what surprised them, and the things the official brochure never mentions.',
    image: img('ucla'),
    alt: 'Students talking on campus steps',
  },
  {
    eyebrow: 'Ask anything',
    title: 'Answers that matter',
    body: 'Dorm life, academics, social scene, clubs, internships, safety, housing, and career opportunities — ask the questions families really care about and get straight, lived-in answers from someone on the inside.',
    image: img('nyu'),
    alt: 'Campus life and student community',
  },
];

const RESOURCES = [
  { label: 'Student stories', href: '/testimonials', image: img('harvard'), span: 'lg:col-span-2 lg:row-span-2', h: 'h-full min-h-[260px]' },
  { label: 'Virtual tours', href: '/virtual-tours', image: img('stanford'), span: '', h: 'h-[180px]' },
  { label: 'Parent resources', href: '/for-parents', image: img('umich'), span: '', h: 'h-[180px]' },
  { label: 'Campus life', href: '/universities', image: img('ucla'), span: 'lg:col-span-2', h: 'h-[180px]' },
  { label: 'Student ambassadors', href: '/search', image: img('nyu'), span: '', h: 'h-[180px]' },
  { label: 'University discovery', href: '/universities', image: img('berkeley'), span: '', h: 'h-[180px]' },
];

/* ─── Page ───────────────────────────────────────────────────────────── */

export function AboutPage() {
  return (
    <div className="bg-ivory">
      <Hero />
      <Stats />
      <Mission />
      <ValueBlocks />
      <StudentExperiences />
      <DiscoverUniversity />
      <Resources />
    </div>
  );
}

/* ── 1. Hero ─────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center overflow-hidden pt-[var(--header-h)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={HERO_BG} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, rgba(15,8,10,0.86) 0%, rgba(15,8,10,0.66) 45%, rgba(15,8,10,0.30) 100%)',
        }}
        aria-hidden
      />
      <div className="container-page relative py-20">
        <Reveal>
          <span className="eyebrow text-gold-300">
            <span className="h-px w-6 bg-gold-300/60" /> Our story
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">
            The more personal way to discover your university
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/80">
            University Campus Private Tours connects families with verified current students for
            private campus tours and honest video consultations — so every decision is made with
            real insight, not a brochure.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="mt-6 max-w-xl border-l-2 border-gold-400/70 pl-4 text-base italic text-ivory/75">
            Our mission: give every family the authentic student perspective they need to choose the
            right school with confidence.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/universities" variant="gold" size="lg">
              Explore universities <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="/search" variant="outline-light" size="lg">
              Browse student guides
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 2. Stats ────────────────────────────────────────────────────────── */

function Stats() {
  return (
    <section className="border-b border-ink-100 bg-white py-16 sm:py-20">
      <div className="container-page">
        <RevealGroup className="grid grid-cols-2 gap-x-6 gap-y-12 text-center md:grid-cols-3 lg:grid-cols-6">
          {STATS.map((s) => (
            <Reveal as="div" key={s.label}>
              <p className="font-display text-4xl font-bold text-maroon-900 sm:text-[2.75rem]">
                {s.value}
              </p>
              <p className="mt-2 text-sm text-ink-500">{s.label}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ── 3. Mission ──────────────────────────────────────────────────────── */

function Mission() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <span className="eyebrow">
            <span className="h-px w-6 bg-maroon-800/40" /> Why we exist
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
            Traditional tours weren’t built to help you decide
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="space-y-5 text-lg leading-relaxed text-ink-600">
          <p>
            A rushed group tour led by a scripted ambassador can’t answer the questions that keep
            families up at night. You walk the same path as fifty strangers and leave with the same
            polished story everyone else heard.
          </p>
          <p>
            Choosing a university is one of the most important decisions a family makes — yet most of
            the information comes from brochures and admissions presentations designed to impress,
            not to inform.
          </p>
          <p>
            We built University Campus Private Tours so families can sit down with someone who
            actually lives it. A current student who shares your interests can give you honest,
            grounded context: what the dorms are really like, how the academics feel, where students
            spend their time, and whether it’s the right fit for <em>you</em>.
          </p>
          <p className="font-medium text-ink-800">
            Real perspective leads to confident decisions. That’s the entire reason we’re here.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 4. Value blocks ─────────────────────────────────────────────────── */

function ValueBlocks() {
  return (
    <section className="bg-cream/50 py-20 sm:py-28">
      <div className="container-page space-y-20 sm:space-y-28">
        {VALUE_BLOCKS.map((b, i) => {
          const reversed = i % 2 === 1;
          return (
            <div
              key={b.title}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <Reveal className={reversed ? 'lg:order-2' : ''}>
                <div className="overflow-hidden rounded-3xl shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt={b.alt}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-premium hover:scale-[1.03]"
                  />
                </div>
              </Reveal>
              <Reveal delay={0.1} className={reversed ? 'lg:order-1' : ''}>
                <span className="eyebrow">
                  <span className="h-px w-6 bg-maroon-800/40" /> {b.eyebrow}
                </span>
                <h3 className="mt-4 font-display text-3xl font-semibold text-ink-900 sm:text-[2.25rem]">
                  {b.title}
                </h3>
                <p className="mt-5 text-lg leading-relaxed text-ink-600">{b.body}</p>
              </Reveal>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 5. Real student experiences (carousel) ──────────────────────────── */

const STORY_SLIDES = [
  {
    image: CAROUSEL[0]!,
    title: 'Real conversations, not rehearsed pitches',
    body: 'Families sit down with students who answer honestly — the kind of conversation that changes how you see a school.',
  },
  {
    image: CAROUSEL[1]!,
    title: 'Mentorship that lasts beyond the tour',
    body: 'Many guests stay in touch with their guide long after the visit, turning a tour into genuine mentorship.',
  },
  {
    image: CAROUSEL[0]!,
    title: 'The campus, seen through a student’s eyes',
    body: 'From hidden study spots to the best dining halls, you experience campus the way students actually live it.',
  },
];

function StudentExperiences() {
  const [index, setIndex] = useState(0);
  const slide = STORY_SLIDES[index]!;
  const go = (d: number) =>
    setIndex((i) => (i + d + STORY_SLIDES.length) % STORY_SLIDES.length);

  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-px w-6 bg-maroon-800/40" /> Real experiences
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Real students. Real campus moments.
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Authentic experiences and genuine mentorship — the heart of every tour.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12">
          <div className="relative overflow-hidden rounded-3xl shadow-lift">
            <div className="relative aspect-[16/9] sm:aspect-[21/9]">
              {STORY_SLIDES.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={s.image}
                  alt={s.title}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                    i === index ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ))}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(10,6,8,0.85) 0%, rgba(10,6,8,0.2) 55%, transparent 100%)',
                }}
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
                <Quote className="text-gold-300" size={32} />
                <h3 className="mt-3 max-w-xl font-display text-2xl font-semibold text-ivory sm:text-3xl">
                  {slide.title}
                </h3>
                <p className="mt-2 max-w-lg text-ivory/80">{slide.body}</p>
              </div>

              {/* Arrows */}
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
                className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-md transition-colors hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next"
                className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-md transition-colors hover:bg-white"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-5 flex justify-center gap-2">
            {STORY_SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-7 bg-maroon-900' : 'w-2 bg-ink-300 hover:bg-ink-400'
                }`}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 6. Discover your dream university ───────────────────────────────── */

function DiscoverUniversity() {
  const collage = [
    { src: img('harvard'), cls: 'col-span-2 row-span-2 h-full min-h-[260px]' },
    { src: img('stanford'), cls: 'h-[150px]' },
    { src: img('ucla'), cls: 'h-[150px]' },
    { src: img('nyu'), cls: 'h-[150px]' },
    { src: img('umich'), cls: 'h-[150px]' },
  ];
  return (
    <section className="bg-cream/50 py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="eyebrow">
            <span className="h-px w-6 bg-maroon-800/40" /> Start exploring
          </span>
          <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-ink-900 sm:text-[2.75rem]">
            Discover your dream university
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-600">
            Browse hundreds of campuses, meet the students who know them best, and book a private
            tour or video consultation in minutes. Your next chapter starts with one honest
            conversation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/universities" variant="primary" size="lg">
              Find your university <ArrowRight size={18} />
            </ButtonLink>
            <ButtonLink href="/search" variant="outline" size="lg">
              Explore student guides
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-3 grid-rows-2 gap-4">
            {collage.map((c, i) => (
              <div key={i} className={`overflow-hidden rounded-2xl ${c.cls}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-premium hover:scale-[1.05]"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 7. Resources & quick links (bento) ──────────────────────────────── */

function Resources() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-px w-6 bg-maroon-800/40" /> Helpful resources
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Everything families need, in one place
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid auto-rows-[180px] grid-cols-2 gap-4 lg:grid-cols-4">
          {RESOURCES.map((r) => (
            <Reveal as="div" key={r.label} className={r.span}>
              <a
                href={r.href}
                className="group relative block h-full overflow-hidden rounded-3xl shadow-soft transition-shadow hover:shadow-lift"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(10,6,8,0.78) 0%, rgba(10,6,8,0.15) 60%, transparent 100%)',
                  }}
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                  <span className="font-display text-lg font-semibold text-ivory">{r.label}</span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-ivory ring-1 ring-inset ring-white/30 transition-colors group-hover:bg-white group-hover:text-maroon-900">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
