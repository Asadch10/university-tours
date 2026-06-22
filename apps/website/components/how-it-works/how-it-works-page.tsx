'use client';

import { useState } from 'react';
import {
  Plus,
  UserCheck,
  Footprints,
  Video,
  CalendarCheck,
  ShieldCheck,
  MessageCircle,
  Users,
  MapPin,
} from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';
import { universities } from '@/lib/data';

const img = (slug: string) => universities.find((u) => u.slug === slug)?.image ?? universities[0]!.image;

/* ─── Process data ───────────────────────────────────────────────────── */

const PROCESS = {
  book: {
    image: img('harvard'),
    alt: 'A family choosing a student guide on a laptop',
    steps: [
      {
        title: 'Choose your university & guide',
        body: 'Search universities and browse available student ambassadors. Filter by major, interests, hobbies, background, or experience to find the guide who best matches your goals.',
      },
      {
        title: 'Book your tour',
        body: 'Pick a date and time, choose an in-person or virtual tour, and submit your request. Your guide confirms within 24 hours — you’re only charged once they accept.',
      },
      {
        title: 'Get real student insights',
        body: 'Meet your guide on campus or over video. Ask about academics, housing, social life, clubs, internships, safety, dining, and careers — and get honest, authentic answers.',
      },
    ],
  },
  host: {
    image: img('stanford'),
    alt: 'A current student hosting a tour from their laptop',
    steps: [
      {
        title: 'Become a guide',
        body: 'Are you a college student? Sign up and share a few details about yourself, your studies, and your interests. It’s free and takes just 2 minutes.',
      },
      {
        title: 'Respond to Tour Requests',
        body: 'Get notified when a guest requests a tour with you. Accept or decline based on your availability — there’s no minimum commitment.',
      },
      {
        title: 'Host tours, get paid',
        body: 'Meet your guest on campus or connect over video. Talk openly about your college experience and earn $40/hour, paid out after every tour.',
      },
    ],
  },
};

const BENEFITS = [
  { icon: UserCheck, title: 'Personalized experience', body: 'Tours built around your interests, major, and questions.' },
  { icon: Footprints, title: 'Student-led tours', body: 'Hosted by current students who live the experience daily.' },
  { icon: Video, title: 'Virtual tours available', body: 'Can’t travel? Connect over video from anywhere.' },
  { icon: CalendarCheck, title: 'Flexible scheduling', body: 'Book a time that works for your family.' },
  { icon: ShieldCheck, title: 'Verified student guides', body: 'Every guide is an enrollment-verified current student.' },
  { icon: MessageCircle, title: 'Honest answers', body: 'Real perspective, never a rehearsed pitch.' },
  { icon: Users, title: 'Family friendly', body: 'Parents and students are welcome on every tour.' },
  { icon: MapPin, title: 'Universities nationwide', body: 'Explore hundreds of campuses across the country.' },
];

const FAQ_GROUPS = [
  {
    category: 'General',
    items: [
      { q: 'What is University Campus Private Tours?', a: 'A marketplace that connects families with verified current students for private campus tours and video consultations — so you get honest, first-hand insight before choosing a school.' },
      { q: 'How does the platform work?', a: 'Search a university, pick a student guide who matches your interests, request a date and time, and meet them in person or over video. You’re only charged when the guide accepts.' },
      { q: 'How is this different from university admissions tours?', a: 'Admissions tours are large group walks led by an assigned, scripted ambassador. Ours are private, personalized, and led by a guide you choose — with no script and no rush.' },
      { q: 'Can parents join?', a: 'Absolutely. Parents and students are welcome on every tour, in person or on a video call.' },
    ],
  },
  {
    category: 'Booking',
    items: [
      { q: 'How do I book a tour?', a: 'Choose a guide, select a date and time, pick in-person or virtual, and submit your request. Your guide confirms within 24 hours.' },
      { q: 'Can I book virtual tours?', a: 'Yes. Video consultations let you connect live with a current student from anywhere in the world.' },
      { q: 'How long are tours?', a: 'Most tours run 60–90 minutes, but you and your guide can agree on a length that suits you.' },
      { q: 'Can I cancel or reschedule?', a: 'Yes — you can cancel or reschedule from your dashboard. Please give as much notice as possible.' },
    ],
  },
  {
    category: 'For guides',
    items: [
      { q: 'How do student ambassadors join?', a: 'Sign up with your school email, complete a short profile, and start accepting tour requests in minutes — it’s free.' },
      { q: 'How are guides verified?', a: 'We confirm current enrollment for every guide before they can host, so families always meet a real student.' },
      { q: 'How do guides get paid?', a: 'Guides earn $40/hour, paid securely to their bank account shortly after each completed tour.' },
    ],
  },
];

/* ─── Page ───────────────────────────────────────────────────────────── */

export function HowItWorksPage() {
  return (
    <div className="bg-ivory pt-[var(--header-h)]">
      <Process />
      <Benefits />
      <Faq />
    </div>
  );
}

/* ── Process (tabbed 3 steps) ────────────────────────────────────────── */

function Process() {
  const [tab, setTab] = useState<'book' | 'host'>('book');
  const [activeStep, setActiveStep] = useState(0);
  const data = PROCESS[tab];

  function switchTab(t: 'book' | 'host') {
    setTab(t);
    setActiveStep(0);
  }

  return (
    <section className="bg-cream/50 py-16 sm:py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Book or host a tour in 3 easy steps
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            A simple, transparent process built around trust and real student perspective.
          </p>
        </Reveal>

        {/* Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-ink-200 bg-white p-1 shadow-sm">
            {(['book', 'host'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={cn(
                  'rounded-full px-6 py-2.5 text-sm font-semibold transition-colors',
                  tab === t ? 'bg-maroon-900 text-white shadow-sm' : 'text-ink-700 hover:text-ink-900',
                )}
              >
                {t === 'book' ? 'Book a tour' : 'Host a tour'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-card lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.image} alt={data.alt} className="aspect-[4/5] w-full object-cover sm:aspect-square" />
            </div>
          </Reveal>

          <div className="space-y-2">
            {data.steps.map((step, i) => {
              const active = activeStep === i;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(i)}
                  className={cn(
                    'flex w-full gap-5 rounded-2xl border-l-2 px-6 py-5 text-left transition-colors',
                    active ? 'border-maroon-900 bg-white shadow-soft' : 'border-ink-200 hover:bg-white/60',
                  )}
                >
                  <span className={cn('font-display text-2xl font-bold', active ? 'text-maroon-900' : 'text-ink-300')}>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className={cn('font-display text-xl font-bold', active ? 'text-ink-900' : 'text-ink-400')}>
                      {step.title}
                    </h3>
                    <p className={cn('mt-2 text-[0.95rem] leading-relaxed', active ? 'text-ink-700' : 'text-ink-400')}>
                      {step.body}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 4. Benefits ─────────────────────────────────────────────────────── */

function Benefits() {
  return (
    <section className="bg-cream/50 py-16 sm:py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-px w-6 bg-maroon-800/40" /> What you get
          </span>
          <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Built for confident decisions
          </h2>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <Reveal as="div" key={title}>
              <div className="flex h-full flex-col rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-maroon-50 text-maroon-900">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-ink-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{body}</p>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ── 5. FAQ ──────────────────────────────────────────────────────────── */

function Faq() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="py-16 sm:py-24">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          {FAQ_GROUPS.map((group, gi) => (
            <Reveal as="div" key={group.category}>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-maroon-800">
                {group.category}
              </p>
              {group.items.map((item, i) => {
                const key = `${gi}-${i}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="border-t border-ink-100 last:border-b">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : key)}
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
