'use client';

import { Reveal } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    image: 'https://d3m810mf773mim.cloudfront.net/static/group-tours-features/built-for-groups.avif',
    title: 'Designed for groups of all sizes',
    desc: 'From groups of 5 to 100+, we help high schools, educational travel organizations, and college prep programs create meaningful college visits led by current students.',
    span: 'lg:col-span-2',
  },
  {
    image: 'https://d3m810mf773mim.cloudfront.net/static/group-tours-features/right-guide.avif',
    title: 'Get the right guide for your group',
    span: '',
  },
  {
    image: 'https://d3m810mf773mim.cloudfront.net/static/group-tours-features/flexible-pricing.avif',
    title: 'Flexible pricing for any budget',
    span: '',
  },
  {
    image: 'https://d3m810mf773mim.cloudfront.net/static/group-tours-features/dedicated-support.avif',
    title: 'Dedicated support from our team',
    span: '',
  },
];

export function GroupToursIntro() {
  return (
    <>
      {/* ── Hero (video) ──────────────────────────────────────────────── */}
      <section className="relative h-[72vh] min-h-[520px] overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-540p.mp4" type="video/mp4" />
          <source src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(8,6,6,0.82) 0%, rgba(8,6,6,0.45) 42%, rgba(8,6,6,0.12) 75%)',
          }}
          aria-hidden
        />
        <div className="container-page relative flex h-full items-end pb-14">
          <div>
            <Reveal>
              <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl">
                Private college tours for your group
              </h1>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">
                We help high schools, college prep programs, and educational travel groups organize
                personalized, student-led campus tours at colleges nationwide.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/contact" variant="primary" size="lg">
                  Schedule a group tour
                </ButtonLink>
                <ButtonLink href="/how-it-works" variant="outline-light" size="lg">
                  Learn more
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Intro + bento features ────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight text-ink-900 sm:text-[2.25rem]">
              Give your group a more meaningful college visit experience
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-ink-600">
              We help high schools, college prep programs, educational travel organizations, and
              student groups create more personal and informative college visits with private campus
              tours led by current students.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {[12, 45, 44].map((n) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={n} src={`https://i.pravatar.cc/80?img=${n}`} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                ))}
              </div>
              <span className="text-sm font-medium text-ink-600">Trusted by thousands of guests</span>
            </div>
          </Reveal>
        </div>

        {/* Bento */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((f) => (
            <Reveal as="div" key={f.title} className={f.span}>
              <div className="group relative h-[300px] overflow-hidden rounded-3xl lg:h-[420px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.image}
                  alt={f.title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)' }}
                  aria-hidden
                />
                <div className={cn('absolute inset-x-0 bottom-0 p-6', f.desc && 'lg:p-7')}>
                  <h3 className="font-display text-lg font-semibold text-white lg:text-xl">{f.title}</h3>
                  {f.desc && (
                    <p className="mt-2 max-w-md text-[0.85rem] leading-relaxed text-white/80">{f.desc}</p>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
