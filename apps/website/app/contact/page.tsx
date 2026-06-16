import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Mail,
  Clock,
  Timer,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/ui/reveal';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata: Metadata = {
  title: 'Contact · University Campus Private Tours',
  description:
    'Get in touch with the University Campus Private Tours team. Email us, check our support hours, or send a message — we typically reply within one business day.',
};

const METHODS = [
  {
    icon: Mail,
    title: 'Email us',
    body: 'For anything at all — questions, feedback, or help with a booking.',
    detail: 'hello@ucpt.example',
    href: 'mailto:hello@ucpt.example',
  },
  {
    icon: Clock,
    title: 'Support hours',
    body: 'Our family-care team is online to help you in real time.',
    detail: 'Mon–Sat · 8am–8pm ET',
  },
  {
    icon: Timer,
    title: 'Response-time promise',
    body: 'Every message gets a real, human reply — never a bot.',
    detail: 'Within one business day',
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
        <div
          className="absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-gold-500/10 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-maroon-400/20 blur-3xl"
          aria-hidden
        />
        <div className="container-page relative py-16 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200 ring-1 ring-inset ring-white/15 backdrop-blur">
              <MessageSquare size={14} /> We’re here to help
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">
              Let’s <span className="text-gold-gradient">talk</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ivory/75 sm:text-lg">
              Have a question about booking, becoming a guide, or anything else? Reach out and a real
              member of our team will get back to you.
            </p>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 1440 60" className="block w-full" preserveAspectRatio="none" aria-hidden>
            <path d="M0 60 C 360 10, 1080 10, 1440 60 Z" fill="#fbf8f3" />
          </svg>
        </div>
      </section>

      {/* Methods + form */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-16">
            {/* Left: contact methods */}
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="Get in touch"
                title="Ways to reach us"
                description="Pick whatever’s easiest — we read every message that comes in."
              />
              <div className="mt-8 space-y-4">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.title}
                      className="group flex gap-5 rounded-3xl border border-ink-200/70 bg-white p-6 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift"
                    >
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-ink-900">
                          {m.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{m.body}</p>
                        {m.href ? (
                          <a
                            href={m.href}
                            className="mt-2 inline-block text-sm font-semibold text-maroon-800 underline-offset-4 hover:underline"
                          >
                            {m.detail}
                          </a>
                        ) : (
                          <p className="mt-2 text-sm font-semibold text-maroon-800">{m.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FAQ helper card */}
              <div className="mt-6 flex items-center gap-5 rounded-3xl border border-ink-200/70 bg-cream/60 p-6">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                  <HelpCircle size={22} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900">
                    Looking for a quick answer?
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    Many common questions are already answered on our{' '}
                    <Link
                      href="/faq"
                      className="font-semibold text-maroon-800 underline-offset-4 hover:underline"
                    >
                      FAQ page
                    </Link>
                    .
                  </p>
                  <Link
                    href="/faq"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-800 underline-offset-4 hover:underline"
                  >
                    Visit the FAQ <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Right: form */}
            <Reveal delay={0.1}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust note */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-4xl border border-ink-200/70 bg-white px-8 py-10 text-center shadow-soft">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
              <ShieldCheck size={22} />
            </span>
            <p className="text-[0.95rem] leading-relaxed text-ink-600">
              Your privacy matters. We’ll only use your details to respond to your message — never
              for spam, and never shared with anyone outside our team.
            </p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
