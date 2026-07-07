import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Users,
  Star,
  ChevronRight,
  ShieldCheck,
  Check,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { AmbassadorCard } from '@/components/cards/ambassador-card';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { formatPrice } from '@/lib/utils';
import { ambassadorsForUniversity } from '@/lib/data';

/* ── Live school data — the same `schools` the admin console manages ── */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

interface SchoolDetail {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  location: string | null;
  state: string | null;
  tags: string[];
  toursFromCents: number | null;
  seoContent: string | null;
  enabled: boolean;
  _count?: { listings: number; sellerProfiles: number };
}

async function fetchSchool(slug: string): Promise<SchoolDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/schools/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const school = (await res.json()) as SchoolDetail;
    // Disabled schools are hidden from the public site.
    return school.enabled ? school : null;
  } catch {
    return null;
  }
}

const mediaUrl = (path: string) => (path.startsWith('http') ? path : `${API_URL}${path}`);

const blurbFor = (s: SchoolDetail) =>
  s.seoContent ??
  `Meet verified student guides at ${s.name} and see the campus through their eyes — honest answers about academics, housing, and student life.`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const u = await fetchSchool(slug);
  if (!u) return { title: 'University not found' };
  return {
    title: `${u.name} — campus tours & student guides`,
    description: `${blurbFor(u)} Book a private tour or video consultation with a verified ${u.name} student.`,
    alternates: { canonical: `/universities/${u.slug}` },
  };
}

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Verified students',
    body: 'Every guide is enrollment-checked by our team before they can host.',
  },
  {
    icon: GraduationCap,
    title: 'Real student perspective',
    body: 'Honest answers about academics, housing, and campus life — never a script.',
  },
  {
    icon: Check,
    title: 'Charged on acceptance',
    body: 'Request a time that works for you. You only pay once your guide accepts.',
  },
];

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const u = await fetchSchool(slug);
  if (!u) notFound();
  const guides = ambassadorsForUniversity(slug);

  const image = u.image ? mediaUrl(u.image) : null;
  const ambassadors = u._count?.sellerProfiles ?? 0;
  const blurb = blurbFor(u);
  const location = u.location ?? '';

  return (
    <div className="bg-white pt-[var(--header-h)]">
      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <section className="container-page pt-5">
        <nav
          className="flex items-center gap-1.5 text-sm text-ink-500"
          aria-label="Breadcrumb"
        >
          <Link href="/universities" className="transition-colors hover:text-ink-900">
            Explore schools
          </Link>
          <ChevronRight size={14} className="text-ink-300" />
          <span className="truncate font-medium text-ink-900">{u.name}</span>
        </nav>

        <div className="relative mt-4 h-[300px] overflow-hidden rounded-3xl sm:h-[380px] lg:h-[440px]">
          {image ? (
            <Image
              src={image}
              alt={`${u.name} campus`}
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-maroon-gradient font-display text-7xl font-bold text-ivory">
              {u.name.charAt(0)}
            </div>
          )}
          {/* Bottom gradient for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.28) 45%, rgba(10,8,6,0.05) 70%, transparent 100%)',
            }}
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div className="min-w-0">
              {u.state && (
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink-800 backdrop-blur">
                  {u.state}
                </span>
              )}
              <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
                {u.name}
              </h1>
              {location && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/85">
                  <MapPin size={14} /> {location}
                </p>
              )}
            </div>

            <div className="flex shrink-0 gap-2.5">
              <div className="rounded-xl bg-white/90 px-4 py-2.5 text-center backdrop-blur">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-900">
                  <Users size={14} className="text-maroon-900" /> {ambassadors}
                </p>
                <p className="mt-0.5 text-[0.68rem] text-ink-500">student guides</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Inside scoop + booking facts ───────────────────────────────── */}
      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          {/* Left: scoop, programs, highlights */}
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-ink-400">
              The Inside Scoop
            </p>
            <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-ink-700">
              {blurb}
            </p>

            {u.tags.length > 0 && (
              <>
                <h2 className="mt-9 font-display text-lg font-bold text-ink-900">
                  Popular programs
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {u.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}

            <hr className="my-9 border-ink-100" />

            <div className="space-y-6">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-50 text-maroon-900">
                    <h.icon size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{h.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-500">{h.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: sticky booking card */}
          <div>
            <div className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              {u.toursFromCents != null ? (
                <>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-ink-400">
                    Tours from
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold text-maroon-900">
                    {formatPrice(u.toursFromCents)}
                  </p>
                </>
              ) : (
                <p className="font-display text-xl font-bold text-ink-900">
                  Book a student-led visit
                </p>
              )}

              <dl className="mt-5 space-y-3 border-t border-ink-100 pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-500">Student guides</dt>
                  <dd className="font-semibold text-ink-900">{ambassadors}</dd>
                </div>
                {location && (
                  <div className="flex items-center justify-between">
                    <dt className="text-ink-500">Location</dt>
                    <dd className="font-semibold text-ink-900">{location}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 space-y-2.5">
                <Link
                  href={`/search?q=${encodeURIComponent(u.name)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-maroon-900 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
                >
                  View guides <ArrowRight size={15} />
                </Link>
                <Link
                  href="/universities"
                  className="flex w-full items-center justify-center rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
                >
                  Explore all schools
                </Link>
              </div>

              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink-400">
                <ShieldCheck size={13} className="shrink-0" />
                You’re only charged when a guide accepts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Guides ─────────────────────────────────────────────────────── */}
      <section className="border-t border-ink-100 bg-ivory/60 py-12 sm:py-16">
        <div className="container-page">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-ink-400">
                Meet the guides
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                Student guides at {u.name}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
                Choose a guide and request a time — you’re only charged once they accept.
              </p>
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(u.name)}`}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-maroon-900 hover:underline"
            >
              Browse all <ArrowRight size={14} />
            </Link>
          </div>

          {guides.length > 0 ? (
            <RevealGroup className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((a) => (
                <Reveal as="div" key={a.id}>
                  <AmbassadorCard a={a} />
                </Reveal>
              ))}
            </RevealGroup>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-center text-ink-500">
              New guides are joining {u.name} soon. Check back shortly.
            </p>
          )}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="container-page py-14 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-maroon-900 px-6 py-12 sm:px-12 sm:py-14">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover object-center opacity-20"
              aria-hidden
            />
          )}
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Ready to see {u.name} for real?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Book a private tour or video consultation with a verified student in minutes.
              </p>
            </div>
            <Link
              href={`/search?q=${encodeURIComponent(u.name)}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-maroon-900 shadow-sm transition-colors hover:bg-ivory"
            >
              Browse {u.name} guides <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
