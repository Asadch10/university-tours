import type { Metadata } from 'next';
import { GroupToursIntro } from '@/components/group-tours/group-tours-intro';
import { TrustedReviews } from '@/components/home/trusted-reviews';
import { FeaturedGuides } from '@/components/home/featured-guides';

export const metadata: Metadata = {
  title: 'Private group tours',
  description:
    'Private, student-led college tours for your group. We help high schools, college prep programs, and educational travel organizations plan personalized campus visits nationwide.',
};

export default function GroupTours() {
  return (
    <div className="pt-[var(--header-h)]">
      <GroupToursIntro />
      <TrustedReviews />
      <FeaturedGuides />
    </div>
  );
}
