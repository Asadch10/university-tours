'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { blogPosts, blogCategories, type BlogCategory, type BlogPost } from '@/lib/data';

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type Filter = 'All' | BlogCategory;

/* ─── Page ───────────────────────────────────────────────────────────── */

export function BlogIndex() {
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');

  const featured = blogPosts.find((p) => p.featured) ?? blogPosts[0]!;
  const otherFeatured = blogPosts.filter((p) => p.slug !== featured.slug).slice(0, 5);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blogPosts.filter((p) => {
      const matchesCat = filter === 'All' || p.category === filter;
      const matchesQuery =
        !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [filter, query]);

  return (
    <div className="bg-ivory">
      {/* Featured + sidebar */}
      <section className="blog-wrap pt-[calc(var(--header-h)+3rem)] pb-16 sm:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14 xl:gap-20">
          <FeaturedCard post={featured} />

          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900">Other featured posts</h2>
            <div className="mt-6 divide-y divide-ink-100">
              {otherFeatured.map((post) => (
                <SidebarItem key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters + search */}
      <section className="blog-wrap">
        <div className="flex flex-col gap-4 border-b border-ink-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {(['All', ...blogCategories] as Filter[]).map((cat) => {
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={cn(
                    'relative px-3 py-2 text-sm font-semibold transition-colors',
                    active ? 'text-maroon-900' : 'text-ink-500 hover:text-ink-800',
                  )}
                >
                  {cat}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-maroon-900" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blogs"
              className="w-full rounded-full border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="blog-wrap py-12 sm:py-16">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-ink-500">
            No posts found. Try a different search or category.
          </p>
        ) : (
          <RevealGroup className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <Reveal as="div" key={post.slug}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </RevealGroup>
        )}
      </section>
    </div>
  );
}

/* ─── Cards ──────────────────────────────────────────────────────────── */

function FeaturedCard({ post }: { post: BlogPost }) {
  return (
    <Reveal>
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-3xl shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image}
            alt={post.title}
            className="aspect-[16/11] w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-[1.03]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(10,6,8,0.82) 0%, rgba(10,6,8,0.15) 55%, transparent 100%)',
            }}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
            <Badge variant="light">Featured</Badge>
            <h2 className="mt-4 max-w-xl font-display text-2xl font-bold leading-tight text-ivory sm:text-3xl">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-ivory/80">{formatDate(post.date)}</p>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function SidebarItem({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex items-start gap-4 py-5">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
        />
      </div>
      <div className="min-w-0">
        <h3 className="text-[0.95rem] font-bold leading-snug text-ink-900 transition-colors group-hover:text-maroon-900">
          {post.title}
        </h3>
        <p className="mt-1 text-xs text-ink-500">{formatDate(post.date)}</p>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <div className="overflow-hidden rounded-2xl shadow-soft transition-shadow group-hover:shadow-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
        />
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span>{formatDate(post.date)}</span>
          <span className="h-1 w-1 rounded-full bg-ink-300" />
          <Badge variant="neutral">{post.category}</Badge>
        </div>
        <h3 className="mt-2 font-display text-xl font-bold leading-snug text-ink-900 transition-colors group-hover:text-maroon-900">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{post.excerpt}</p>
      </div>
    </Link>
  );
}
