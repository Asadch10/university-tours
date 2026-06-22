'use client';

import { Reveal } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';

const HERO = 'https://d3m810mf773mim.cloudfront.net/static/parents-hero.avif';
const SPLIT_1 = 'https://d3m810mf773mim.cloudfront.net/static/parents-split-1.avif';
const SPLIT_2 = 'https://d3m810mf773mim.cloudfront.net/static/parents-split-2.avif';

export function ParentsPage() {
  return (
    <div className="bg-white pt-[var(--header-h)]">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative h-[68vh] min-h-[460px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO} alt="A parent and child exploring a campus together" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(10,8,8,0.72) 0%, rgba(10,8,8,0.35) 40%, transparent 70%)',
          }}
          aria-hidden
        />
        <div className="container-page relative flex h-full items-end pb-14">
          <Reveal>
            <h1 className="max-w-xl font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
              Help your child choose the right school with confidence
            </h1>
          </Reveal>
        </div>
      </section>

      {/* ── Intro ─────────────────────────────────────────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="font-display text-3xl font-bold leading-tight text-ink-900 sm:text-[2.25rem]">
              Find the right fit with real insights from real students
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-ink-600">
              Choosing where to go to college is a big decision for students — and for parents too.
              It’s a huge investment, and it can be scary to trust your teenager to understand which
              school is best for their future self. Whether you’re just starting the search or have
              already received the acceptance letter, a private campus tour can help your child (and
              you) make good, informed decisions.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Split 1 — image left, text right ──────────────────────────── */}
      <section className="container-page pb-16 sm:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SPLIT_1}
                alt="A father and son laughing together on campus"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-premium hover:scale-[1.03]"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2.25rem]">
              Every tour is 100% tailored to your child
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              Our tours aren’t meant to replace the regular Admissions Office tour — that’s a great
              way to get the basics. But with University Campus Private Tours your child can choose a
              guide who is “like me” (however they define it), so they’ll learn about the school from
              someone they really identify with. Your guide shares honest, unscripted opinions and
              discusses their own experience adjusting to college.
            </p>
            <ButtonLink href="/search" variant="primary" size="lg" className="mt-8">
              Browse guides
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* ── Split 2 — text left, image right ──────────────────────────── */}
      <section className="container-page pb-20 sm:pb-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="lg:order-1">
            <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2.25rem]">
              Help your child find their dream school
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              Your guide will ask questions and tailor the tour to what’s most important to your
              child. A private tour gives your child a chance to ask the questions they might not
              want to ask on a large group tour. This personalized approach gives your child the best
              chance to be happy and successful at college.
            </p>
            <ButtonLink href="/how-it-works" variant="primary" size="lg" className="mt-8">
              Learn more
            </ButtonLink>
          </Reveal>
          <Reveal delay={0.1} className="lg:order-2">
            <div className="overflow-hidden rounded-3xl shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SPLIT_2}
                alt="A student and parent talking on campus"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-premium hover:scale-[1.03]"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
