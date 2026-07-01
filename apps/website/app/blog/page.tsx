import type { Metadata } from 'next';
import { BlogIndex } from '@/components/blog/blog-index';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Honest advice on admissions, college tours, and campus life — written by verified current students who’ve lived it.',
};

export default function Blog() {
  return <BlogIndex />;
}
