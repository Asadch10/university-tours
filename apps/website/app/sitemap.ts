import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/* Schools come and go from the admin console, so re-generate hourly rather than
   baking the list in at build time. */
export const revalidate = 3600;

/** Enabled schools only — the same public catalog the explore map reads. */
async function schoolSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/schools`, { next: { revalidate } });
    if (!res.ok) return [];
    const schools = (await res.json()) as Array<{ slug: string }>;
    return schools.map((s) => s.slug).filter(Boolean);
  } catch {
    // A sitemap missing its school pages beats a 500 on /sitemap.xml.
    return [];
  }
}

/* Marketing + reference pages, in rough order of how much we want them ranked.
   Signed-in routes are deliberately absent (and disallowed in robots.ts). */
const STATIC_ROUTES: Array<[path: string, priority: number, freq: MetadataRoute.Sitemap[number]['changeFrequency']]> = [
  ['/', 1.0, 'daily'],
  ['/universities', 0.9, 'daily'],
  ['/search', 0.9, 'daily'],
  ['/browse-counselors', 0.8, 'daily'],
  ['/how-it-works', 0.8, 'monthly'],
  ['/become-a-guide', 0.8, 'monthly'],
  ['/become-a-counselor', 0.8, 'monthly'],
  ['/blog', 0.7, 'weekly'],
  ['/about', 0.6, 'monthly'],
  ['/faq', 0.6, 'monthly'],
  ['/for-parents', 0.6, 'monthly'],
  ['/group-tours', 0.6, 'monthly'],
  ['/virtual-tours', 0.6, 'monthly'],
  ['/counselors', 0.6, 'monthly'],
  ['/prepare', 0.5, 'monthly'],
  ['/partnerships', 0.5, 'monthly'],
  ['/testimonials', 0.5, 'monthly'],
  ['/reviews', 0.5, 'weekly'],
  ['/resources', 0.5, 'monthly'],
  ['/trust-safety', 0.5, 'yearly'],
  ['/refer', 0.4, 'yearly'],
  ['/suggest-school', 0.4, 'yearly'],
  ['/help', 0.4, 'monthly'],
  ['/contact', 0.4, 'yearly'],
  ['/terms', 0.2, 'yearly'],
  ['/privacy', 0.2, 'yearly'],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const slugs = await schoolSlugs();

  return [
    ...STATIC_ROUTES.map(([path, priority, changeFrequency]) => ({
      url: `${SITE_URL}${path}`,
      lastModified,
      changeFrequency,
      priority,
    })),
    ...slugs.map((slug) => ({
      url: `${SITE_URL}/universities/${slug}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...blogPosts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
