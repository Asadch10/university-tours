import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

/**
 * Signed-in surfaces are disallowed rather than merely unlinked: they render a
 * loading shell for a crawler, which is worthless in an index and dilutes the
 * marketing pages we actually want ranking.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin',
          '/login',
          '/register',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/onboarding',
          '/settings',
          '/profile',
          '/my-tours',
          '/payouts',
          '/manage-listing',
          '/manage-counselor-listing',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
