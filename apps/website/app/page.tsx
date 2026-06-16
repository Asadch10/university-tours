import Link from 'next/link';
import {
  Search,
  CalendarCheck,
  Compass,
  ShieldCheck,
  Footprints,
  Video,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Hero } from '@/components/home/hero';
import { StatCounter } from '@/components/home/stat-counter';
import { TestimonialCarousel } from '@/components/home/testimonial-carousel';
import { UniversityCard } from '@/components/cards/university-card';
import { AmbassadorCard } from '@/components/cards/ambassador-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Accordion } from '@/components/ui/accordion';
import {
  universities,
  ambassadors,
  testimonials,
  services,
  stats,
  faqs,
  howItWorks,
} from '@/lib/data';

const STEP_ICONS = [Compass, CalendarCheck, Footprints];
const SERVICE_ICONS = { CAMPUS_TOUR: Footprints, VIDEO_CONSULTATION: Video } as const;

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Trust marquee */}
      <section className="border-b border-ink-100 bg-ivory py-10">
        <div className="container-page">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
            Trusted by families visiting top universities
          </p>
          <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="flex w-max animate-marquee items-center gap-12">
              {[...universities, ...universities].map((u, i) => (
                <span
                  key={u.slug + i}
                  className="whitespace-nowrap font-display text-lg font-semibold text-ink-400"
                >
                  {u.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="How it works"
              title="From curious to confident in three steps"
              description="A premium, transparent booking experience built around trust and real student perspective."
            />
          </Reveal>
          <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => {
              const Icon = STEP_ICONS[i]!;
              return (
                <Reveal as="div" key={step.step}>
                  <div className="group relative h-full overflow-hidden rounded-3xl border border-ink-200/70 bg-white p-8 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <span className="absolute right-6 top-4 font-display text-6xl font-bold text-maroon-50 transition-colors group-hover:text-maroon-100">
                      {step.step}
                    </span>
                    <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-gradient text-ivory shadow-soft">
                      <Icon size={24} />
                    </div>
                    <h3 className="relative mt-6 font-display text-xl font-semibold text-ink-900">
                      {step.title}
                    </h3>
                    <p className="relative mt-2.5 text-[0.95rem] leading-relaxed text-ink-600">
                      {step.body}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Featured universities */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow="Explore campuses"
                title="Featured universities"
                description="Browse the campuses families love most — each with verified student guides ready to host."
              />
              <ButtonLink href="/universities" variant="outline" className="shrink-0">
                View all universities <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universities.slice(0, 6).map((u) => (
              <Reveal as="div" key={u.slug}>
                <UniversityCard u={u} />
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Two ways to visit"
              title="Choose the experience that fits"
              description="Whether you can travel or not, get the real story from someone who lives it."
            />
          </Reveal>
          <RevealGroup className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {services.map((s) => {
              const Icon = SERVICE_ICONS[s.type];
              return (
                <Reveal as="div" key={s.type}>
                  <div className="flex h-full flex-col rounded-4xl border border-ink-200/70 bg-white p-8 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-900">
                        <Icon size={22} />
                      </span>
                      <h3 className="font-display text-xl font-semibold text-ink-900">{s.title}</h3>
                    </div>
                    <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-600">{s.blurb}</p>
                    <ul className="mt-6 space-y-3">
                      {s.points.map((p) => (
                        <li key={p} className="flex items-center gap-3 text-sm text-ink-700">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-verified/10 text-verified">
                            <Check size={13} />
                          </span>
                          {p}
                        </li>
                      ))}
                    </ul>
                    <ButtonLink href="/search" variant="ghost" className="mt-7 self-start">
                      Find a guide <ArrowRight size={16} />
                    </ButtonLink>
                  </div>
                </Reveal>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Stats band */}
      <section className="relative overflow-hidden bg-maroon-gradient py-16 text-ivory sm:py-20">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="container-page relative">
          <RevealGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <Reveal as="div" key={s.label} className="text-center">
                <p className="font-display text-4xl font-bold text-ivory sm:text-5xl">
                  <StatCounter value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </p>
                <p className="mt-2 text-sm text-ivory/70">{s.label}</p>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Featured ambassadors */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading
                align="left"
                eyebrow="Meet your guides"
                title="Top-rated student ambassadors"
                description="Real students, verified enrollment, genuine reviews. Find someone who studies what you love."
              />
              <ButtonLink href="/search" variant="outline" className="shrink-0">
                Browse all guides <ArrowRight size={16} />
              </ButtonLink>
            </div>
          </Reveal>
          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ambassadors.slice(0, 6).map((a) => (
              <Reveal as="div" key={a.id}>
                <AmbassadorCard a={a} />
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-cream/60 py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Loved by families"
              title="Visits that change minds"
              description="Thousands of families have found clarity through an honest, student-led campus experience."
            />
          </Reveal>
          <Reveal className="mt-14">
            <TestimonialCarousel items={testimonials} />
          </Reveal>
        </div>
      </section>

      {/* Become a guide CTA */}
      <section className="py-20 sm:py-28">
        <div className="container-page">
          <Reveal>
            <div className="relative overflow-hidden rounded-4xl border border-ink-200/70 bg-white shadow-card">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 sm:p-12 lg:p-14">
                  <Badge variant="gold">
                    <Sparkles size={12} /> Earn on your schedule
                  </Badge>
                  <h2 className="mt-5 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
                    Are you a current student? Become a guide.
                  </h2>
                  <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-600">
                    Share your campus, help families decide, and get paid for it. Set your own prices,
                    accept the requests you want, and build your reputation with reviews.
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {['Set your own rates', 'Accept or decline freely', 'Paid after every tour', 'Free to join'].map(
                      (p) => (
                        <li key={p} className="flex items-center gap-2.5 text-sm text-ink-700">
                          <Check size={16} className="text-verified" /> {p}
                        </li>
                      ),
                    )}
                  </ul>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <ButtonLink href="/become-a-guide" variant="primary" size="lg">
                      Start earning <ArrowRight size={18} />
                    </ButtonLink>
                    <ButtonLink href="/how-it-works" variant="outline" size="lg">
                      How it works
                    </ButtonLink>
                  </div>
                </div>
                <div className="relative hidden overflow-hidden bg-maroon-gradient lg:block">
                  <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.svg"
                    alt=""
                    className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 opacity-90 drop-shadow-2xl"
                  />
                  <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-white/10 p-5 text-ivory ring-1 ring-inset ring-white/15 backdrop-blur">
                    <p className="font-display text-2xl font-semibold text-gold-gradient">$45–$90</p>
                    <p className="text-sm text-ivory/70">typical earnings per tour</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-20 sm:pb-28">
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
      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient px-8 py-16 text-center text-ivory shadow-lift sm:px-12 sm:py-20">
            <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />
            <div className="relative mx-auto max-w-2xl">
              <ShieldCheck className="mx-auto text-gold-300" size={36} />
              <h2 className="mt-5 font-display text-3xl font-semibold sm:text-4xl lg:text-[2.75rem]">
                Your next campus visit starts here
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-ivory/75">
                Search a university, pick a verified student, and book in minutes. You’re only charged
                when your guide accepts.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/search" variant="gold" size="lg">
                  <Search size={18} /> Find a guide
                </ButtonLink>
                <ButtonLink href="/universities" variant="outline-light" size="lg">
                  Explore universities
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
