'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ─── Assets ─────────────────────────────────────────────────────────── */

const HERO_IMG =
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/46/a5b16ba0daa36261805b1deeca4a58806334b1?auto=format&crop=edges&fit=crop&h=1200&w=1200&s=aeffcda886463e57f69498e89c4cd9de';
const STEP_IMGS = [
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/51/e05564e60b1ec5a1a68e5c2d2f40238b309c23?auto=format&crop=edges&fit=crop&h=800&w=800&s=a0a680149ba1e38fd65e8761a1334d13',
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/a7/a26f55ab6170038ab8d5ca3216bf501a59da6c?auto=format&crop=edges&fit=crop&h=800&w=800&s=d284d6f5cffc03ed57d78100ee4f86e7',
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/b0/008943d7dbafe4a24cce938f3646db185830a0?auto=format&crop=edges&fit=crop&h=800&w=800&s=b094e5c6f3c1ab4ae864df767a610c91',
];

/* ─── Data ───────────────────────────────────────────────────────────── */

const STEPS = [
  {
    image: STEP_IMGS[0]!,
    title: '1. Share with your friends',
    body: 'Send your personal invite link to friends who’d make great student guides.',
  },
  {
    image: STEP_IMGS[1]!,
    title: '2. They host their first tour',
    body: 'Your friend signs up, gets verified, and welcomes their first prospective student to campus.',
  },
  {
    image: STEP_IMGS[2]!,
    title: '3. You get paid',
    body: 'Once their first tour is complete, we send $20 straight to you. Simple as that.',
  },
];

const FAQS = [
  {
    q: 'How does the Guide Referral Program work?',
    a: 'Share your personal invite link with friends. When someone signs up through your link, becomes a verified guide, and hosts their first tour, you earn $20.',
  },
  {
    q: 'When and how do I get paid?',
    a: 'You’re paid within a few days of your referred friend completing their first tour. Payouts are sent to the payment method connected to your guide account.',
  },
  {
    q: 'What counts as a qualifying referral?',
    a: 'A qualifying referral is a new guide who signs up through your invite link, completes verification, and hosts their first paid tour. Existing members don’t qualify.',
  },
  {
    q: 'Can I refer more than one person?',
    a: 'Absolutely. There’s no limit — invite as many friends as you’d like and earn $20 for every one of them who hosts their first tour.',
  },
  {
    q: 'Where can I get more information on the program?',
    a: 'Visit our Help Center or reach out to our team through the contact page and we’ll walk you through the details.',
  },
];

/* ─── Page ───────────────────────────────────────────────────────────── */

export function ReferPage() {
  return (
    <div className="bg-ivory">
      <Intro />
      <HowItWorks />
      <Faq />
    </div>
  );
}

/* ── 1. Intro ────────────────────────────────────────────────────────── */

function Intro() {
  return (
    <section className="container-page pt-[calc(var(--header-h)+4rem)] pb-20 sm:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-ink-900 sm:text-5xl">
            Refer a friend, earn $20
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-600">
            Invite your friends to University Campus Private Tours and earn $20 when they host their
            first tour.
          </p>
          <ButtonLink href="/register" variant="primary" size="lg" className="mt-8">
            Get your invite link
          </ButtonLink>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="overflow-hidden rounded-3xl shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMG}
              alt="Two friends chatting over coffee"
              className="aspect-square w-full object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 2. How referrals work (dark) ────────────────────────────────────── */

function HowItWorks() {
  return (
    <section className="bg-ink-900 py-20 text-white sm:py-28">
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">How referrals work</h2>
          <p className="mt-4 text-white/60">
            Invite as many friends as you’d like and earn $20 when they host their first tour.
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <Reveal as="div" key={s.title}>
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.title}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-white/70">{s.body}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ── 3. FAQ ──────────────────────────────────────────────────────────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="container-page py-20 sm:py-28">
      <Reveal>
        <h2 className="text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Referral Program FAQs
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
                <span
                  className={cn(
                    'shrink-0 text-ink-400 transition-transform duration-300',
                    isOpen && 'rotate-45 text-ink-700',
                  )}
                >
                  <Plus size={20} strokeWidth={1.75} />
                </span>
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-300',
                  isOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0',
                )}
              >
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
            <Link
              href="/faq"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-white/90"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20"
            >
              Contact us
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
