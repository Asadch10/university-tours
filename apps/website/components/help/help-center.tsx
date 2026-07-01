'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Data ───────────────────────────────────────────────────────────── */

interface Faq {
  q: string;
  a: string;
}
interface Category {
  id: string;
  label: string;
  faqs: Faq[];
}

const CATEGORIES: Category[] = [
  {
    id: 'general',
    label: 'General support',
    faqs: [
      {
        q: 'What is University Campus Private Tours?',
        a: 'We connect prospective students and families with real college students for private, 1-on-1 campus tours and video chats — so every visit is personal, honest, and built around your questions.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click “Sign up” in the top-right corner, enter your details, and verify your email. You can browse schools and guides freely, and an account lets you book tours and message guides.',
      },
      {
        q: 'Is University Campus Private Tours affiliated with the universities?',
        a: 'No. We’re an independent marketplace connecting families with current students. Tours reflect authentic student perspectives, not official university messaging.',
      },
    ],
  },
  {
    id: 'choosing-colleges',
    label: 'Choosing colleges',
    faqs: [
      {
        q: 'How do I decide which colleges to visit?',
        a: 'Start with your intended major, location preferences, and budget, then browse our schools and read guide profiles. A short video consultation is a great low-cost way to narrow your list before traveling.',
      },
      {
        q: 'Can a guide help me compare schools?',
        a: 'Yes. Many families book video chats with guides at different schools to compare campus culture, academics, and student life directly from people who live it.',
      },
    ],
  },
  {
    id: 'tours',
    label: 'Campus tours',
    faqs: [
      {
        q: 'What happens on a private campus tour?',
        a: 'You meet your student guide on campus for a personalized walk through the places that matter to you — dorms, dining, classrooms, and the spots the official tour skips. You set the pace and the questions.',
      },
      {
        q: 'How long is a typical tour?',
        a: 'Most tours run about 60–90 minutes, though you can arrange a longer visit with your guide when booking.',
      },
      {
        q: 'Do you offer virtual tours?',
        a: 'Absolutely. Choose a video consultation to explore a campus live from anywhere, with a screen-shared map and a recording you can keep.',
      },
    ],
  },
  {
    id: 'choosing-guide',
    label: 'Choosing a tour guide',
    faqs: [
      {
        q: 'How do I pick the right guide?',
        a: 'Browse guides by major, interests, languages, price, and rating. Pick someone who shares your goals or background — the conversation goes deeper and the insight is far more useful.',
      },
      {
        q: 'Can I message a guide before booking?',
        a: 'Yes. You can chat 1:1 with a guide from the moment you send a request. Contact details stay masked until a booking is accepted for everyone’s safety.',
      },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing, payment and cancellations',
    faqs: [
      {
        q: 'How much do tours cost?',
        a: 'Each guide sets their own rate, shown on their profile. You’ll always see the full price before you confirm — no hidden fees.',
      },
      {
        q: 'When am I charged?',
        a: 'Your card is only charged once a guide accepts your booking request. Payments are processed securely through Stripe.',
      },
      {
        q: 'What is your cancellation policy?',
        a: 'You can cancel for a full refund up to 24 hours before your scheduled tour. Cancellations inside 24 hours may be non-refundable depending on the guide’s policy.',
      },
    ],
  },
  {
    id: 'safety',
    label: 'Safety and accessibility',
    faqs: [
      {
        q: 'How do you keep tours safe?',
        a: 'Every guide is an enrollment-verified current student, contact details stay masked until booking, and payments run through a secure processor. You can report any concern to our team at any time.',
      },
      {
        q: 'Are tours accessible?',
        a: 'Let your guide know your accessibility needs when booking and they’ll adapt the route. For anything we can’t accommodate in person, a video consultation is always available.',
      },
    ],
  },
  {
    id: 'becoming-guide',
    label: 'Becoming a tour guide',
    faqs: [
      {
        q: 'How do I become a guide?',
        a: 'Visit our “Become a guide” page, complete the application, and verify your current enrollment. Once approved, you can set your rates and start hosting tours.',
      },
      {
        q: 'How and when do guides get paid?',
        a: 'Guides are paid securely after each completed tour, directly to their connected payout method. You set your own prices and schedule.',
      },
    ],
  },
];

/* ─── Component ───────────────────────────────────────────────────────── */

export function HelpCenter() {
  const [active, setActive] = useState<string>(CATEGORIES[0]!.id);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const visible = useMemo(() => {
    if (searching) {
      return CATEGORIES.map((c) => ({
        ...c,
        faqs: c.faqs.filter(
          (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
        ),
      })).filter((c) => c.faqs.length > 0);
    }
    return CATEGORIES.filter((c) => c.id === active);
  }, [searching, q, active]);

  const hasResults = visible.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-25" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-16 text-center sm:py-20">
          <h1 className="mx-auto max-w-2xl font-display text-4xl font-bold leading-[1.1] sm:text-5xl">
            Help Center
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ivory/80">
            Find answers to common questions. Still need help?{' '}
            <Link href="/contact" className="font-semibold text-gold-300 underline-offset-4 hover:underline">
              Contact us
            </Link>
            .
          </p>

          <div className="relative mx-auto mt-8 max-w-xl">
            <Search
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search FAQs"
              className="w-full rounded-full border border-white/20 bg-white py-3.5 pl-12 pr-5 text-ink-900 shadow-lift placeholder:text-ink-400 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
            />
          </div>
        </div>
      </section>

      {/* Category filters */}
      {!searching && (
        <section className="border-b border-ink-100 bg-ivory">
          <div className="container-page py-5">
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((c) => {
                const isActive = c.id === active;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActive(c.id);
                      setOpen(null);
                    }}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-maroon-900 text-ivory'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="bg-ivory py-14 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            {searching && (
              <p className="mb-6 text-sm text-ink-500">
                {hasResults
                  ? `Showing results for “${query}”`
                  : `No results for “${query}”. Try a different search.`}
              </p>
            )}

            {visible.map((cat) => (
              <div key={cat.id} className="mb-10 last:mb-0">
                <h2 className="mb-2 font-display text-2xl font-semibold text-ink-900">
                  {cat.label}
                </h2>
                <div>
                  {cat.faqs.map((item) => {
                    const key = `${cat.id}-${item.q}`;
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
                          <span className="text-[0.95rem] font-bold text-ink-900 sm:text-base">
                            {item.q}
                          </span>
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
                            isOpen ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0',
                          )}
                        >
                          <p className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ink-600">
                            {item.a}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Still need help CTA */}
            <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-3xl bg-ink-900 px-7 py-6 text-white sm:flex-row sm:items-center">
              <p className="font-display text-lg font-bold">Still have questions?</p>
              <div className="flex gap-3">
                <Link
                  href="/contact"
                  className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition-colors hover:bg-white/90"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
