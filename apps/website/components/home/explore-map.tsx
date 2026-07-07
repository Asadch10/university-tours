'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Search, X, ExternalLink, MapPin, Users, SlidersHorizontal } from 'lucide-react';
import type { UniversityPin } from './map-view';
import { useUniversities } from '@/lib/schools';

/* ─── Dynamic Leaflet map (no SSR) ──────────────────────────────────── */

const MapView = dynamic(
  () => import('./map-view').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#e8e0d8]">
        <p className="text-sm text-ink-500">Loading map…</p>
      </div>
    ),
  },
);

/* ─── Component ──────────────────────────────────────────────────────── */

export function ExploreMap() {
  const { universities, loading } = useUniversities();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UniversityPin | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.state.toLowerCase().includes(q),
    );
  }, [search, universities]);

  function handleSelect(u: UniversityPin) {
    setSelected((prev) => (prev?.id === u.id ? null : u));
  }

  return (
    <section className="bg-white py-10 sm:py-12">

      {/* Heading — centred, constrained */}
      <div className="container-page mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Explore all schools
        </h2>
        <p className="mt-3 text-[0.9rem] text-ink-600">
          Discover your next campus — click any school or pin to see the inside scoop
        </p>
      </div>

      {/* ── Mobile search bar — shown above map on phones only ──────────── */}
      <div className="mx-4 mb-3 sm:hidden">
        <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-3 py-2.5 shadow-soft focus-within:border-maroon-800/60 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.08)]">
          <Search size={14} className="shrink-0 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools or cities…"
            className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="shrink-0 text-ink-400 hover:text-ink-600"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Map card — edge-to-edge (same margins as the hero video) ────── */}
      <div className="mx-4 sm:mx-7 lg:mx-10">
        <div className="flex h-[55vh] min-h-[360px] overflow-hidden rounded-3xl border border-ink-200/60 shadow-card sm:h-[620px] lg:h-[680px]">

          {/* ── Left sidebar — hidden on phones so the map fills the card ── */}
          <div className="hidden w-[280px] shrink-0 flex-col border-r border-ink-100 bg-white sm:flex lg:w-[360px] xl:w-[420px]">

            {/* Search row */}
            <div className="shrink-0 border-b border-ink-100 p-4">
              <div className="flex items-center gap-2">
                {/* Input */}
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2.5 transition-[border-color,box-shadow] focus-within:border-maroon-800/60 focus-within:shadow-[0_0_0_3px_rgba(107,21,33,0.08)]">
                  <Search size={14} className="shrink-0 text-ink-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search schools or cities…"
                    className="w-full bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="shrink-0 text-ink-400 hover:text-ink-600"
                      aria-label="Clear search"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {/* Filter button */}
                <button
                  type="button"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
                  aria-label="Filter schools"
                >
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Count */}
            <div className="shrink-0 px-5 py-2.5 text-[0.72rem] font-semibold uppercase tracking-wider text-ink-400">
              {filtered.length} school{filtered.length !== 1 ? 's' : ''}
            </div>

            {/* University list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-5 py-8 text-center text-sm text-ink-400">Loading schools…</p>
              ) : filtered.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-ink-400">No schools found</p>
              ) : (
                filtered.map((u) => {
                  const isActive = selected?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelect(u)}
                      className={`flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors hover:bg-ink-50 ${
                        isActive
                          ? 'border-l-[3px] border-maroon-900 bg-maroon-50/50 pl-[17px]'
                          : ''
                      }`}
                    >
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt={u.name}
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-maroon-gradient font-display text-lg font-bold text-ivory">
                          {u.name.charAt(0)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm font-semibold leading-snug ${
                            isActive ? 'text-maroon-900' : 'text-ink-900'
                          }`}
                        >
                          {u.name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {u.city}, {u.state}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Map + overlays ────────────────────────────────────────────── */}
          <div className="relative flex-1 overflow-hidden">

            {/* Leaflet map (always full area) */}
            <MapView
              universities={universities}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
              panelWidth={400}
            />

            {/* Dim scrim — fades map when detail panel is open.
                z must sit ABOVE Leaflet's panes/controls (which go up to 1000). */}
            <div
              className={`pointer-events-none absolute inset-0 z-[1000] bg-black/20 transition-opacity duration-300 ${
                selected ? 'opacity-100' : 'opacity-0'
              }`}
              aria-hidden
            />

            {/* ── Detail panel — slides in from right on pin / list click ──
                z-[1100] keeps it above the Leaflet zoom control + tiles. */}
            <div
              className={`absolute inset-y-0 right-0 z-[1100] flex w-full max-w-[420px] flex-col overflow-y-auto bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                selected ? 'translate-x-0' : 'translate-x-full'
              }`}
              aria-hidden={!selected}
            >
              {selected && (
                <>
                  {/* Campus hero image */}
                  <div className="relative h-[210px] shrink-0 overflow-hidden">
                    {selected.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selected.image}
                        alt={selected.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-maroon-gradient font-display text-5xl font-bold text-ivory">
                        {selected.name.charAt(0)}
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)',
                      }}
                      aria-hidden
                    />
                    <p className="absolute bottom-4 left-5 right-12 font-display text-[1.05rem] font-bold leading-snug text-white">
                      {selected.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      aria-label="Close detail panel"
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow transition-colors hover:bg-white"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Info body */}
                  <div className="flex flex-1 flex-col p-5">

                    {/* Location + ranking */}
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="shrink-0 text-ink-400" />
                      <p className="text-[0.8rem] text-ink-600">
                        {selected.city}, {selected.state}
                        {selected.ranking && (
                          <>
                            <span className="mx-1.5 text-ink-300">·</span>
                            <span className="font-semibold text-ink-800">{selected.ranking}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Official website link */}
                    <Link
                      href={selected.href}
                      className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-maroon-900 hover:underline"
                    >
                      Visit official website <ExternalLink size={11} />
                    </Link>

                    {/* Divider */}
                    <hr className="my-4 border-ink-100" />

                    {/* Inside Scoop */}
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-ink-400">
                      The Inside Scoop
                    </p>
                    <p className="mt-2 text-[0.83rem] leading-relaxed text-ink-700">
                      {selected.blurb}
                    </p>

                    {/* Ambassadors */}
                    <div className="mt-4 flex items-center gap-1.5 text-[0.8rem] text-ink-500">
                      <Users size={13} className="shrink-0" />
                      <span>
                        <strong className="font-semibold text-ink-800">{selected.ambassadors}</strong>{' '}
                        verified student guides
                      </span>
                    </div>

                    {/* CTAs */}
                    <div className="mt-auto flex gap-3 pt-6">
                      <Link
                        href={`/search?q=${encodeURIComponent(selected.name)}`}
                        className="flex flex-1 items-center justify-center rounded-xl bg-maroon-900 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-maroon-800"
                      >
                        View guides
                      </Link>
                      <Link
                        href={selected.href}
                        className="flex flex-1 items-center justify-center rounded-xl border border-ink-200 py-3 text-sm font-semibold text-ink-900 transition-colors hover:bg-ink-50"
                      >
                        Explore school
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
