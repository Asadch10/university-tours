import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Users, Star, ChevronRight, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { AmbassadorCard } from '@/components/cards/ambassador-card';
import { SectionHeading } from '@/components/ui/section-heading';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { formatPrice } from '@/lib/utils';
import { universities, findUniversity, ambassadorsForUniversity } from '@/lib/data';

export function generateStaticParams() {
  return universities.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const u = findUniversity(slug);
  if (!u) return { title: 'University not found' };
  return {
    title: `${u.name} — campus tours & student guides`,
    description: `${u.blurb} Book a private tour or video consultation with a verified ${u.name} student.`,
    alternates: { canonical: `/universities/${u.slug}` },
  };
}

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const u = findUniversity(slug);
  if (!u) notFound();
  const guides = ambassadorsForUniversity(slug);

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden pt-[var(--header-h)] text-ivory"
        style={{ background: `linear-gradient(135deg, ${u.accent} 0%, #3d0a12 120%)` }}
      >
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          className="pointer-events-none absolute -right-8 top-16 hidden h-64 w-64 opacity-15 lg:block"
        />
        <div className="container-page relative py-12 sm:py-16">
          <nav className="flex items-center gap-1.5 text-sm text-ivory/60" aria-label="Breadcrumb">
            <Link href="/universities" className="hover:text-gold-200">
              Universities
            </Link>
            <ChevronRight size={14} />
            <span className="text-ivory/90">{u.name}</span>
          </nav>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="light">{u.state}</Badge>
              <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{u.name}</h1>
              <p className="mt-3 inline-flex items-center gap-2 text-ivory/80">
                <MapPin size={16} /> {u.location}
              </p>
              <p className="mt-4 max-w-xl text-ivory/75">{u.blurb}</p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/10 px-5 py-4 text-center ring-1 ring-inset ring-white/15 backdrop-blur">
                <p className="inline-flex items-center gap-1.5 font-display text-2xl font-bold">
                  <Star size={18} className="fill-gold-400 text-gold-400" /> {u.rating}
                </p>
                <p className="mt-1 text-xs text-ivory/70">{u.reviews} reviews</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 text-center ring-1 ring-inset ring-white/15 backdrop-blur">
                <p className="inline-flex items-center gap-1.5 font-display text-2xl font-bold">
                  <Users size={18} className="text-gold-300" /> {u.ambassadors}
                </p>
                <p className="mt-1 text-xs text-ivory/70">student guides</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 1440 60" className="block w-full" preserveAspectRatio="none" aria-hidden>
            <path d="M0 60 C 360 10, 1080 10, 1440 60 Z" fill="#fbf8f3" />
          </svg>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-14">
        <div className="container-page grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: 'Verified students', d: 'Enrollment checked by our team' },
            { icon: Star, t: `${u.rating} average rating`, d: `${u.reviews} family reviews` },
            { icon: Check, t: 'Charged on acceptance', d: 'No charge until a guide accepts' },
          ].map((h) => (
            <div
              key={h.t}
              className="flex items-center gap-4 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-900">
                <h.icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-ink-900">{h.t}</p>
                <p className="text-sm text-ink-500">{h.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular programs */}
      <section className="pb-6">
        <div className="container-page">
          <h2 className="font-display text-xl font-semibold text-ink-900">Popular programs</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {u.tags.map((t) => (
              <Badge key={t} variant="neutral" size="md">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Guides */}
      <section className="py-12 sm:py-16">
        <div className="container-page">
          <SectionHeading
            align="left"
            eyebrow="Meet the guides"
            title={`Student guides at ${u.name}`}
            description={`Tours start from ${formatPrice(u.toursFrom)}. Choose a guide and request a time — you’re only charged on acceptance.`}
          />
          {guides.length > 0 ? (
            <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((a) => (
                <Reveal as="div" key={a.id}>
                  <AmbassadorCard a={a} />
                </Reveal>
              ))}
            </RevealGroup>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-ink-300 bg-white/60 p-8 text-center text-ink-500">
              New guides are joining {u.name} soon. Check back shortly.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-24">
        <div className="relative overflow-hidden rounded-4xl bg-maroon-gradient px-8 py-14 text-center text-ivory shadow-lift">
          <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
          <div className="relative mx-auto max-w-xl">
            <h2 className="font-display text-3xl font-semibold">Ready to see {u.name} for real?</h2>
            <p className="mt-3 text-ivory/75">
              Browse all guides and book a private tour or video consultation in minutes.
            </p>
            <ButtonLink href="/search" variant="gold" size="lg" className="mt-7">
              Browse {u.name} guides <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
