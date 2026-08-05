import type { Metadata } from 'next';
import { CounselorLanding } from '@/components/counselor/counselor-landing';
import { BecomeCounselorGate } from '@/components/counselor/become-counselor-gate';

export const metadata: Metadata = {
  title: 'Become a college counselor',
  description:
    'Advise families who are actively choosing a school. Set your own availability, keep your contact details private, and get paid for every consultation.',
};

export default function BecomeACounselorPage() {
  // Signed-out visitors see the marketing landing; signed-in users see the application.
  return <BecomeCounselorGate marketing={<CounselorLanding />} />;
}
