import type { Metadata } from 'next';
import { ManageListingView } from '@/components/listing/manage-listing-view';

export const metadata: Metadata = { title: 'Manage listing' };

export default function ManageListingPage() {
  return <ManageListingView />;
}
