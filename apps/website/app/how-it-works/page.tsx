import type { Metadata } from 'next';
import { HowItWorksPage } from '@/components/how-it-works/how-it-works-page';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Book a private campus tour or video consultation with a verified current student in 3 easy steps — and get the honest insight you need to choose the right university.',
};

export default function HowItWorks() {
  return <HowItWorksPage />;
}
