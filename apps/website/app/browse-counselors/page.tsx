import type { Metadata } from 'next';
import { CounselorResults } from '@/components/counselor/counselor-results';

export const metadata: Metadata = {
  title: 'Browse college counselors',
  description:
    'Find a verified college admissions counselor. Search by specialty, experience, and rating, then book a private consultation.',
};

export default async function BrowseCounselorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <div className="pt-[var(--header-h)]">
      <CounselorResults initialQuery={q ?? ''} />
    </div>
  );
}
