import type { Metadata } from 'next';
import { VirtualToursPage } from '@/components/virtual-tours/virtual-tours-page';

export const metadata: Metadata = {
  title: 'Virtual tours',
  description:
    'Talk to real students before choosing a college. Get honest answers about academics and campus life on a live video call with a current student.',
};

export default function VirtualTours() {
  return <VirtualToursPage />;
}
