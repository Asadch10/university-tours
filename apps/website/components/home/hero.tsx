'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Calendar, Compass } from 'lucide-react';
import { universities } from '@/lib/data';

/* ─── Shared search form rendered inside both mobile + desktop cards ─── */

function SearchCard({
  idPrefix,
  university,
  date,
  tourType,
  onUniChange,
  onDateChange,
  onTourTypeChange,
  onSubmit,
}: {
  idPrefix: string;
  university: string;
  date: string;
  tourType: string;
  onUniChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onTourTypeChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <h1 className="font-display text-2xl font-bold leading-snug text-ink-900 sm:text-[1.85rem] lg:text-[2.1rem]">
        Book private campus tours.{' '}
        <span className="text-maroon-900">Things just got personal.</span>
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-ink-500 lg:text-[0.95rem]">
        Get the scoop and find the school that fits you best on a private
        campus tour tailored to you.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        {/* School */}
        <div>
          <label
            htmlFor={`${idPrefix}-school`}
            className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
          >
            School
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] focus-within:border-maroon-800/40 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.09)]">
            <GraduationCap size={15} className="shrink-0 text-ink-400" />
            <input
              id={`${idPrefix}-school`}
              list={`${idPrefix}-uni-list`}
              value={university}
              onChange={(e) => onUniChange(e.target.value)}
              placeholder="Search schools"
              autoComplete="off"
              className="w-full min-w-0 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
            <datalist id={`${idPrefix}-uni-list`}>
              {universities.map((u) => (
                <option key={u.slug} value={u.name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Date */}
        <div>
          <label
            htmlFor={`${idPrefix}-date`}
            className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
          >
            Date
          </label>
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] focus-within:border-maroon-800/40 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.09)]">
            <Calendar size={15} className="shrink-0 text-ink-400" />
            <input
              id={`${idPrefix}-date`}
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
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
          <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] focus-within:border-maroon-800/40 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.09)]">
            <Compass size={15} className="shrink-0 text-ink-400" />
            <select
              id={`${idPrefix}-tour-type`}
              value={tourType}
              onChange={(e) => onTourTypeChange(e.target.value)}
              className="w-full cursor-pointer appearance-none bg-transparent text-sm text-ink-900 focus:outline-none"
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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (university) params.set('q', university);
    if (date) params.set('date', date);
    if (tourType) params.set('service', tourType);
    router.push(`/search?${params.toString()}`);
  }

  const sharedProps = {
    university,
    date,
    tourType,
    onUniChange: setUniversity,
    onDateChange: setDate,
    onTourTypeChange: setTourType,
    onSubmit: handleSearch,
  };

  return (
    <section className="flex flex-col bg-white sm:min-h-dvh">
      {/* Fixed-header offset */}
      <div className="shrink-0" style={{ height: 'calc(var(--header-h) + 1.25rem)' }} />

      {/*
       * Mobile  (< sm): rounded video strip with side margins; search card sits below.
       * sm–md:          full-bleed video (no side margins), card overlays left side.
       * lg+:            same but wider card padding.
       */}

      {/* ── Video container ───────────────────────────────────────────── */}
      <div
        className={[
          'relative overflow-hidden',
          /* Mobile: rounded strip with gutters, capped so it isn't huge on tall phones */
          'mx-4 h-[44vh] min-h-[240px] max-h-[440px] rounded-2xl',
          /* sm+: edge-to-edge, fills remaining height, but tall enough to never clip the card */
          'sm:mx-0 sm:h-auto sm:max-h-none sm:flex-1 sm:min-h-[600px] sm:rounded-t-none sm:rounded-b-[2rem]',
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
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-540p.mp4"
            type="video/mp4"
          />
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p.mp4"
            type="video/mp4"
          />
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-540p.hevc.mp4"
            type='video/mp4; codecs="hvc1"'
          />
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p-av1.mp4"
            type='video/mp4; codecs="av01.0.05M.08"'
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

        {/* Desktop / tablet card — overlays left side of video, hidden on mobile */}
        <div className="absolute inset-y-0 left-0 hidden items-center px-6 py-10 sm:flex md:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-[0_12px_48px_rgba(0,0,0,0.24)] md:max-w-[390px] md:p-8 lg:max-w-[430px] lg:p-9">
            <SearchCard idPrefix="hero-d" {...sharedProps} />
          </div>
        </div>
      </div>

      {/* Mobile card — stacks below video, hidden on sm+ */}
      <div className="mx-4 mb-4 mt-3 sm:hidden">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
          <SearchCard idPrefix="hero-m" {...sharedProps} />
        </div>
      </div>
    </section>
  );
}
