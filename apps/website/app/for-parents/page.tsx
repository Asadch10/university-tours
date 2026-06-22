import type { Metadata } from 'next';
import { ParentsPage } from '@/components/parents/parents-page';

export const metadata: Metadata = {
  title: 'For parents',
  description:
    'Help your child choose the right school with confidence. Private campus tours led by verified current students give your family honest insight for a big decision.',
};

export default function ForParents() {
  return <ParentsPage />;
}
