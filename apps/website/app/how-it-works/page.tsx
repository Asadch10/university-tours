import type { Metadata } from 'next';
import {
  Compass,
  CalendarCheck,
  Footprints,
  Star,
  ClipboardCheck,
  ListChecks,
  Inbox,
  Wallet,
  ShieldCheck,
  Lock,
  CreditCard,
  EyeOff,
  Search,
  ArrowRight,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import { faqs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'See how University Campus Private Tours works for families and student guides — discover, book, experience, and review, with verified students and secure payments charged only on acceptance.',
};

const buyerSteps = [
  {
    step: '01',
    icon: Compass,
    title: 'Discover a campus',
    body: 'Search 50+ universities and browse verified student guides by major, language, price, and rating until you find the perfect match.',
  },
  {
    step: '02',
    icon: CalendarCheck,
    title: 'Book in minutes',
    body: 'Choose a private tour or video consultation, pick a time, and send your request. You’re only charged when your guide accepts.',
  },
  {
    step: '03',
    icon: Footprints,
    title: 'Experience it for real',
    body: 'Meet on campus or over video for an honest, personalized look at student life — the parts official tours never show.',
  },
  {
    step: '04',
    icon: Star,
    title: 'Review your guide',
    body: 'Share your experience with a rating and review to help the next family, and plan your next visit with confidence.',
  },
];

const guideSteps = [
  {
    step: '01',
    icon: ClipboardCheck,
    title: 'Apply & verify enrollment',
    body: 'Create your profile and submit proof of current enrollment. Our team reviews every application before approval.',
  },
  {
    step: '02',
    icon: ListChecks,
    title: 'List your tours',
    body: 'Set your own prices, choose campus tours and video consultations, and share what makes your perspective unique.',
  },
  {
    step: '03',
    icon: Inbox,
    title: 'Accept requests',
    body: 'Receive booking requests and accept the ones that fit your schedule. You’re always free to decline.',
  },
  {
    step: '04',
    icon: Wallet,
    title: 'Get paid',
    body: 'Host your tour, then receive secure payouts after every completed booking. Build your reputation with reviews.',
  },
];

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Verified students',
    body: 'Every guide proves current enrollment before they can host a single family.',
  },
  {
    icon: CreditCard,
    title: 'Secure Stripe payments',
    body: 'Payments are processed by Stripe — we never store your card details.',
  },
  {
    icon: Lock,
    title: 'Charged on acceptance',
    body: 'We only capture payment when your guide accepts. Declined requests cost nothing.',
  },
  {
    icon: EyeOff,
    title: 'Masked contact',
    body: 'Personal contact details stay hidden until a booking is confirmed, for everyone’s safety.',
  },
];

function StepGrid({
  steps,
}: {
  steps: { step: string; icon: typeof Compass; title: string; body: string }[];
}) {
  return (
    <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s) => {
        const Icon = s.icon;
        return (
          <Reveal as="div" key={s.step}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-ink-200/70 bg-white p-8 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
              <span className="absolute right-6 top-4 font-display text-6xl font-bold text-maroon-50 transition-colors group-hover:text-maroon-100">
                {s.step}
              </span>
              <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-gradient text-ivory shadow-soft">
                <Icon size={24} />
              </div>
              <h3 className="relative mt-6 font-display text-xl font-semibold text-ink-900">
                {s.title}
              </h3>
              <p className="relative mt-2.5 text-[0.95rem] leading-relaxed text-ink-600">
                {s.body}
              </p>
            </div>
          </Reveal>
        );
      })}
    </RevealGroup>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="eyebrow text-gold-300">
              <span className="h-px w-6 bg-gold-300/60" /> How it works
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.25rem]">
              A transparent journey for families and student guides
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/75">
              From the first search to a five-star review, every step is built around trust, real
              student perspective, and payments you only make when a guide says yes.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/search" variant="gold" size="lg">
                <Search size={18} /> Find a guide
              </ButtonLink>
              <ButtonLink href="/register" variant="outline-light" size="lg">
                Become a guide
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer journey */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="For families"
              title="From curious to confident in four steps"
              description="Discover a campus, book with confidence, experience it for real, and share your story."
            />
          </Reveal>
          <StepGrid steps={buyerSteps} />
        </div>
      </section>

      {/* Guide journey */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="For student guides"
              title="Turn your campus knowledge into income"
              description="Apply, list your tours, accept the requests you want, and get paid after every booking."
            />
          </Reveal>
          <StepGrid steps={guideSteps} />
        </div>
      </section>

      {/* Trust & safety strip */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Trust & safety"
              title="Built to protect every family"
              description="The safeguards that make booking a stranger on a campus feel completely secure."
            />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <Reveal as="div" key={item.title}>
                  <div className="flex h-full flex-col rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                      <Icon size={22} />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-600">{item.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Good to know"
              title="Frequently asked questions"
              description="Everything you need to feel confident booking your first campus experience."
            />
          </Reveal>
          <Reveal className="mt-12">
            <Accordion items={faqs} />
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-20 sm:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient px-8 py-16 text-center text-ivory shadow-lift sm:px-12 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <ShieldCheck className="mx-auto text-gold-300" size={36} />
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">
                Ready to see campus through a student’s eyes?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-ivory/75">
                Search a university, pick a verified student, and book in minutes. You’re only charged
                when your guide accepts.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/search" variant="gold" size="lg">
                  <Search size={18} /> Find a guide
                </ButtonLink>
                <ButtonLink href="/register" variant="outline-light" size="lg">
                  Become a guide <ArrowRight size={18} />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
