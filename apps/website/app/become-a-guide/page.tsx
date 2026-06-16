import type { Metadata } from 'next';
import {
  ArrowRight,
  Sparkles,
  Wallet,
  CalendarCheck,
  Handshake,
  BadgeCheck,
  ClipboardList,
  ShieldCheck,
  ListChecks,
  CalendarHeart,
  Check,
  IdCard,
  GraduationCap,
  Smile,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'Become a Guide',
  description:
    'Get paid to share your campus. Set your own rates, accept the requests you want, and earn $45–$90 per tour as a verified student guide.',
};

const benefits = [
  { icon: Wallet, title: 'Set your own rates', body: 'Price your tours within fair platform bounds — you stay in control.' },
  { icon: Handshake, title: 'Accept or decline freely', body: 'Only host the requests that fit your schedule. No obligations.' },
  { icon: CalendarCheck, title: 'Paid after every tour', body: 'Payouts land automatically once each tour is complete.' },
  { icon: Sparkles, title: 'Free to join', body: 'No listing fees and no subscription — sign up in minutes.' },
];

const steps = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Apply with the questionnaire',
    body: 'Tell us about your campus, your major, and why you love showing families around. It takes about five minutes.',
  },
  {
    step: '02',
    icon: BadgeCheck,
    title: 'Verify your enrollment',
    body: 'Upload proof of current enrollment and a valid ID. Our team reviews it privately before you go live.',
  },
  {
    step: '03',
    icon: ListChecks,
    title: 'Create your listings',
    body: 'Build private tour and video consultation listings, priced within our transparent fair-rate bounds.',
  },
  {
    step: '04',
    icon: CalendarHeart,
    title: 'Accept requests & host',
    body: 'Approve the bookings you want, meet your families, and collect reviews that grow your reputation.',
  },
];

const requirements = [
  { icon: GraduationCap, title: 'Current enrollment', body: 'You must be an actively enrolled student at the campus you guide.' },
  { icon: IdCard, title: 'Valid government ID', body: 'A quick identity check keeps the marketplace safe for everyone.' },
  { icon: Smile, title: 'Friendly & reliable', body: 'Show up on time, communicate clearly, and give families an honest, warm experience.' },
];

const guideFaqs = [
  {
    q: 'How much can I earn as a guide?',
    a: 'Most guides earn $45–$90 per tour depending on their rates, length, and campus demand. You set your own prices within fair platform bounds, and you keep the majority of every booking after a flat platform fee.',
  },
  {
    q: 'How and when do I get paid?',
    a: 'Payouts are automatic. Once a tour or video consultation is completed, your earnings are released to your connected payout account — there is nothing to invoice and no chasing payments.',
  },
  {
    q: 'Do I have to accept every request?',
    a: 'Never. You review each request and accept only the ones that fit your schedule and interests. Declining a request has no impact on your standing.',
  },
  {
    q: 'What does it cost to join?',
    a: 'Joining is completely free — no sign-up fee, no listing fee, and no subscription. We only take a flat platform fee from each completed booking, and you keep the rest.',
  },
  {
    q: 'How long does verification take?',
    a: 'Most enrollment and ID reviews are completed within one to two business days. We will email you the moment your profile is approved so you can publish your listings.',
  },
];

