'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Bell,
  DollarSign,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { universities } from '@/lib/data';

const HERO_IMAGE = 'https://d3m810mf773mim.cloudfront.net/static/guide-hero.jpg';
const STEP_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Stanford_University_campus_in_2016.jpg/1280px-Stanford_University_campus_in_2016.jpg';

/* ─── Data ───────────────────────────────────────────────────────────── */

const TESTIMONIALS = [
  {
    name: 'Nicolas G',
    university: 'New York University',
    photo: 'https://i.pravatar.cc/600?img=12',
    quote:
      'We had a great experience with Nicolas! He took the time to show us around the university and explained many interesting things about campus life.',
  },
  {
    name: 'Rory P',
    university: 'University of Michigan',
    photo: 'https://i.pravatar.cc/600?img=45',
    quote:
      'Rory was such an amazing tour guide! We loved the school and also loved our time with her. This was the best way to experience campus.',
  },
  {
    name: 'Amelia O',
    university: 'Indiana University',
    photo: 'https://i.pravatar.cc/600?img=44',
    quote:
      'Highly recommend Amelia. She was knowledgeable, provided insights into both academic and social aspects of life at Indiana.',
  },
  {
    name: 'Riley S',
    university: 'Auburn University',
    photo: 'https://i.pravatar.cc/600?img=5',
    quote:
      'Riley was absolutely fantastic. She clearly knows her way around both the campus and Auburn’s traditions. She was wonderful.',
  },
  {
    name: 'Marcus T',
    university: 'Duke University',
    photo: 'https://i.pravatar.cc/600?img=33',
    quote:
      'Marcus made our visit unforgettable. He answered every question and showed us the spots that really matter to students.',
  },
  {
    name: 'Hannah C',
    university: 'UC San Diego',
    photo: 'https://i.pravatar.cc/600?img=32',
    quote:
      'Hannah was warm, insightful, and incredibly prepared. Our daughter left feeling excited and confident about her future.',
  },
];

const STEPS = [
  {
    title: 'Become a guide',
    body: 'Are you a college student? Sign up and share a few details about yourself, your studies, and your interests. It’s free and takes just 2 minutes.',
  },
  {
    title: 'Respond to Tour Requests',
    body: 'Get notified when a guest requests a tour with you. Accept or decline tours based on your availability.',
  },
  {
    title: 'Host tours, get paid',
    body: 'Meet your guest on campus or connect over video. Talk openly about your college experience and earn $40/hour.',
  },
];

const FAQS = [
  { q: 'How do I become a guide?', a: 'Sign up with your school email, complete a short profile about your studies and interests, and you’ll be ready to accept tour requests in minutes.' },
  { q: 'How much do I get paid?', a: 'Guides earn $40/hour for both in-person campus tours and video consultations. You keep the majority of every booking.' },
  { q: 'When do I get paid?', a: 'Payouts are sent to your bank account shortly after each completed tour — typically within a few business days.' },
  { q: 'How do I get booked?', a: 'Families browse guides by school and book directly. A complete profile with photos and a friendly headline gets the most requests.' },
  { q: 'Do I need to set my availability in advance?', a: 'No. You accept or decline each request based on your schedule — there’s no minimum commitment.' },
  { q: 'What happens after I accept a Tour Request?', a: 'You’ll be connected with the guest to coordinate the time and meeting point, and you can message them directly in the app.' },
  { q: 'How do I message my guest?', a: 'Once a tour is confirmed, an in-app chat opens so you can share details and answer questions before the visit.' },
  { q: 'What if I need to cancel a tour?', a: 'Life happens. You can cancel from your dashboard — just give as much notice as possible so the guest can re-book.' },
  { q: 'How long are tours?', a: 'Most tours run 60–90 minutes, but you and your guest can agree on a length that works for both of you.' },
  { q: 'Do I need prior tour guide experience?', a: 'Not at all. If you know and love your campus, you’re qualified. We provide tips to help you host a great tour.' },
];

/* ─── Page ───────────────────────────────────────────────────────────── */

