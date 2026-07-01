import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Languages,
  Footprints,
  Video,
  BadgeCheck,
  ChevronRight,
  Quote,
  Heart,
  Clock,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { BookingWidget } from '@/components/booking/booking-widget';
import { ambassadors, findAmbassador, findUniversity } from '@/lib/data';
import { guides, getGuideProfile } from '@/lib/guides';
import { GuideDetail } from '@/components/guide/guide-detail';

export function generateStaticParams() {
  return [...ambassadors.map((a) => ({ id: a.id })), ...guides.map((g) => ({ id: g.id }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const gp = getGuideProfile(id);
  if (gp) {
    return {
      title: `${gp.name} — ${gp.university} student guide`,
      description: gp.headline,
      alternates: { canonical: `/ambassadors/${gp.id}` },
    };
  }
  const a = findAmbassador(id);
  if (!a) return { title: 'Guide not found' };
  return {
    title: `${a.name} — ${a.university} student guide`,
    description: a.bio,
    alternates: { canonical: `/ambassadors/${a.id}` },
  };
}

const SAMPLE_REVIEWS = [
  { name: 'The Patel Family', rating: 5, text: 'Knowledgeable, warm, and so patient with our questions. We left feeling certain about our shortlist.' },
  { name: 'Olivia R.', rating: 5, text: 'Showed us the real student life — dorms, dining, study spots. Far better than the official tour.' },
  { name: 'James & Dana', rating: 5, text: 'Punctual, friendly, and incredibly helpful on the admissions side. Highly recommend.' },
];

export default async function AmbassadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Search-grid guides (g1..gN) use the rich detail design.
  const gp = getGuideProfile(id);
  if (gp) return <GuideDetail g={gp} />;

  const a = findAmbassador(id);
  if (!a) notFound();
  const uni = findUniversity(a.universitySlug);

  return (
    <>
      <section className="bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="container-page relative py-10">
          <nav className="flex items-center gap-1.5 text-sm text-ivory/60" aria-label="Breadcrumb">
            <Link href="/search" className="hover:text-gold-200">
              Guides
            </Link>
            <ChevronRight size={14} />
            <span className="text-ivory/90">{a.name}</span>
          </nav>
        </div>
      </section>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1fr_380px] lg:py-14">
        {/* Main */}
        <div>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={a.name} src={a.avatar} size={96} ring />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-semibold text-ink-900">{a.name}</h1>
                {a.verified && (
                  <Badge variant="verified" size="md">
                    <BadgeCheck size={14} /> Verified student
                  </Badge>
                )}
              </div>
              <Link
                href={`/universities/${a.universitySlug}`}
                className="mt-1 inline-flex items-center gap-1.5 text-ink-600 hover:text-maroon-900"
              >
                <GraduationCap size={16} /> {a.major} · {a.university}
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <StarRating value={a.rating} count={a.reviews} />
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
                  <Footprints size={14} /> {a.toursGiven} tours given
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
                  <Clock size={14} /> Responds {a.responseTime}
                </span>
              </div>
            </div>
          </div>

          {/* Service badges */}
          <div className="mt-6 flex flex-wrap gap-2">
            {a.services.includes('CAMPUS_TOUR') && (
              <Badge variant="maroon" size="md">
                <Footprints size={14} /> In-person tour
              </Badge>
            )}
            {a.services.includes('VIDEO_CONSULTATION') && (
              <Badge variant="gold" size="md">
                <Video size={14} /> Video consultation
              </Badge>
            )}
          </div>

          {/* About */}
          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">About {a.name.split(' ')[0]}</h2>
            <p className="mt-3 leading-relaxed text-ink-600">{a.bio}</p>
          </div>

          {/* Details grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-200/70 bg-white p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Languages size={16} className="text-maroon-800" /> Languages
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.languages.map((l) => (
                  <Badge key={l} variant="neutral">
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-ink-200/70 bg-white p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
                <Heart size={16} className="text-maroon-800" /> Interests
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.interests.map((i) => (
                  <Badge key={i} variant="neutral">
                    {i}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink-900">
                Reviews ({a.reviews})
              </h2>
              <StarRating value={a.rating} />
            </div>
            <div className="mt-5 grid gap-4">
              {SAMPLE_REVIEWS.map((r) => (
                <figure key={r.name} className="relative rounded-2xl border border-ink-200/70 bg-white p-6">
                  <Quote className="absolute right-5 top-4 text-maroon-50" size={40} aria-hidden />
                  <StarRating value={r.rating} size={14} />
                  <blockquote className="relative mt-3 text-ink-700">“{r.text}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <Avatar name={r.name} size={36} />
                    <span className="text-sm font-semibold text-ink-900">{r.name}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>

        {/* Booking sidebar */}
        <aside>
          <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <BookingWidget a={a} />
            {uni && (
              <Link
                href={`/universities/${uni.slug}`}
                className="mt-4 flex items-center justify-between rounded-2xl border border-ink-200/70 bg-white p-4 text-sm shadow-soft transition-colors hover:border-maroon-800/30"
              >
                <span className="text-ink-600">
                  More guides at <span className="font-semibold text-ink-900">{uni.name}</span>
                </span>
                <ChevronRight size={16} className="text-ink-400" />
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
