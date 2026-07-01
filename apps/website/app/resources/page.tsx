import type { Metadata } from 'next';
import { ResourcesPage } from '@/components/resources/resources-page';

export const metadata: Metadata = {
  title: 'Resource Center',
  description:
    'Discover resources and tools from University Campus Private Tours and our partners to support every step of your college search and admissions journey.',
};

export default function Resources() {
  return <ResourcesPage />;
}
