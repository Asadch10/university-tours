import type { Metadata } from 'next';
import { ExploreScreen } from '@/components/universities/explore-screen';

export const metadata: Metadata = {
  title: 'Explore schools',
  description:
    'Browse universities on an interactive map. Click any school to see the inside scoop and meet its verified student guides.',
};

export default function UniversitiesPage() {
  return <ExploreScreen />;
}
