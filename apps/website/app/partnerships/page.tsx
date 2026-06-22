import type { Metadata } from 'next';
import { PartnershipsPage } from '@/components/partnerships/partnerships-page';

export const metadata: Metadata = {
  title: 'School partnerships',
  description:
    'Personalized campus tours, powered by your students. We help admissions teams personalize every prospective student’s visit — boosting applications and yield.',
};

export default function Partnerships() {
  return <PartnershipsPage />;
}
