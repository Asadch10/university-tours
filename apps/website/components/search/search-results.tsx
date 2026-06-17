'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, X, SearchX } from 'lucide-react';
import { AmbassadorCard } from '@/components/cards/ambassador-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { cn, formatPrice } from '@/lib/utils';
import { ambassadors, universities, type Ambassador } from '@/lib/data';

type Sort = 'recommended' | 'rating' | 'price-asc' | 'price-desc';

const PAGE_SIZE = 6;

export function SearchResults({
  initialQuery = '',
  initialService = '',
}: {
  initialQuery?: string;
  initialService?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [service, setService] = useState(initialService);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<Sort>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    let list = ambassadors.filter((a) => {
      const matchesQuery =
        !query ||
        a.university.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.major.toLowerCase().includes(query.toLowerCase());
      const matchesService = !service || a.services.includes(service as Ambassador['services'][number]);
      const matchesPrice = a.priceFrom <= maxPrice;
      const matchesRating = a.rating >= minRating;
      return matchesQuery && matchesService && matchesPrice && matchesRating;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price-asc') return a.priceFrom - b.priceFrom;
      if (sort === 'price-desc') return b.priceFrom - a.priceFrom;
      return b.toursGiven - a.toursGiven;
    });
    return list;
  }, [query, service, maxPrice, minRating, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));

  // Snap back to the first page whenever the filtered/sorted set changes.
  useEffect(() => {
    setPage(1);
  }, [query, service, maxPrice, minRating, sort]);

  const current = Math.min(page, totalPages);
  const pageItems = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function goToPage(p: number) {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const reset = () => {
    setQuery('');
    setService('');
    setMaxPrice(10000);
    setMinRating(0);
  };

  const Filters = (
    <div className="flex flex-col gap-7">
      <div>
        <label className="text-sm font-semibold text-ink-900">University or keyword</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Stanford, Computer Science"
          className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-900">Service</p>
        <div className="mt-3 flex flex-col gap-2">
          {[
            { v: '', l: 'Any service' },
            { v: 'CAMPUS_TOUR', l: 'In-person tour' },
            { v: 'VIDEO_CONSULTATION', l: 'Video consultation' },
          ].map((opt) => (
            <label key={opt.v} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
              <input
                type="radio"
                name="service"
                checked={service === opt.v}
                onChange={() => setService(opt.v)}
                className="h-4 w-4 accent-maroon-800"
              />
              {opt.l}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">Max price</p>
          <span className="text-sm font-semibold text-maroon-900">{formatPrice(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={2000}
          max={10000}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="mt-3 w-full accent-maroon-800"
        />
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-900">Minimum rating</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 4, 4.5, 4.8].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(r)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-sm transition-colors cursor-pointer',
                minRating === r
                  ? 'border-maroon-800 bg-maroon-50 text-maroon-900'
                  : 'border-ink-200 text-ink-600 hover:border-maroon-800/40',
              )}
            >
              {r === 0 ? 'Any' : `${r}+`}
            </button>
          ))}
        </div>
      </div>

      <Button variant="ghost" onClick={reset} className="self-start">
        Reset filters
      </Button>
    </div>
  );

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[280px_1fr] lg:py-14">
      {/* Desktop filters */}
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] rounded-3xl border border-ink-200/70 bg-white p-6 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink-900">Filters</h2>
          <div className="mt-6">{Filters}</div>
        </div>
      </aside>

      <div>
        <div ref={topRef} className="scroll-mt-[calc(var(--header-h)+1.5rem)]" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-600">
            <span className="font-semibold text-ink-900">{results.length}</span> guide
            {results.length === 1 ? '' : 's'} available
            {query && (
              <>
                {' '}
                for <span className="font-semibold text-maroon-900">“{query}”</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal size={16} /> Filters
            </Button>
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="cursor-pointer rounded-full border border-ink-200 bg-white px-4 py-2 text-sm text-ink-800 focus:border-maroon-800 focus:outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Top rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {results.length > 0 ? (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((a) => (
                <AmbassadorCard key={a.id} a={a} />
              ))}
            </div>
            {/* Pagination — sits above the footer */}
            <Pagination
              currentPage={current}
              totalPages={totalPages}
              onPageChange={goToPage}
              className="mt-12"
            />
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-300 bg-white/60 px-6 py-20 text-center">
            <SearchX size={40} className="text-ink-300" />
            <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">No guides match</h3>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              Try widening your price range, lowering the rating filter, or searching another
              university.
            </p>
            <Button variant="primary" className="mt-6" onClick={reset}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-ivory p-6 shadow-lift">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-maroon-50 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-6">{Filters}</div>
            <Button variant="primary" className="mt-8 w-full" onClick={() => setFiltersOpen(false)}>
              Show {results.length} guides
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
