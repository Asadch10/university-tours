import type { Metadata } from 'next';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart,
  GraduationCap,
  Accessibility,
  Compass,
  Quote,
} from 'lucide-react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'About · University Campus Private Tours',
  description:
    'We connect families with verified current students for honest, private campus tours and video consultations — built on authenticity, trust, and student empowerment.',
};

const VALUES = [
  {
    icon: Compass,
    title: 'Authenticity',
    body: 'Real students, real experiences. No admissions scripts, no glossy spin — just the honest, lived perspective families actually need.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & safety',
    body: 'Every guide is verified for current enrollment. Secure messaging, transparent reviews, and payment held until your tour is accepted.',
  },
  {
    icon: GraduationCap,
    title: 'Student empowerment',
    body: 'Guides set their own rates and schedules, keeping the majority of every booking. We help students earn from what they already know best.',
  },
  {
    icon: Accessibility,
    title: 'Accessibility',
    body: 'Can’t travel? Live video consultations bring the campus to you, so distance and cost never decide who gets an honest look.',
  },
];

const IMPACT_STATS = [
  { value: '50+', label: 'Universities covered' },
  { value: '1,200+', label: 'Verified student guides' },
  { value: '18,000+', label: 'Tours given' },
  { value: '4.9/5', label: 'Average family rating' },
];

const TEAM = [
  { name: 'Maya Chen', role: 'Co-founder · Stanford ’22', focus: 'Product & guide community' },
  { name: 'Daniel Okafor', role: 'Co-founder · NYU ’21', focus: 'Trust, safety & operations' },
  { name: 'Priya Sharma', role: 'Head of Guides', focus: 'Verification & quality' },
  { name: 'Liam Walsh', role: 'Head of Family Care', focus: 'Support & experience' },
];

export default function AboutPage() {
  return (
    <>
      {/* Mission hero */}
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
              <Sparkles size={14} /> Our mission
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">
              Honest campus stories,
              <br className="hidden sm:block" />{' '}
              <span className="text-gold-gradient">told by the students who live them.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ivory/75 sm:text-lg">
              We built University Campus Private Tours so every family could see the real campus —
              the dorms, the dining halls, the late-night libraries — through the eyes of someone
              who actually goes there.
            </p>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 1440 60" className="block w-full" preserveAspectRatio="none" aria-hidden>
            <path d="M0 60 C 360 10, 1080 10, 1440 60 Z" fill="#fbf8f3" />
          </svg>
        </div>
      </section>

      {/* Origin story */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="Our story"
                title="Started by students who wished this existed"
                description="When our founders were choosing where to spend the next four years, the official tours felt rehearsed and the brochures looked nothing like real life."
              />
              <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-ink-600">
                <p>
                  They did what students do: they texted friends at other schools and asked the real
                  questions. What’s the food actually like? Is the library open at 2am? Do people
                  here seem happy?
                </p>
                <p>
                  Those candid conversations changed everything — and inspired a simple idea. What
                  if any family could book that honest conversation, and the students sharing their
                  time got paid fairly for it?
                </p>
                <p>
                  Today that idea connects thousands of families with verified guides across the
                  country, turning anxious guesswork into confident decisions.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient p-8 text-ivory shadow-card sm:p-10">
                <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
                <div
                  className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold-500/15 blur-3xl"
                  aria-hidden
                />
                <div className="relative">
                  <Quote className="text-gold-300" size={36} />
                  <p className="mt-5 font-display text-2xl font-semibold leading-snug sm:text-3xl">
                    “The fifteen minutes with a real student told me more than three official tours
                    combined.”
                  </p>
                  <p className="mt-6 text-sm text-ivory/70">
                    — a parent, after her first video consultation
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Values grid */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="What we stand for"
              title="Values that guide every booking"
              description="Premium isn’t just polish — it’s the principles we refuse to compromise on."
            />
          </Reveal>
          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <Reveal as="div" key={v.title}>
                  <div className="group flex h-full gap-5 rounded-3xl border border-ink-200/70 bg-white p-7 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift sm:p-8">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-ink-900">{v.title}</h3>
                      <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-600">{v.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Impact stats band */}
      <section className="relative overflow-hidden bg-maroon-gradient py-16 text-ivory sm:py-20">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="container-page relative">
          <Reveal>
            <SectionHeading
              variant="light"
              eyebrow="Our impact"
              title="A growing community of trust"
              description="Numbers that reflect thousands of honest conversations and confident decisions."
            />
          </Reveal>
          <RevealGroup className="mt-12 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {IMPACT_STATS.map((s) => (
              <Reveal as="div" key={s.label} className="text-center">
                <p className="font-display text-4xl font-bold text-ivory sm:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm text-ivory/70">{s.label}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="By students, for students"
              title="The people behind the platform"
              description="A small, mission-driven team — most of us were the families and students this was built for."
            />
          </Reveal>
          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <Reveal as="div" key={member.name}>
                <div className="group flex h-full flex-col items-center rounded-3xl border border-ink-200/70 bg-white p-8 text-center shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                  <Avatar name={member.name} size={72} ring />
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink-900">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-maroon-800">{member.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{member.focus}</p>
                </div>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* CTA band */}
      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient px-8 py-16 text-center text-ivory shadow-lift sm:px-12 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
            <div
              className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <Heart className="mx-auto text-gold-300" size={36} />
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">
                Join the community shaping honest tours
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-ivory/75">
                Whether you’re a family searching for clarity or a student ready to share your
                campus, there’s a place for you here.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/become-a-guide" variant="gold" size="lg">
                  Become a guide <ArrowRight size={18} />
                </ButtonLink>
                <ButtonLink href="/search" variant="outline-light" size="lg">
                  Find a guide
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
