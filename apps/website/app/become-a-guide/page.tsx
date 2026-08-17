import type { Metadata } from 'next';
import { GuideLanding } from '@/components/guide/guide-landing';
import { BecomeGuideGate } from '@/components/guide/become-guide-gate';

export const metadata: Metadata = {
  title: 'Become a guide',
  description:
    'Get paid in your free time. Sign up in 2 minutes, host private campus tours and video consultations, and get paid to share your school.',
};

export default function BecomeAGuidePage() {
  // Signed-out visitors see the marketing landing; signed-in users see the application form.
  return <BecomeGuideGate marketing={<GuideLanding />} />;
}
