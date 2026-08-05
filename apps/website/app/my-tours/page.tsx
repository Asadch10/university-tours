import type { Metadata } from 'next';
import { MyToursView } from '@/components/tours/my-tours-view';

export const metadata: Metadata = { title: 'My bookings' };

export default function MyToursPage() {
  return <MyToursView />;
}
