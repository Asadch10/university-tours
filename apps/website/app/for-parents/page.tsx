import type { Metadata } from 'next';
import {
  ShieldCheck,
  HeartHandshake,
  MessageSquareQuote,
  Tag,
  Video,
  BadgeCheck,
  EyeOff,
  CreditCard,
  Stars,
  Compass,
  CalendarCheck,
  Footprints,
  Search,
  Quote,
  ArrowRight,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { Avatar } from '@/components/ui/avatar';
import { testimonials } from '@/lib/data';

export const metadata: Metadata = {
  title: 'For parents',
  description:
    'A trust-first way to explore campuses with your child. Verified student guides, masked contact, secure payments, and honest reviews — plus a flexible video option when you can’t travel.',
};

const benefits = [
  {
    icon: HeartHandshake,
    title: 'Safety you can trust',
    body: 'Every guide proves current enrollment and contact details stay masked until a booking is confirmed.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Honest student insight',
    body: 'Real answers about dorms, dining, safety, and daily life — not a rehearsed admissions script.',
  },
  {
    icon: Tag,
    title: 'Transparent pricing',
    body: 'See the price upfront and pay only when your guide accepts. No surprises, no hidden fees.',
  },
  {
    icon: Video,
    title: 'Flexible video option',
    body: 'Can’t travel yet? Book a live video consultation and explore a campus from anywhere.',
  },
];

const safety = [
  {
    icon: BadgeCheck,
    title: 'Verified enrollment',
    body: 'Our team reviews proof of current enrollment for every guide before they can host a family.',
  },
  {
    icon: EyeOff,
    title: 'Masked contact',
    body: 'Chat 1:1 safely. Personal contact details remain hidden until a booking is accepted.',
  },
  {
    icon: CreditCard,
    title: 'Secure payments',
    body: 'Stripe processes every payment and we only charge once your guide accepts the request.',
  },
  {
    icon: Stars,
    title: 'Genuine reviews',
    body: 'Ratings come from real families after real tours, so you always know who you’re booking.',
  },
];

const steps = [
  {
    icon: Compass,
    title: 'Discover',
    body: 'Browse verified guides by university, major, and language.',
  },
  {
    icon: CalendarCheck,
    title: 'Book',
    body: 'Request a tour or video call — charged only on acceptance.',
  },
  {
    icon: Footprints,
    title: 'Experience',
    body: 'Enjoy an honest, personalized look at campus life.',
  },
];

export default function ForParentsPage() {
  return (
    <>
      {/* Reassurance hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-2xl">
            <Badge variant="light">
              <ShieldCheck size={12} /> Parent-approved & verified
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.25rem]">
              The trusted way to explore campus with your child
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/75">
              Connect your family with a verified current student for an honest, private campus tour
              or video consultation. Safe, transparent, and built around the questions that matter to
              parents.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/search" variant="gold" size="lg">
                <Search size={18} /> Find a guide
              </ButtonLink>
              <ButtonLink href="/how-it-works" variant="outline-light" size="lg">
                How it works
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Why families choose us */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Why families choose us"
              title="Peace of mind, built in"
              description="Everything a parent needs to feel confident — from verified guides to flexible ways to visit."
            />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <Reveal as="div" key={b.title}>
                  <div className="flex h-full flex-col rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                      <Icon size={22} />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">
                      {b.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-600">{b.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Safety first */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="Safety first"
                title="Four safeguards on every booking"
                description="We designed this marketplace so that trust is never an afterthought. Here’s how we protect your family at each step."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/how-it-works" variant="outline">
                  See how it works <ArrowRight size={16} />
                </ButtonLink>
              </div>
            </Reveal>
            <RevealGroup className="grid gap-5 sm:grid-cols-2">
              {safety.map((s) => {
                const Icon = s.icon;
                return (
                  <Reveal as="div" key={s.title}>
                    <div className="flex h-full flex-col rounded-3xl border border-ink-200/70 bg-white p-6 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                        <Icon size={20} />
                      </span>
                      <h3 className="mt-4 font-display text-base font-semibold text-ink-900">
                        {s.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Steps recap */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Simple to start"
              title="Booking takes minutes"
              description="Three easy steps stand between you and an honest look at campus life."
            />
          </Reveal>
          <RevealGroup className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal as="div" key={s.title}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-ink-200/70 bg-white p-8 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <span className="absolute right-6 top-4 font-display text-6xl font-bold text-maroon-50 transition-colors group-hover:text-maroon-100">
                      {String(i + 1).padStart(2, '0')}
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
        </div>
      </section>

      {/* Parent testimonials */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Loved by families"
              title="What parents tell us"
              description="Honest words from families who found clarity through a student-led campus experience."
            />
          </Reveal>
          <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <Reveal as="div" key={t.id}>
                <figure className="flex h-full flex-col rounded-3xl border border-ink-200/70 bg-white p-8 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                  <Quote className="text-gold-400" size={28} aria-hidden />
                  <StarRating value={t.rating} className="mt-5" />
                  <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-ink-700">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-ink-100 pt-5">
                    <Avatar name={t.name} size={44} />
                    <span>
                      <span className="block font-display text-sm font-semibold text-ink-900">
                        {t.name}
                      </span>
                      <span className="block text-xs text-ink-500">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page py-20 sm:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient px-8 py-16 text-center text-ivory shadow-lift sm:px-12 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
            <div
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <ShieldCheck className="mx-auto text-gold-300" size={36} />
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">
                Help your child picture their future
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-ivory/75">
                Find a verified student guide and book a private tour or video consultation today.
                You’re only charged when your guide accepts.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/search" variant="gold" size="lg">
                  <Search size={18} /> Find a guide
                </ButtonLink>
                <ButtonLink href="/how-it-works" variant="outline-light" size="lg">
                  How it works <ArrowRight size={18} />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
