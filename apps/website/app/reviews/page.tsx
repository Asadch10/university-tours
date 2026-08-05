import type { Metadata } from 'next';
import { SimplePage } from '@/components/simple/simple-page';
import { universities } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Leave a review',
  description: 'Share your experience to help future students choose the right guide.',
};

export default function ReviewsPage() {
  return (
    <SimplePage
      eyebrow="Share your experience"
      title="Leave a review"
      intro="Your honest feedback helps future students choose the right guide — and helps great guides get noticed."
      image={universities[5]?.image ?? ''}
      imageAlt="A university campus building"
      cta={{ href: '/my-tours', label: 'Go to My bookings' }}
      points={[
        { title: 'Rate your tour', body: 'Open a completed booking under My bookings and leave a star rating for your guide.' },
        { title: 'Tell your story', body: 'A sentence or two about what made your visit helpful goes a long way.' },
        { title: 'Keep it kind', body: 'Honest and specific is perfect — please keep your review respectful.' },
      ]}
    />
  );
}
