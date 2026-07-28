'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Calendar, Compass } from 'lucide-react';
import { universities } from '@/lib/data';
import { contentApi } from '@/lib/client-api';
import { cn } from '@/lib/utils';

// Fallback copy — shown instantly, then replaced by the admin-editable `home.hero`
// CMS block if one is published (so the hero can be edited from the admin portal).
const DEFAULT_HERO_TITLE = 'Book private campus tours. Things just got personal.';
const DEFAULT_HERO_SUBTITLE =
  'Get the scoop and find the school that fits you best on a private campus tour tailored to you.';

/** Render the heading with the first sentence in ink and the rest in the brand accent. */
function HeroHeading({ title }: { title: string }) {
  const i = title.indexOf('. ');
  if (i === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, i + 1)} <span className="text-maroon-900">{title.slice(i + 2)}</span>
    </>
  );
}

/* ─── Shared search form rendered inside both mobile + desktop cards ─── */

function SearchCard({
  idPrefix,
  title,
  subtitle,
  university,
  date,
  tourType,
  onUniChange,
  onDateChange,
  onTourTypeChange,
  onSubmit,
}: {
  idPrefix: string;
  title: string;
  subtitle: string;
  university: string;
  date: string;
  tourType: string;
  onUniChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTourTypeChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [schoolOpen, setSchoolOpen] = useState(false);
  const schoolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) setSchoolOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const schoolMatches = universities.filter((u) => {
    const q = university.toLowerCase().trim();
    return !q || u.name.toLowerCase().includes(q) || u.location.toLowerCase().includes(q);
  });

  return (
    <>
      <h1 className="font-display text-2xl font-bold leading-snug text-ink-900 sm:text-[1.85rem] lg:text-[2.1rem]">
        <HeroHeading title={title} />
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-ink-500 lg:text-[0.95rem]">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        {/* School */}
        <div className="relative" ref={schoolRef}>
          <label
            htmlFor={`${idPrefix}-school`}
            className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
          >
            School
          </label>
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 transition-colors',
              schoolOpen ? 'border-maroon-800/40' : 'border-ink-200',
            )}
          >
            <GraduationCap size={15} className="shrink-0 text-ink-400" />
            <input
              id={`${idPrefix}-school`}
              value={university}
              onChange={(e) => {
                onUniChange(e.target.value);
                setSchoolOpen(true);
              }}
              onFocus={() => setSchoolOpen(true)}
              placeholder="Search schools"
              autoComplete="off"
              className="w-full min-w-0 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {schoolOpen && (
            <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-lift">
              <div className="max-h-[248px] overflow-y-auto p-2">
                {schoolMatches.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-ink-400">No schools found</p>
                ) : (
                  schoolMatches.map((u) => (
                    <button
                      key={u.slug}
                      type="button"
                      onClick={() => {
                        onUniChange(u.name);
                        setSchoolOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-maroon-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.image}
                        alt={u.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{u.name}</p>
                        <p className="truncate text-xs text-ink-500">{u.location}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setSchoolOpen(false)}
                className="block w-full border-t border-ink-100 px-4 py-3 text-center text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
              >
                Suggest a new school
              </button>
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor={`${idPrefix}-date`}
            className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
          >
            Date
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-maroon-800/40">
            <Calendar size={15} className="shrink-0 text-ink-400" />
            <input
              id={`${idPrefix}-date`}
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Tour type */}
        <div>
          <label
            htmlFor={`${idPrefix}-tour-type`}
            className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
          >
            Tour type
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-maroon-800/40">
            <Compass size={15} className="shrink-0 text-ink-400" />
            <select
              id={`${idPrefix}-tour-type`}
              value={tourType}
              onChange={(e) => onTourTypeChange(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-900 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <option value="">Add tour type</option>
              <option value="CAMPUS_TOUR">In-person campus tour</option>
              <option value="VIDEO_CONSULTATION">Video consultation</option>
            </select>
          </div>
        </div>

        {/* Search CTA */}
        <button
          type="submit"
          className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-maroon-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-maroon-800 hover:shadow-md active:scale-[0.99]"
        >
          <Search size={15} />
          Search tour guides
        </button>
      </form>
    </>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────── */

export function Hero() {
  const router = useRouter();
  const [university, setUniversity] = useState('');
  const [date, setDate] = useState('');
  const [tourType, setTourType] = useState('');
  const [title, setTitle] = useState(DEFAULT_HERO_TITLE);
  const [subtitle, setSubtitle] = useState(DEFAULT_HERO_SUBTITLE);

  // Pull the admin-editable hero copy from the CMS (falls back to the defaults above).
  useEffect(() => {
    let active = true;
    contentApi
      .block('home.hero')
      .then((block) => {
        if (!active || !block) return;
        const c = block.contentJson as { title?: unknown; body?: unknown; subtitle?: unknown };
        if (typeof c.title === 'string' && c.title.trim()) setTitle(c.title);
        const sub = c.body ?? c.subtitle;
        if (typeof sub === 'string' && sub.trim()) setSubtitle(sub);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (university) params.set('q', university);
    if (date) params.set('date', date);
    if (tourType) params.set('service', tourType);
    router.push(`/search?${params.toString()}`);
  }

  const sharedProps = {
    title,
    subtitle,
    university,
    date,
    tourType,
    onUniChange: setUniversity,
    onDateChange: setDate,
    onTourTypeChange: setTourType,
    onSubmit: handleSearch,
  };

  return (
    <section className="flex flex-col bg-white">
      {/* Fixed-header offset */}
      <div className="h-[var(--header-h)] shrink-0" />

      {/*
       * Full-bleed video at the native 16:9 ratio, with the height capped
       * so it always fits on one screen below the header (no scrolling to
       * see the rest of the video).
       * Mobile (< sm): rounded video strip with side margins; card below.
       * sm–lg:         card below (16:9 is too short to overlay).
       * lg+:           card overlays left side.
       */}

      {/* ── Video container ───────────────────────────────────────────── */}
      <div
        className={[
          'relative aspect-video overflow-hidden',
          /* Mobile: rounded strip with gutters */
          'mx-4 rounded-2xl',
          /* sm+: edge-to-edge, height never exceeds screen minus header */
          'sm:mx-0 sm:max-h-[calc(100dvh-var(--header-h))] sm:rounded-t-none sm:rounded-b-[2rem]',
        ].join(' ')}
      >
        {/* Background video */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          {/* Browsers play the first supported source, so highest quality goes first */}
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p-av1.mp4"
            type='video/mp4; codecs="av01.0.05M.08"'
          />
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p.mp4"
            type="video/mp4"
          />
        </video>

        {/* Gradient overlay — stronger on left for card readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(10,8,6,0.72) 0%, rgba(10,8,6,0.44) 42%, rgba(10,8,6,0.10) 100%)',
          }}
        />

        {/* Desktop card — overlays left side of video, anchored near the top
            so it stays above the fold even when the 16:9 video runs taller
            than the viewport; hidden below lg */}
        <div className="absolute inset-y-0 left-0 hidden items-start px-6 pb-6 pt-10 lg:flex lg:px-14 xl:px-20 xl:pt-14">
          <div className="w-full max-w-[390px] rounded-2xl bg-white p-6 shadow-[0_12px_48px_rgba(0,0,0,0.24)] lg:max-w-[430px] lg:p-8 xl:p-9">
            <SearchCard idPrefix="hero-d" {...sharedProps} />
          </div>
        </div>
      </div>

      {/* Mobile / tablet card — stacks below video, hidden on lg+ */}
      <div className="mx-4 mb-4 mt-3 sm:mx-auto sm:mt-5 sm:w-full sm:max-w-[480px] sm:px-4 lg:hidden">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <SearchCard idPrefix="hero-m" {...sharedProps} />
        </div>
      </div>
    </section>
  );
}
