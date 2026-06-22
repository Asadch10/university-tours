import type { Metadata } from 'next';
import { GuideLanding } from '@/components/guide/guide-landing';

export const metadata: Metadata = {
  title: 'Become a guide',
  description:
    'Earn $40/hour in your free time. Sign up in 2 minutes, host private campus tours and video consultations, and get paid to share your school.',
};

export default function BecomeAGuidePage() {
  return <GuideLanding />;
}
