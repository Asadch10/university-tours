import type { Metadata } from 'next';
import { Handshake, ShieldCheck, Ban } from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';

export const metadata: Metadata = {
  title: 'Trust & Safety',
  description:
    'Building trust through transparency, training, and thoughtful guardrails. How University Campus Private Tours keeps families and student guides safe on every campus tour.',
};

const BANNER =
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/03/8bcc0983b6feef9579de0397ed985f1590aee5?auto=format&fit=clip&h=2400&w=2400&s=72046b00f38cb2ef8c175150b586afda';
const IMG_MINORS =
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/90/2c205090b5abffa6f4ad9a74165efd71b822a8?auto=format&crop=edges&fit=crop&h=1200&w=1200&s=7e5658169ccc2c8dfc156e959c78f657';
const IMG_PLEDGE =
  'https://sharetribe-assets.imgix.net/66bd8713-d668-473a-b949-d147109fe10b/raw/e7/3a581d83a856f5c8ba2631fb85b30f7db55b4b?auto=format&crop=edges&fit=crop&h=1200&w=1200&s=123c8458b790adfa0997ebf308ae929a';

const PRINCIPLES = [
  {
    icon: Handshake,
    title: 'Always professional and respectful',
    body: 'All interactions must remain respectful, professional and appropriate at all times.',
  },
  {
    icon: ShieldCheck,
    title: 'Boundaries keep everyone safe',
    body: 'Physical, verbal, or digital boundaries must always be respected, without exception.',
  },
  {
    icon: Ban,
    title: 'Zero tolerance policy',
    body: 'We do not tolerate harassment, bullying, or discriminatory behavior based on race, gender, sexuality, religion, or background.',
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="bg-white">
      {/* ── 1. Commitment + banner ─────────────────────────────────────── */}
      <section className="pt-[calc(var(--header-h)+3rem)] sm:pt-[calc(var(--header-h)+4rem)]">
        <div className="container-page text-center">
          <Reveal>
            <h1 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Our commitment to trust and safety
            </h1>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
              Building trust through transparency, training, and thoughtful guardrails.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="container-page mt-10 sm:mt-14">
          <div className="overflow-hidden rounded-3xl shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BANNER}
              alt="Students exploring a campus together"
              className="aspect-[4/3] w-full object-cover sm:aspect-[21/9]"
            />
          </div>
        </Reveal>
      </section>

      {/* ── 2. Setting the standard ────────────────────────────────────── */}
      <section className="container-page py-20 sm:py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
            Setting the standard for safe campus tours.{' '}
            <span className="text-maroon-900">Every tour, every time.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
            We want you to make the most of every campus visit. That’s why we’re committed to safety —
            with verified guides, training, and clear safety standards — every tour, every time.
          </p>
        </Reveal>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16 sm:mt-20">
          <Reveal>
            <h3 className="font-display text-2xl font-semibold text-ink-900 sm:text-[1.75rem]">
              Minors must be accompanied by a parent
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              For any tour involving a guest under 18, a parent or legal guardian must be present for
              the entire tour. One-on-one, in-person tours with minors are never allowed.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-3xl shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_MINORS}
                alt="A parent walking through campus with two students"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16 sm:mt-20">
          <Reveal>
            <div className="overflow-hidden rounded-3xl shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMG_PLEDGE}
                alt="A student messaging safely through the app"
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h3 className="font-display text-2xl font-semibold text-ink-900 sm:text-[1.75rem]">
              All guides must commit to our Youth Protection Pledge
            </h3>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">
              All guides agree to our Youth Protection Pledge, which requires appropriate boundaries,
              public on-campus tours only, and no contact with minors outside the platform. They must
              also report safety concerns immediately and call 911 if there is suspected abuse or
              imminent danger.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 3. Safety is our top priority ──────────────────────────────── */}
      <section className="bg-ivory py-20 sm:py-28">
        <div className="container-page">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
              Safety is our top priority
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
              We enforce a strict zero-tolerance policy to protect guests and guides. Violations lead
              to immediate removal and may be reported to law enforcement.
            </p>
          </Reveal>

          <RevealGroup className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            {PRINCIPLES.map((p) => {
              const Icon = p.icon;
              return (
                <Reveal as="div" key={p.title}>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold text-ink-900">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-600">{p.body}</p>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

    </div>
  );
}
