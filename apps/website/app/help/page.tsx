import type { Metadata } from 'next';
import { HelpCenter } from '@/components/help/help-center';

export const metadata: Metadata = {
  title: 'Help Center',
  description:
    'Find answers to common questions about University Campus Private Tours — booking, pricing, safety, becoming a guide, and more.',
};

export default function HelpPage() {
  return <HelpCenter />;
}
