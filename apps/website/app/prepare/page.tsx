import type { Metadata } from 'next';
import { SimplePage } from '@/components/simple/simple-page';
import { universities } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Prepare for your tour',
  description: 'A few simple tips to get the most out of your private, student-led campus tour.',
};

export default function PreparePage() {
  return (
    <SimplePage
      eyebrow="Guest guide"
      title="Prepare for your campus tour"
      intro="A little planning goes a long way. Here's how to get the most out of your private, student-led visit."
      image={universities[2]?.image ?? ''}
      imageAlt="Students walking across a university campus"
      cta={{ href: '/search', label: 'Find a guide' }}
      points={[
        { title: 'Make a list', body: 'Jot down the questions that matter most to you — academics, housing, safety, and social life.' },
        { title: 'Wear comfy shoes', body: 'Campuses are big. Dress for the weather and be ready for plenty of walking.' },
        { title: 'Arrive a little early', body: 'Give yourself time to find the meeting spot and settle in before your tour begins.' },
      ]}
    />
  );
}
