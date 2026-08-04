import type { Metadata } from 'next';
import { SimplePage } from '@/components/simple/simple-page';
import { PHOTOS } from '@/lib/images';

export const metadata: Metadata = {
  title: 'For college counselors',
  description: 'Give your students an authentic look at campus life through private, student-led tours.',
};

export default function CounselorsPage() {
  return (
    <SimplePage
      eyebrow="For counselors"
      title="For college counselors"
      intro="Give your students an authentic look at campus life through private, student-led tours — and help them decide with confidence."
      image={PHOTOS.consultation.src}
      imageAlt={PHOTOS.consultation.alt}
      cta={{ href: '/contact', label: 'Partner with us' }}
      points={[
        { title: 'Personalized visits', body: 'Match students with current guides at the schools on their list.' },
        { title: 'Real student insight', body: 'Honest answers about academics, housing, and day-to-day campus life.' },
        { title: 'Group-friendly', body: 'Planning for a cohort? We can help coordinate multiple visits.' },
      ]}
    />
  );
}
