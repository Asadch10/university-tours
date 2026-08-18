/**
 * Canonical public origin for this deployment — the base every absolute URL we
 * emit (canonicals, OG tags, robots, sitemap) is resolved against.
 *
 * Set `NEXT_PUBLIC_SITE_URL` at BUILD time (it's inlined into the bundle like
 * every other NEXT_PUBLIC_*). The default matches production so a build that
 * forgets it still emits correct URLs rather than a placeholder domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.university.tours')
  .replace(/\/+$/, '');

/** Absolute URL for a site-relative path — `absoluteUrl('/faq')`. */
export const absoluteUrl = (path: string) => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
