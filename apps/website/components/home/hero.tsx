'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, CalendarDays, Compass, Loader2, X } from 'lucide-react';
import { contentApi } from '@/lib/client-api';
import { useUniversities } from '@/lib/schools';
import { PHOTOS } from '@/lib/images';
import { SERVICE_LABEL } from '@/lib/tour-types';
import { Calendar, formatDate } from '@/components/ui/calendar';
import { HeroVideo } from '@/components/home/hero-video';
import { cn } from '@/lib/utils';

/** Tour types offered in the hero search, in the order guests see them. */
const TOUR_TYPES = [
  { value: 'CAMPUS_TOUR', label: SERVICE_LABEL.CAMPUS_TOUR },
  { value: 'VIDEO_CONSULTATION', label: SERVICE_LABEL.VIDEO_CONSULTATION },
  { value: 'CONSULTATION', label: SERVICE_LABEL.CONSULTATION },
];

// Fallback copy — shown instantly, then replaced by the admin-editable `home.hero`
// CMS block if one is published (so the hero can be edited from the admin portal).
const DEFAULT_HERO_TITLE = 'Book private campus tours. Things just got personal.';
const DEFAULT_HERO_SUBTITLE =
  'Get the scoop and find the school that fits you best on a private campus tour tailored to you.';

/** Render the heading. Both sentences use the primary foreground — `ink-900` rather
 *  than a literal white, so it stays correct in the light theme too. */
function HeroHeading({ title }: { title: string }) {
  const i = title.indexOf('. ');
  if (i === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, i + 1)} <span className="text-ink-900">{title.slice(i + 2)}</span>
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
  const [dateOpen, setDateOpen] = useState(false);
  const schoolRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Live schools from the admin-managed catalog (GET /api/v1/schools, enabled only).
  const { universities, loading: schoolsLoading } = useUniversities();

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) setSchoolOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSchoolOpen(false);
        setDateOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const q = university.toLowerCase().trim();
  const schoolMatches = universities.filter(
    (u) =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      `${u.city}, ${u.state}`.toLowerCase().includes(q),
  );

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
              'flex items-center gap-2.5 rounded-xl border bg-surface px-3.5 py-2.5 transition-colors',
              schoolOpen ? 'border-brand/40' : 'border-ink-200',
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
              role="combobox"
              aria-expanded={schoolOpen}
              aria-controls={`${idPrefix}-school-list`}
              className="w-full min-w-0 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {university && (
              <button
                type="button"
                onClick={() => onUniChange('')}
                aria-label="Clear school"
                className="shrink-0 cursor-pointer rounded-full p-0.5 text-ink-400 transition-colors hover:text-ink-900"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {schoolOpen && (
            <div
              id={`${idPrefix}-school-list`}
              role="listbox"
              className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-ink-200/80 bg-surface shadow-lift"
            >
              <div className="max-h-[248px] overflow-y-auto p-2">
                {schoolsLoading ? (
                  <p className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-ink-400">
                    <Loader2 size={14} className="animate-spin" /> Loading schools…
                  </p>
                ) : schoolMatches.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-ink-400">
                    {universities.length === 0 ? 'No schools available yet' : 'No schools found'}
                  </p>
                ) : (
                  schoolMatches.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      role="option"
                      aria-selected={university === u.name}
                      onClick={() => {
                        onUniChange(u.name);
                        setSchoolOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-brand-tint"
                    >
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        // Schools added without a photo still need a stable-width row.
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand">
                          <GraduationCap size={16} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-900">{u.name}</p>
                        <p className="truncate text-xs text-ink-500">
                          {[u.city, u.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Link
                href="/suggest-school"
                onClick={() => setSchoolOpen(false)}
                className="block w-full border-t border-ink-100 px-4 py-3 text-center text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
              >
                Suggest a new school
              </Link>
            </div>
          )}
        </div>

        {/* Date — custom calendar popover rather than a native date input, so past
            days can be disabled and the picker looks the same in every browser. */}
        <div className="relative" ref={dateRef}>
          <span className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800">Date</span>
          <button
            type="button"
            onClick={() => {
              setDateOpen((v) => !v);
              setSchoolOpen(false);
            }}
            aria-haspopup="dialog"
            aria-expanded={dateOpen}
            className={cn(
              'flex w-full cursor-pointer items-center gap-2.5 rounded-xl border bg-surface px-3.5 py-2.5 text-left transition-colors',
              dateOpen ? 'border-brand/40' : 'border-ink-200',
            )}
          >
            <CalendarDays size={15} className="shrink-0 text-ink-400" />
            <span className={cn('flex-1 truncate text-sm', date ? 'text-ink-900' : 'text-ink-400')}>
              {date ? formatDate(date) : 'Add date'}
            </span>
            {date && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date"
                onClick={(e) => {
                  e.stopPropagation();
                  onDateChange('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onDateChange('');
                  }
                }}
                className="shrink-0 rounded-full p-0.5 text-ink-400 transition-colors hover:text-ink-900"
              >
                <X size={14} />
              </span>
            )}
          </button>

          {dateOpen && (
            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50">
              <Calendar
                value={date}
                onSelect={(v) => {
                  onDateChange(v);
                  setDateOpen(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Tour type */}
        <div>
          <label
            htmlFor={`${idPrefix}-tour-type`}
            className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
          >
            Tour type
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-surface px-3.5 py-2.5 transition-colors focus-within:border-brand/40">
            <Compass size={15} className="shrink-0 text-ink-400" />
            <select
              id={`${idPrefix}-tour-type`}
              value={tourType}
              onChange={(e) => onTourTypeChange(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-900 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <option value="">Add tour type</option>
              {TOUR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
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
    <section className="flex flex-col bg-surface">
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
        {/* Background video — the six clips in /public/videos, shuffled and
            crossfaded. Self-hosted, so it no longer depends on a third-party CDN. */}
        <HeroVideo poster={PHOTOS.campusTour.src} />

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
          <div className="w-full max-w-[390px] rounded-2xl bg-surface p-6 shadow-[0_12px_48px_rgba(0,0,0,0.24)] lg:max-w-[430px] lg:p-8 xl:p-9">
            <SearchCard idPrefix="hero-d" {...sharedProps} />
          </div>
        </div>
      </div>

      {/* Mobile / tablet card — stacks below video, hidden on lg+ */}
      <div className="mx-4 mb-4 mt-3 sm:mx-auto sm:mt-5 sm:w-full sm:max-w-[480px] sm:px-4 lg:hidden">
        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
          <SearchCard idPrefix="hero-m" {...sharedProps} />
        </div>
      </div>
    </section>
  );
}