export default function BecomeAGuidePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div className="absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
        <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-maroon-400/20 blur-3xl" aria-hidden />
        <div className="container-page relative py-16 sm:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200 ring-1 ring-inset ring-white/15 backdrop-blur">
                <Sparkles size={14} /> Earn on your schedule
              </span>
              <h1 className="mt-5 max-w-2xl font-display text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
                Get paid to show families <span className="text-gold-gradient">your campus</span>.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/75">
                Turn your campus knowledge into income. Host private tours and video consultations on
                your own terms — set your rates, pick your hours, and build a reputation families
                trust.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/register" variant="gold" size="lg">
                  Start earning <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink href="/register" variant="outline-light" size="lg">
                  Apply as a guide
                </ButtonLink>
              </div>
            </div>

            <Reveal>
              <div className="relative overflow-hidden rounded-4xl bg-white/10 p-8 ring-1 ring-inset ring-white/15 backdrop-blur sm:p-10">
                <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
                <div className="relative">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-200">
                    Typical earnings
                  </p>
                  <p className="mt-3 font-display text-5xl font-bold text-gold-gradient sm:text-6xl">
                    $45–$90
                  </p>
                  <p className="mt-2 text-ivory/75">per tour you host</p>
                  <ul className="mt-7 space-y-3 text-sm text-ivory/85">
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-gold-300" /> Keep the majority of every booking
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-gold-300" /> Automatic payouts after each tour
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check size={16} className="text-gold-300" /> Zero cost to join or list
                    </li>
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Benefits row */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Why guide with us"
              title="The flexible side gig built for students"
              description="Real perks, no fine print — designed around the way student schedules actually work."
            />
          </Reveal>
          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <Reveal as="div" key={b.title}>
                  <div className="group h-full rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
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

      {/* How to become a guide */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="How to become a guide"
              title="Four steps from sign-up to your first tour"
              description="A clear, transparent path. Most students go live within a couple of days of applying."
            />
          </Reveal>
          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    <h3 className="relative mt-6 font-display text-lg font-semibold text-ink-900">
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

      {/* Earnings explainer */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Transparent earnings"
              title="You keep the most — we keep the lights on"
              description="Pricing is simple and honest. A flat platform fee covers payments, safety, and support; the rest is yours."
            />
          </Reveal>
          <Reveal className="mt-14">
            <div className="mx-auto max-w-3xl overflow-hidden rounded-4xl border border-ink-200/70 bg-white shadow-card">
              <div className="border-b border-ink-200/70 bg-cream/50 px-8 py-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                  <Wallet size={16} className="text-maroon-900" /> Example: a $75 private tour
                </p>
              </div>
              <dl className="divide-y divide-ink-200/70">
                <div className="flex items-center justify-between px-8 py-5">
                  <dt className="text-[0.95rem] text-ink-600">Tour price (gross)</dt>
                  <dd className="font-display text-lg font-semibold text-ink-900">$75.00</dd>
                </div>
                <div className="flex items-center justify-between px-8 py-5">
                  <dt className="text-[0.95rem] text-ink-600">Flat platform fee</dt>
                  <dd className="font-display text-lg font-semibold text-ink-500">−$11.25</dd>
                </div>
                <div className="flex items-center justify-between bg-maroon-50/50 px-8 py-6">
                  <dt className="flex items-center gap-2 text-[0.95rem] font-semibold text-maroon-900">
                    <Check size={16} className="text-verified" /> You keep (net)
                  </dt>
                  <dd className="font-display text-2xl font-bold text-maroon-900">$63.75</dd>
                </div>
              </dl>
              <p className="px-8 pb-6 pt-5 text-xs leading-relaxed text-ink-500">
                Illustrative only. Your actual earnings depend on your rates and tour length. The
                platform fee covers secure payments, verification, and family support.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Requirements */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="What you'll need"
              title="A short checklist to get started"
              description="We keep requirements light — but every guide is a verified, enrolled student families can trust."
            />
          </Reveal>
          <RevealGroup className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-3">
            {requirements.map((r) => {
              const Icon = r.icon;
              return (
                <Reveal as="div" key={r.title}>
                  <div className="flex h-full flex-col rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                        <Icon size={20} />
                      </span>
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-verified/10 text-verified">
                        <Check size={14} />
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">
                      {r.title}
                    </h3>
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-600">{r.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Guide FAQ"
              title="Questions before you apply?"
              description="The essentials on earnings, payouts, and what it takes to get verified."
            />
          </Reveal>
          <Reveal className="mt-12">
            <Accordion items={guideFaqs} />
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient px-8 py-16 text-center text-ivory shadow-lift sm:px-12 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
            <div
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <Badge variant="light">
                <Sparkles size={12} /> Free to join
              </Badge>
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">
                Ready to earn on your own schedule?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-ivory/75">
                Apply in minutes, get verified, and start hosting the families who want to know your
                campus the way you do.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/register" variant="gold" size="lg">
                  Become a guide <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink href="/how-it-works" variant="outline-light" size="lg">
                  See how it works
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