export function GuideLanding() {
  return (
    <div className="pt-[var(--header-h)]">
      <Hero />
      <MeetGuides />
      <BringSchoolToLife />
      <HostingSection />
    </div>
  );
}

/* ─── 1. Hero ────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="container-page grid items-center gap-8 py-12 sm:gap-10 lg:grid-cols-2 lg:gap-12 lg:py-16">
      {/* Left */}
      <div>
        <h1 className="font-display text-4xl font-bold leading-[1.05] text-ink-900 sm:text-5xl lg:text-6xl">
          Become a guide
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-600">
          Earn $40/hour in your free time.
          <br />
          Get started in 2 minutes.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-maroon-900 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
          >
            Get started
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm font-semibold text-ink-900 hover:text-ink-600"
          >
            How it works
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {[12, 45, 33].map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={n}
                src={`https://i.pravatar.cc/80?img=${n}`}
                alt=""
                className="h-9 w-9 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
          <span className="text-sm font-medium text-ink-600">Join 1,000+ guides</span>
        </div>
      </div>

      {/* Right — image with floating cards */}
      <div className="relative">
        <div className="overflow-hidden rounded-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="Student guides on campus" className="aspect-[4/5] w-full object-cover sm:aspect-[4/3]" />
        </div>

        {/* New Tour Request */}
        <div className="absolute left-4 top-4 hidden items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-lift sm:flex">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-maroon-900 text-white">
            <Bell size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">New Tour Request</p>
            <p className="text-xs text-ink-500">From John · You’ll earn $80</p>
          </div>
        </div>

        {/* Payout */}
        <div className="absolute right-4 top-20 hidden items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-lift sm:flex">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
            <DollarSign size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">$360.00</p>
            <p className="text-xs text-ink-500">Payout to bank</p>
          </div>
        </div>

        {/* Tour confirmed */}
        <div className="absolute bottom-6 left-4 hidden items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-lift sm:flex">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check size={16} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900">Tour confirmed</p>
            <p className="text-xs text-ink-500">Sat · 2:00 PM</p>
          </div>
        </div>

        {/* Rating */}
        <div className="absolute bottom-6 right-4 hidden rounded-2xl bg-white px-4 py-3 shadow-lift sm:block">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className="fill-gold-500 text-gold-500" />
            ))}
          </div>
          <p className="mt-1 text-xs font-medium text-ink-600">Loved by families</p>
        </div>
      </div>
    </section>
  );
}

/* ─── 2. Meet our guides ─────────────────────────────────────────────── */

