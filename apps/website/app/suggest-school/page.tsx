import type { Metadata } from 'next';
import { SimplePage } from '@/components/simple/simple-page';
import { universities } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Suggest a new school',
  description: "Tell us which campus you'd like to tour and we'll work on bringing guides on board.",
};

export default function SuggestSchoolPage() {
  return (
    <SimplePage
      eyebrow="Help us grow"
      title="Suggest a new school"
      intro="Don't see your dream campus yet? Tell us where you'd like to tour and we'll work on bringing student guides on board."
      image={universities[7]?.image ?? ''}
      imageAlt="A university campus"
      cta={{ href: '/contact', label: 'Send a suggestion' }}
      points={[
        { title: 'Name the campus', body: "Let us know the school you'd love a tour at and why it's on your list." },
        { title: "We'll reach out", body: 'We recruit and verify current students to host authentic tours at new schools.' },
        { title: 'Get notified', body: "We'll let you know as soon as guides become available there." },
      ]}
    />
  );
}
