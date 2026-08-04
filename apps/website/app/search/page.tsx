import type { Metadata } from 'next';
import { SearchResults } from '@/components/search/search-results';

export const metadata: Metadata = {
  title: 'Browse tour guides',
  description:
    'Search verified student tour guides by university, date, and tour type. Book a private campus tour or video consultation.',
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; service?: string; date?: string }>;
}) {
  const { q, service, date } = await searchParams;

  return (
    <div className="pt-[var(--header-h)]">
      <SearchResults
        initialQuery={q ?? ''}
        initialService={service ?? ''}
        initialDate={date ?? ''}
      />
    </div>
  );
}