function MeetGuides() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 300;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-5 sm:mx-7 lg:mx-10">
        <div className="overflow-hidden rounded-[2rem] bg-black px-6 py-12 sm:px-10 lg:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_2fr]">
            {/* Left */}
            <div>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Meet our guides
              </h2>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-white/60">
                See the impact our guides have on prospective students
              </p>
              <Link
                href="/register"
                className="mt-7 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-white/90"
              >
                Become a guide
              </Link>
              <div className="mt-7 flex gap-3">
                <button
                  type="button"
                  onClick={() => scrollBy(-1)}
                  aria-label="Previous"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollBy(1)}
                  aria-label="Next"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Carousel */}
            <div ref={scrollRef} className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-5">
                {TESTIMONIALS.map((t) => (
                  <article
                    key={t.name}
                    data-card
                    className="relative h-[420px] w-[75vw] max-w-[270px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[270px]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.photo} alt={t.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)',
                      }}
                      aria-hidden
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <span className="font-display text-4xl font-bold leading-none text-white/80">“</span>
                      <p className="mt-1 line-clamp-4 text-[0.85rem] leading-relaxed text-white/90">
                        {t.quote}
                      </p>
                      <p className="mt-3 text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-white/65">{t.university}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 3. Bring your school to life ───────────────────────────────────── */

function BringSchoolToLife() {
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const list = universities.filter((u) =>
    !search.trim() ? true : u.name.toLowerCase().includes(search.toLowerCase()),
  );

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : 260;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="container-page text-center">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
          Bring your school to life as a guide
        </h2>
        <div className="mx-auto mt-7 flex max-w-md items-center gap-2.5 rounded-full border border-ink-200 bg-white px-5 py-3 shadow-sm focus-within:border-maroon-800/40">
          <Search size={16} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="relative mt-10">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Previous schools"
          className="absolute left-3 top-[36%] z-10 hidden -translate-y-1/2 sm:inline-flex sm:h-11 sm:w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronLeft size={20} />
        </button>

        <div ref={scrollRef} className="overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-4 pl-4 pr-4 sm:gap-5 sm:pl-14 sm:pr-14">
            {list.map((u) => (
              <div key={u.slug} data-card className="w-[60vw] max-w-[240px] shrink-0 snap-start sm:w-[240px]">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.image} alt={u.name} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <p className="mt-3 text-sm font-bold text-ink-900">{u.name}</p>
                <p className="text-xs text-ink-500">{u.ambassadors} guides</p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Next schools"
          className="absolute right-3 top-[36%] z-10 hidden -translate-y-1/2 sm:inline-flex sm:h-11 sm:w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-md transition-shadow hover:shadow-lift"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}

/* ─── 4. Hosting steps + FAQ (tabbed) ────────────────────────────────── */

function HostingSection() {
  const [tab, setTab] = useState<'steps' | 'faqs'>('steps');
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="container-page py-12 sm:py-20">
      <h2 className="text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
        {tab === 'steps' ? 'Start hosting in 3 easy steps' : 'Your hosting questions, answered'}
      </h2>

      {/* Tabs */}
      <div className="mt-7 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setTab('steps')}
          className={cn(
            'rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
            tab === 'steps' ? 'bg-maroon-900 text-white' : 'text-ink-900 hover:bg-ink-50',
          )}
        >
          Become a guide
        </button>
        <button
          type="button"
          onClick={() => setTab('faqs')}
          className={cn(
            'rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
            tab === 'faqs' ? 'bg-maroon-900 text-white' : 'text-ink-900 hover:bg-ink-50',
          )}
        >
          FAQs
        </button>
      </div>

      {/* Steps */}
      {tab === 'steps' ? (
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-square overflow-hidden rounded-3xl lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={STEP_IMAGE} alt="Student guides on campus" className="h-full w-full object-cover" />
          </div>

          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const active = activeStep === i;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    'flex w-full gap-5 rounded-2xl border-l-2 px-6 py-5 text-left transition-colors',
                    active ? 'border-maroon-900 bg-ink-50/60' : 'border-transparent hover:bg-ink-50/40',
                  )}
                >
                  <span
                    className={cn(
                      'font-display text-2xl font-bold',
                      active ? 'text-maroon-900' : 'text-ink-300',
                    )}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3
                      className={cn(
                        'font-display text-xl font-bold',
                        active ? 'text-ink-900' : 'text-ink-400',
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        'mt-2 text-[0.95rem] leading-relaxed',
                        active ? 'text-ink-700' : 'text-ink-400',
                      )}
                    >
                      {step.body}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* FAQ */
        <div className="mx-auto mt-10 max-w-3xl">
          {FAQS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={item.q} className="border-t border-ink-100 last:border-b">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-6 text-left transition-colors',
                    isOpen ? 'bg-ink-50/70' : 'hover:bg-ink-50/70',
                  )}
                >
                  <span className="text-base font-bold text-ink-900 sm:text-[1.05rem]">{item.q}</span>
                  <span
                    className={cn(
                      'shrink-0 text-ink-400 transition-transform duration-300',
                      isOpen && 'rotate-45 text-ink-700',
                    )}
                  >
                    <Plus size={22} strokeWidth={1.75} />
                  </span>
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300',
                    isOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0',
                  )}
                >
                  <p className="px-5 pb-6 text-[0.95rem] leading-relaxed text-ink-600">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-14 text-center">
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-maroon-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
        >
          Get started <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
