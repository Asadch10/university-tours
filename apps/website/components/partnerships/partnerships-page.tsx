'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Plus, Star, Quote } from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ─── Assets ─────────────────────────────────────────────────────────── */

const HERO_MOCKUP =
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/a6/310e59dd73d18850c610fccdadcd5b50675292?auto=format&fit=clip&h=2400&w=2400&s=50449b5dfdc3af6219a6a30fbf07bde5';
const FEATURE_IMGS = [
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/eb/3773a92444bcc1ea0a3701f0e815971eb86aa3?auto=format&crop=edges&fit=crop&h=800&w=800&s=a1282f538341a9880ab754793e952a1a',
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/c9/f1f7511bc58ae931ec1ab428d9ce1130812b41?auto=format&crop=edges&fit=crop&h=800&w=800&s=491a7b503efd2d5156f446fcf70ffd1f',
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/fe/7945694e6228b5f81ece771a6e2b7ff9d9c00d?auto=format&crop=edges&fit=crop&h=800&w=800&s=a4eb1729e82e259080099ae4515e2cf7',
];

/* ─── Data ───────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    image: FEATURE_IMGS[0]!,
    title: 'Provide personalized engagement at scale',
    body: 'Today’s students want more than a one-size-fits-all campus tour. We complement your group tours with an individualized experience for every prospective student.',
  },
  {
    image: FEATURE_IMGS[1]!,
    title: 'Welcome more prospective students to campus',
    body: 'Offer campus tours on weekends, school breaks, and when group tours are full. For students who can’t visit in person, video chats provide a convenient way to connect.',
    link: { label: 'video chats', href: '/virtual-tours' },
  },
  {
    image: FEATURE_IMGS[2]!,
    title: 'Boost applications and improve yield',
    body: 'Leverage booking data to identify, engage, and enroll high-interest prospects and students considering your competitors. Reach the right students at the right time.',
  },
];

const PICK_GUIDES = [
  { name: 'Maggie L', university: 'Stanford University', photo: 'https://i.pravatar.cc/400?img=45', cls: 'mt-0' },
  { name: 'Mason', university: 'Brown University', photo: 'https://i.pravatar.cc/400?img=12', cls: 'mt-10' },
  { name: 'Sem F', university: 'Boston College', photo: 'https://i.pravatar.cc/400?img=33', cls: 'mt-0' },
  { name: 'Chesney Z', university: 'University of Alabama', photo: 'https://i.pravatar.cc/400?img=44', cls: '-mt-10' },
];

const TESTIMONIALS = [
  { name: 'Annalise', university: 'University of South Carolina', avatar: 'https://i.pravatar.cc/80?img=32', quote: 'Annalise was an absolute pleasure. She was very passionate about the school, opportunities and the people. She made me really want to apply to South Carolina.' },
  { name: 'Grey', university: 'University of Georgia', avatar: 'https://i.pravatar.cc/80?img=15', quote: 'Grey was fantastic and had a lot of information regarding everything on campus. He helped me get an idea of what my life at UGA would look like. Thank you, Grey.' },
  { name: 'Sobhi', university: 'Florida State University', avatar: 'https://i.pravatar.cc/80?img=20', quote: 'Sobhi was super engaging and took time to understand my interests and cater the tour to cover all interests.' },
  { name: 'Jessica', university: 'University of North Carolina', avatar: 'https://i.pravatar.cc/80?img=25', quote: 'Great tour! Professional and informative. Jessica answered so many questions and gave us a good idea what it means to be a Tarheel.' },
  { name: 'Madoury', university: 'Columbia University', avatar: 'https://i.pravatar.cc/80?img=51', quote: 'Madoury was a great guide and answered all my questions, showed me around the college, and was a current student — exactly what I wanted.' },
];

const FAQS = [
  { q: 'How does University Campus Private Tours help increase applications and yield?', a: 'By giving every prospective student a personalized, student-led experience, we deepen engagement and surface high-interest prospects — which boosts both applications and yield.' },
  { q: 'What kind of effort is required from our admissions team?', a: 'Very little. We handle guide recruitment, scheduling, and support. Your team simply benefits from the engagement data and increased visits.' },
  { q: 'Is the platform branded for my institution?', a: 'Yes — we offer institution-branded experiences so prospective students see a seamless extension of your school.' },
  { q: 'How are tour guides selected and trained?', a: 'Every guide is an enrollment-verified current student. We provide resources and guidance to help them host welcoming, informative tours.' },
  { q: 'What kinds of insights or data does the platform provide?', a: 'You get booking and engagement data that helps you identify, engage, and enroll high-interest prospective students.' },
  { q: 'Does it integrate with our CRM or existing tools?', a: 'Yes. We can integrate booking and engagement data with your CRM and existing admissions workflows.' },
  { q: 'How much does it cost to use the platform?', a: 'Pricing is tailored to your institution’s size and goals. Contact us and we’ll put together a plan that fits.' },
];

/* ─── Page ───────────────────────────────────────────────────────────── */

export function PartnershipsPage() {
  return (
    <div>
      <Hero />
      <Features />
      <PickGuide />
      <Impact />
      <Faq />
    </div>
  );
}

