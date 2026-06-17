'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MapPin, SearchX } from 'lucide-react';
import { UniversityCard } from '@/components/cards/university-card';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { universities } from '@/lib/data';

// Demo set of popular USA states for the selector. Wire to the real taxonomy
// (all 50 states) once universities are served from the backend.
const STATES = ['California', 'New York', 'Texas', 'Florida', 'Massachusetts', 'Illinois'];

const PAGE_SIZE = 6;

export function UniversityExplorer() {
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return universities.filter((u) => {
      const matchesQuery =
        !q || u.name.toLowerCase().includes(q) || u.location.toLowerCase().includes(q);
      const matchesState = !stateFilter || u.state === stateFilter;
      return matchesQuery && matchesState;
    });
  }, [query, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Keep the page in range as filters shrink the result set.
  useEffect(() => {
    setPage(1);
  }, [query, stateFilter]);

  const current = Math.min(page, totalPages);
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function goToPage(p: number) {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const hasFilters = Boolean(query || stateFilter);

  return (
    <section className="py-14 sm:py-20">
      <div className="container-page">
        <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+1.5rem)]" />

        {/* Filters: name search + USA state selector */}
        <div className="flex flex-col gap-3 rounded-3xl border border-ink-200/70 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:gap-4 sm:p-5">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <label htmlFor="uni-search" className="sr-only">
              Search universities
            </label>
            <input
              id="uni-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by university name or city…"
              className="w-full rounded-2xl border border-ink-200 bg-ivory/60 py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
            />
          </div>

          <div className="relative sm:w-60">
            <MapPin
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              aria-hidden
            />
            <label htmlFor="uni-state" className="sr-only">
              Filter by state
            </label>
            <select
              id="uni-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-2xl border border-ink-200 bg-ivory/60 py-3 pl-11 pr-9 text-sm text-ink-900 transition-colors focus:border-maroon-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
            >
              <option value="">All states</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Result count */}
        <p className="mt-5 text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'university' : 'universities'}
          {stateFilter && (
            <>
              {' '}
              in <span className="font-semibold text-maroon-900">{stateFilter}</span>
            </>
          )}
          {query && (
            <>
              {' '}
              for <span className="font-semibold text-maroon-900">“{query}”</span>
            </>
          )}
        </p>

        {pageItems.length > 0 ? (
          <RevealGroup className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((u) => (
              <Reveal as="div" key={u.slug}>
                <UniversityCard u={u} />
              </Reveal>
            ))}
          </RevealGroup>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-300 bg-white/60 px-6 py-20 text-center">
            <SearchX size={40} className="text-ink-300" />
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">
              No universities match
            </h3>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Try a different name or choose another state.
            </p>
            {hasFilters && (
              <Button
                variant="primary"
                className="mt-6"
                onClick={() => {
                  setQuery('');
                  setStateFilter('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination — sits above the footer */}
        <Pagination
          currentPage={current}
          totalPages={totalPages}
          onPageChange={goToPage}
          className="mt-12"
        />
      </div>
    </section>
  );
}
