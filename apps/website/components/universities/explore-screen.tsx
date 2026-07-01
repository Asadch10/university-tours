'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  Search, X, ExternalLink, MapPin, Users, SlidersHorizontal, Map as MapIcon, List as ListIcon,
} from 'lucide-react';
import type { UniversityPin } from '@/components/home/map-view';
import { UNIVERSITIES } from '@/components/home/explore-map';

/* ─── Dynamic Leaflet map (no SSR) ──────────────────────────────────── */

const MapView = dynamic(
  () => import('@/components/home/map-view').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#e8e0d8]">
        <p className="text-sm text-ink-500">Loading map…</p>
      </div>
    ),
  },
);

/* ─── Full-screen explore page ──────────────────────────────────────── */

export function ExploreScreen() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UniversityPin | null>(null);
  // Mobile-only view toggle (list ⇄ map); on lg+ both are always shown.
  const [view, setView] = useState<'list' | 'map'>('list');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return UNIVERSITIES;
    return UNIVERSITIES.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.state.toLowerCase().includes(q),
    );
  }, [search]);

  function handleSelect(u: UniversityPin) {
    setSelected((prev) => (prev?.id === u.id ? null : u));
    setView('map'); // on mobile, jump to the map + detail when a school is picked
  }

  return (
    /* Full viewport height below the fixed header — edge-to-edge, no card. */
    <div className="relative flex h-[calc(100dvh-var(--header-h))] mt-[var(--header-h)] overflow-hidden bg-white">

      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <div
        className={`${view === 'list' ? 'flex' : 'hidden'} w-full shrink-0 flex-col border-r border-ink-100 bg-white lg:flex lg:w-[380px] xl:w-[420px]`}
      >

        {/* Search row */}
        <div className="shrink-0 border-b border-ink-100 p-4">
          <div className="flex items-center gap-2">
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
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">No schools found</p>
          ) : (
            filtered.map((u) => {
              const isActive = selected?.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelect(u)}
                  className={`flex w-full items-center gap-3.5 border-b border-ink-50 px-5 py-3.5 text-left transition-colors hover:bg-ink-50 ${
                    isActive ? 'border-l-[3px] border-l-maroon-900 bg-maroon-50/50 pl-[17px]' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.image}
                    alt={u.name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
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

      {/* ── Map + overlays ───────────────────────────────────────────── */}
      <div className={`${view === 'map' ? 'block' : 'hidden'} relative flex-1 overflow-hidden lg:block`}>

        <MapView
          universities={UNIVERSITIES}
          selectedId={selected?.id ?? null}
          onSelect={handleSelect}
          panelWidth={420}
        />

        {/* Dim scrim — above Leaflet panes/controls */}
        <div
          className={`pointer-events-none absolute inset-0 z-[1000] bg-black/20 transition-opacity duration-300 ${
            selected ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden
        />

        {/* Detail panel */}
        <div
          className={`absolute inset-y-0 right-0 z-[1100] flex w-full flex-col overflow-y-auto bg-white shadow-[-8px_0_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:w-[380px] xl:w-[440px] ${
            selected ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-hidden={!selected}
        >
          {selected && (
            <>
              {/* Campus hero image */}
              <div className="relative h-[230px] shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)',
                  }}
                  aria-hidden
                />
                <p className="absolute bottom-4 left-5 right-12 font-display text-[1.15rem] font-bold leading-snug text-white">
                  {selected.name}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setView('list');
                  }}
                  aria-label="Close detail panel"
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow transition-colors hover:bg-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Info body */}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0 text-ink-400" />
                  <p className="text-[0.8rem] text-ink-600">
                    {selected.city}, {selected.state}
                    <span className="mx-1.5 text-ink-300">·</span>
                    <span className="font-semibold text-ink-800">{selected.ranking}</span>
                  </p>
                </div>

                <Link
                  href={selected.href}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-maroon-900 hover:underline"
                >
                  Visit official website <ExternalLink size={11} />
                </Link>

                <hr className="my-4 border-ink-100" />

                <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-ink-400">
                  The Inside Scoop
                </p>
                <p className="mt-2 text-[0.83rem] leading-relaxed text-ink-700">
                  {selected.blurb}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-[0.8rem] text-ink-500">
                  <Users size={13} className="shrink-0" />
                  <span>
                    <strong className="font-semibold text-ink-800">{selected.ambassadors}</strong>{' '}
                    verified student guides
                  </span>
                </div>

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

      {/* Mobile List/Map toggle (hidden on lg+ and while a detail panel is open) */}
      {!selected && (
        <button
          type="button"
          onClick={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
          className="absolute bottom-5 left-1/2 z-[1050] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-colors hover:bg-ink-800 lg:hidden"
        >
          {view === 'list' ? (
            <>
              <MapIcon size={16} /> Map
            </>
          ) : (
            <>
              <ListIcon size={16} /> List
            </>
          )}
        </button>
      )}
    </div>
  );
}