/* ── 1. Hero ─────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-maroon-gradient pt-[calc(var(--header-h)+3rem)] text-ivory">
      <div className="bg-grid absolute inset-0 opacity-25" aria-hidden />
      <div className="pointer-events-none absolute -right-20 top-10 h-96 w-96 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
      <div className="container-page relative text-center">
        <Reveal>
          <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-[1.1] sm:text-5xl">
            Personalized campus tours, powered by your students
          </h1>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ivory/80">
            We help admissions teams personalize every prospective student’s visit — boosting
            applications and yield.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <ButtonLink href="/contact" variant="gold" size="lg" className="mt-8">
            Contact us
          </ButtonLink>
        </Reveal>
      </div>

      {/* Product mockup */}
      <Reveal delay={0.15} className="container-page relative mt-14">
        <div className="overflow-hidden rounded-t-3xl shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_MOCKUP} alt="The platform on desktop and mobile" className="w-full object-cover" />
        </div>
      </Reveal>
    </section>
  );
}

/* ── 2. Features ─────────────────────────────────────────────────────── */

function Features() {
  return (
    <section className="bg-cream/40 py-20 sm:py-28">
      <div className="container-page">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            Leading universities partner with University Campus Private Tours
          </h2>
        </Reveal>
        <RevealGroup className="mt-14 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Reveal as="div" key={f.title}>
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.image} alt={f.title} loading="lazy" className="aspect-square w-full object-cover" />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-ink-600">
                {f.body.split(f.link?.label ?? ' ').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {f.link && i < arr.length - 1 && (
                      <Link href={f.link.href} className="font-medium text-maroon-900 hover:underline">
                        {f.link.label}
                      </Link>
                    )}
                  </span>
                ))}
              </p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ── 3. Pick your guide ──────────────────────────────────────────────── */

function PickGuide() {
  return (
    <section className="container-page py-20 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <h2 className="font-display text-4xl font-bold leading-[1.1] text-ink-900 sm:text-[2.75rem]">
            Let prospective students pick their guide
          </h2>
          <p className="mt-6 text-lg text-ink-600">Every student is unique. With us, every tour is too.</p>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Let prospective students book a tour with a{' '}
            <Link href="/search" className="font-medium text-maroon-900 hover:underline">
              guide they choose
            </Link>{' '}
            based on shared interests, hobbies, or backgrounds. Build trust through authenticity and
            showcase your campus diversity.
          </p>
          <ButtonLink href="/contact" variant="primary" size="lg" className="mt-8">
            Contact us
          </ButtonLink>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-5">
            {PICK_GUIDES.map((g) => (
              <div key={g.name} className={cn('relative overflow-hidden rounded-2xl shadow-card', g.cls)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.photo} alt={g.name} loading="lazy" className="aspect-[3/4] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10">
                  <p className="text-sm font-bold text-white">{g.name}</p>
                  <p className="text-xs text-white/80">{g.university}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 4. Real impact (dark carousel) ──────────────────────────────────── */

function Impact() {
  const scrollRef = useRef<HTMLDivElement>(null);
  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 320;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-5 sm:mx-7 lg:mx-10">
        <div className="overflow-hidden rounded-[2rem] bg-ink-900 px-6 py-14 sm:px-10">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              Real students. Real tours. Real impact.
            </h2>
            <p className="mt-4 text-white/60">You share the facts — let your students share the experience.</p>
          </div>

          <div className="relative mt-12">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
            >
              <ChevronLeft size={18} />
            </button>

            <div ref={scrollRef} className="overflow-x-hidden">
              <div className="flex gap-5 px-12">
                {TESTIMONIALS.map((t) => (
                  <article
                    key={t.name}
                    data-card
                    className="relative w-[320px] shrink-0 rounded-2xl bg-white/[0.04] p-6 ring-1 ring-inset ring-white/10"
                  >
                    <Quote size={28} className="absolute right-5 top-5 text-gold-400" />
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-bold text-white">{t.name}</p>
                        <p className="text-xs text-white/60">{t.university}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-[0.875rem] leading-relaxed text-white/80">{t.quote}</p>
                    <div className="mt-4 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={15} className="fill-gold-500 text-gold-500" />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 5. FAQ ──────────────────────────────────────────────────────────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="container-page py-16 sm:py-24">
      <Reveal>
        <h2 className="text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Frequently asked questions
        </h2>
      </Reveal>

      <div className="mx-auto mt-12 max-w-3xl">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="border-t border-ink-100 last:border-b">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className={cn(
                  'flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-5 text-left transition-colors',
                  isOpen ? 'bg-ink-50/70' : 'hover:bg-ink-50/70',
                )}
              >
                <span className="text-[0.95rem] font-bold text-ink-900 sm:text-base">{item.q}</span>
                <span className={cn('shrink-0 text-ink-400 transition-transform duration-300', isOpen && 'rotate-45 text-ink-700')}>
                  <Plus size={20} strokeWidth={1.75} />
                </span>
              </button>
              <div className={cn('overflow-hidden transition-all duration-300', isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0')}>
                <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ink-600">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Reveal>
        <div className="mx-auto mt-10 flex max-w-3xl flex-col items-start justify-between gap-4 rounded-3xl bg-ink-900 px-7 py-6 text-white sm:flex-row sm:items-center">
          <p className="font-display text-lg font-bold">Still have questions?</p>
          <div className="flex gap-3">
            <Link href="/faq" className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-white/90">
              Help Center
            </Link>
            <Link href="/contact" className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20">
              Contact us
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
