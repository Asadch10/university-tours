import type { Metadata } from 'next';
import { LifeBuoy, CreditCard, GraduationCap, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { faqs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Help Center & FAQ',
  description:
    'Answers about booking, payments, becoming a guide, and how we keep campus visits safe and trustworthy.',
};

const guideFaqs = [
  {
    q: 'How do I become a student guide?',
    a: 'Apply with our short questionnaire, verify your current enrollment and ID, then create listings within our fair-rate bounds. Most students are approved within one to two business days.',
  },
  {
    q: 'How much do guides earn?',
    a: 'Most guides earn $45–$90 per tour. You set your own rates within platform bounds and keep the majority of every booking after a flat platform fee, with payouts released automatically once each tour is complete.',
  },
  {
    q: 'Do guides have to accept every request?',
    a: 'No. Guides review each request and accept only the ones that fit their schedule and interests. Declining never affects a guide’s standing on the platform.',
  },
  {
    q: 'Is there a cost to join as a guide?',
    a: 'Joining is free — no sign-up fee, listing fee, or subscription. We only take a flat platform fee from each completed booking.',
  },
];

const safetyFaqs = [
  {
    q: 'How do you keep families safe?',
    a: 'Every guide verifies current enrollment and a valid government ID before going live. Contact details stay masked until a booking is accepted, and all payments are handled securely on-platform.',
  },
  {
    q: 'Are my payment details secure?',
    a: 'Yes. Payments are processed by a PCI-compliant provider and we never store your full card number. You are only charged when a guide accepts your request.',
  },
  {
    q: 'What if something goes wrong during a visit?',
    a: 'Our support team is available before, during, and after every booking. If a guide cancels you always receive a full refund, and you can report any concern directly from your booking.',
  },
  {
    q: 'Is this affiliated with the universities?',
    a: 'No. We are an independent marketplace connecting families with current students. Tours reflect authentic student perspectives, not official university messaging.',
  },
];

export default function FaqPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
        <div className="container-page relative py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200 ring-1 ring-inset ring-white/15 backdrop-blur">
              <LifeBuoy size={14} /> Help center
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] sm:text-5xl">
              How can we help?
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ivory/75">
              Everything you need to feel confident — from booking and payments to becoming a guide and
              staying safe.
            </p>
          </div>
        </div>
      </section>

      {/* Booking & payments */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Booking & payments"
              title="Booking & payments"
              description="The essentials on requests, charges, refunds, and what happens after you book."
            />
          </Reveal>
          <Reveal className="mt-10">
            <div className="mb-5 flex justify-center sm:justify-start">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                <CreditCard size={22} />
              </span>
            </div>
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* For guides */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="For guides"
              title="For guides"
              description="Thinking of hosting families on your campus? Start here."
            />
          </Reveal>
          <Reveal className="mt-10">
            <div className="mb-5 flex justify-center sm:justify-start">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                <GraduationCap size={22} />
              </span>
            </div>
            <Accordion items={guideFaqs} />
          </Reveal>
        </div>
      </section>

      {/* Safety & trust */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="Safety & trust"
              title="Safety & trust"
              description="How verification, secure payments, and support keep every visit trustworthy."
            />
          </Reveal>
          <Reveal className="mt-10">
            <div className="mb-5 flex justify-center sm:justify-start">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                <ShieldCheck size={22} />
              </span>
            </div>
            <Accordion items={safetyFaqs} />
          </Reveal>
        </div>
      </section>

      {/* Still need help? */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl border border-ink-200/70 bg-white shadow-card">
            <div className="grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                  <MessageCircle size={26} />
                </span>
                <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
                  Still need help?
                </h2>
                <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-600">
                  Can’t find your answer? Our support team is happy to help with bookings, payments,
                  guiding, and anything else.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <ButtonLink href="/contact" variant="primary" size="lg">
                  Contact support <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink href="/become-a-guide" variant="outline" size="lg">
                  Become a guide
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
