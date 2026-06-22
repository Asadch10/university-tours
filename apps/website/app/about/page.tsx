import type { Metadata } from 'next';
import { AboutPage } from '@/components/about/about-page';

export const metadata: Metadata = {
  title: 'About us',
  description:
    'University Campus Private Tours connects families with verified current students for private campus tours and honest video consultations — real insight for confident university decisions.',
};

export default function About() {
  return <AboutPage />;
}
