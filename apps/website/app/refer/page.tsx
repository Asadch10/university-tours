import type { Metadata } from 'next';
import { ReferPage } from '@/components/refer/refer-page';

export const metadata: Metadata = {
  title: 'Refer a friend',
  description:
    'Invite your friends to University Campus Private Tours and earn $20 when they host their first tour.',
};

export default function Refer() {
  return <ReferPage />;
}
