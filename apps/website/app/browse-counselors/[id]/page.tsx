import type { Metadata } from 'next';
import { CounselorDetail } from '@/components/counselor/counselor-detail';

export const metadata: Metadata = {
  title: 'College counselor',
  description: 'View a verified college admissions counselor and book a private consultation.',
};

export default async function CounselorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="pt-[var(--header-h)]">
      <CounselorDetail id={id} />
    </div>
  );
}
