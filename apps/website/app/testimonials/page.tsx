import type { Metadata } from 'next';
import { TestimonialsPage } from '@/components/testimonials/testimonials-page';

export const metadata: Metadata = {
  title: 'Testimonials',
  description:
    'Read real reviews from families and students who got the inside scoop on a personalized campus tour with a verified University Campus Private Tours guide.',
};

export default function Testimonials() {
  return <TestimonialsPage />;
}
