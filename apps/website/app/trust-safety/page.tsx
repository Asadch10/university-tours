import type { Metadata } from 'next';
import {
  ShieldCheck,
  BadgeCheck,
  CreditCard,
  EyeOff,
  Star,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Trust & Safety',
  description:
    'How University Campus Private Tours keeps families and student guides safe — verified students, secure payments, masked contact until booking, accountable reviews, and an easy way to report a concern.',
};

const pillars = [
  {
    icon: BadgeCheck,
    title: 'Verified students',
    body: 'Every guide passes enrollment and identity checks before they can host, so you know you are meeting a real, current student.',
  },
  {
    icon: CreditCard,
    title: 'Secure payments',
    body: 'Payments are handled by Stripe and you are only charged when a guide accepts. We never store your full card details.',
  },
  {
    icon: EyeOff,
    title: 'Masked contact until booking',
    body: 'Your contact details stay private and are shared only after a tour is confirmed — never before, and never sold.',
  },
  {
    icon: Star,
    title: 'Reviews & accountability',
    body: 'Honest reviews from real families keep our community accountable and help great guides stand out.',
  },
];

export default function TrustSafetyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow text-gold-300">
              <span className="h-px w-6 bg-gold-300/60" /> Trust &amp; Safety
            </span>
            <h1 className="mt-4 flex items-center gap-3 font-display text-4xl font-semibold leading-[1.1] sm:text-5xl">
              <ShieldCheck className="text-gold-300" size={36} aria-hidden />
              Trust &amp; Safety
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-wider text-ivory/60">
              Last updated: June 15, 2026
            </p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ivory/75">
              Safety is the foundation of every campus visit. Here is how we protect families and
              student guides at every step.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <RevealGroup className="grid gap-6 sm:grid-cols-2">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <Reveal as="div" key={p.title}>
                  <div className="flex h-full flex-col rounded-3xl border border-ink-200/70 bg-white p-8 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                      <Icon size={22} aria-hidden />
                    </span>
                    <h2 className="mt-5 font-display text-xl font-semibold text-ink-900">
                      {p.title}
                    </h2>
                    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-600">{p.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Guidelines */}
      <section className="pb-8 sm:pb-12">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-ink max-w-none prose-headings:font-display prose-headings:text-ink-900 prose-a:text-maroon-800 prose-a:font-medium hover:prose-a:text-maroon-900">
              <h2>Safety guidelines for families</h2>
              <ul>
                <li>Keep all communication and payments on the Platform until your tour is confirmed.</li>
                <li>Review your guide&rsquo;s profile, verification badge, and reviews before booking.</li>
                <li>Agree on a public meeting point on or near campus for in-person tours.</li>
                <li>A parent or guardian should accompany and supervise any prospective student who is a minor.</li>
                <li>Trust your instincts — if something feels off, end the visit and report it to us.</li>
              </ul>

              <h2>Safety guidelines for guides</h2>
              <ul>
                <li>Keep your enrollment and profile information accurate and up to date.</li>
                <li>Meet families in public, well-trafficked areas of campus.</li>
                <li>Communicate through the Platform and honor your accepted bookings.</li>
                <li>Respect families&rsquo; privacy and follow your university&rsquo;s policies.</li>
                <li>Report any behavior that feels unsafe or inappropriate.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Report a concern */}
      <section className="pb-16 sm:pb-20">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="rounded-4xl border border-ink-200/70 bg-cream/60 p-8 shadow-soft sm:p-10">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                  <AlertTriangle size={22} aria-hidden />
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                  Report a concern
                </h2>
                <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-600">
                  If you ever feel unsafe or notice something that does not seem right — before,
                  during, or after a tour — tell us. Our Trust &amp; Safety team reviews every report
                  promptly and confidentially.
                </p>
                <div className="mt-7">
                  <ButtonLink href="mailto:safety@ucpt.example" variant="primary" size="lg">
                    <Mail size={18} /> Email safety@ucpt.example
                  </ButtonLink>
                </div>
              </div>
            </Reveal>
            <p className="mt-8 text-center text-sm leading-relaxed text-ink-500">
              In an emergency, always contact your local emergency services first. We are here to
              support you every step of the way.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
