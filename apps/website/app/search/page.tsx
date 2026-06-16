import type { Metadata } from 'next';
import { SearchResults } from '@/components/search/search-results';

export const metadata: Metadata = {
  title: 'Find a student guide',
  description:
    'Search verified student ambassadors by university, service, price, and rating. Book a private campus tour or video consultation.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; service?: string }>;
}) {
  const { q, service } = await searchParams;

  return (
    <>
      <section className="bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-x-0 opacity-30" aria-hidden />
        <div className="container-page relative py-12 sm:py-16">
          <span className="eyebrow text-gold-300">
            <span className="h-px w-6 bg-gold-300/60" /> Browse guides
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Find your student guide
          </h1>
          <p className="mt-3 max-w-xl text-ivory/75">
            Verified current students, transparent pricing, and honest reviews. You’re only charged
            when a guide accepts your request.
          </p>
        </div>
      </section>
      <SearchResults initialQuery={q ?? ''} initialService={service ?? ''} />
    </>
  );
}
