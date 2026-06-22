'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, GraduationCap, Calendar, Compass } from 'lucide-react';
import { universities } from '@/lib/data';

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

  return (
    /*
     * Outer section: white page background, full viewport height, flex column.
     * A spacer div pushes the rounded container below the fixed header.
     * The container itself has equal margins on left / right / bottom so it
     * sits as a "card" inside the page — matching SchoolScoops layout.
     */
    <section className="flex min-h-dvh flex-col bg-white">
      {/* Fixed-header offset + gap between nav and the rounded container */}
      <div className="shrink-0" style={{ height: 'calc(var(--header-h) + 1.25rem)' }} />

      {/* ── Rounded video container ───────────────────────────────────
          mx / mb give equal whitespace on left, right and bottom.
          flex-1 makes it fill the remaining viewport height.          */}
      <div className="relative mx-5 mb-5 flex-1 overflow-hidden rounded-3xl sm:mx-7 sm:mb-7 lg:mx-10 lg:mb-10">

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
          {/* H.264 540p — smallest / most compatible, loads first */}
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-540p.mp4"
            type="video/mp4"
          />
          {/* H.264 1080p — higher quality on faster connections */}
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p.mp4"
            type="video/mp4"
          />
          {/* HEVC — Safari / Apple Silicon optimised */}
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-540p.hevc.mp4"
            type='video/mp4; codecs="hvc1"'
          />
          {/* AV1 — Chrome / Firefox best-quality option */}
          <source
            src="https://d3m810mf773mim.cloudfront.net/static/hero/homepage-hero-1080p-av1.mp4"
            type='video/mp4; codecs="av01.0.05M.08"'
          />
        </video>

        {/* Gradient overlay — heavier left so the white card stays readable */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(10,8,6,0.62) 0%, rgba(10,8,6,0.36) 50%, rgba(10,8,6,0.10) 100%)',
          }}
        />

        {/* ── Widget — left side, vertically centred ───────────────────
            absolute inset-y-0 left-0 flex items-center keeps the card
            hugging the left edge and centred vertically at all heights. */}
        <div className="absolute inset-y-0 left-0 flex items-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-7 shadow-[0_12px_48px_rgba(0,0,0,0.20)] sm:p-9">

            <h1 className="font-display text-[1.6rem] font-bold leading-snug text-ink-900 sm:text-[1.85rem]">
              Book private campus tours.{' '}
              <span className="text-maroon-900">Things just got personal.</span>
            </h1>

            <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-500">
              Get the scoop and find the school that fits you best on a private
              campus tour tailored to you.
            </p>

            <form onSubmit={handleSearch} className="mt-6 space-y-3">

              {/* School */}
              <div>
                <label
                  htmlFor="hero-school"
                  className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
                >
                  School
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] focus-within:border-maroon-800/40 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.09)]">
                  <GraduationCap size={15} className="shrink-0 text-ink-400" />
                  <input
                    id="hero-school"
                    list="hero-uni-list"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Search schools"
                    autoComplete="off"
                    className="w-full min-w-0 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                  <datalist id="hero-uni-list">
                    {universities.map((u) => (
                      <option key={u.slug} value={u.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Date */}
              <div>
                <label
                  htmlFor="hero-date"
                  className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
                >
                  Date
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] focus-within:border-maroon-800/40 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.09)]">
                  <Calendar size={15} className="shrink-0 text-ink-400" />
                  <input
                    id="hero-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full cursor-pointer bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Tour type */}
              <div>
                <label
                  htmlFor="hero-tour-type"
                  className="mb-1.5 block text-[0.78rem] font-semibold text-ink-800"
                >
                  Tour type
                </label>
                <div className="flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 transition-[box-shadow,border-color] focus-within:border-maroon-800/40 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.09)]">
                  <Compass size={15} className="shrink-0 text-ink-400" />
                  <select
                    id="hero-tour-type"
                    value={tourType}
                    onChange={(e) => setTourType(e.target.value)}
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
          </div>
        </div>
      </div>
    </section>
  );
}
