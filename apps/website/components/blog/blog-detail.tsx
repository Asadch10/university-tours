import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { blogPosts, type BlogPost } from '@/lib/data';

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function BlogDetail({ post }: { post: BlogPost }) {
  const related = blogPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);
  const fallback = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const suggestions = related.length ? related : fallback;

  return (
    <article className="bg-ivory">
      {/* Header */}
      <header className="container-page pt-[calc(var(--header-h)+3rem)]">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-maroon-900"
          >
            <ArrowLeft size={16} /> All posts
          </Link>

          <div className="mt-6 flex items-center gap-3 text-sm text-ink-500">
            <Badge variant="maroon">{post.category}</Badge>
            <span>{formatDate(post.date)}</span>
            <span className="h-1 w-1 rounded-full bg-ink-300" />
            <span>{post.readMinutes} min read</span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.12] text-ink-900 sm:text-[2.75rem]">
            {post.title}
          </h1>

          <div className="mt-6 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-11 w-11 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-bold text-ink-900">{post.author.name}</p>
              <p className="text-xs text-ink-500">{post.author.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero image */}
      <div className="container-page mt-10">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt={post.title} className="aspect-[16/9] w-full object-cover" />
        </div>
      </div>

      {/* Body */}
      <div className="container-page py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {post.content.map((block, i) => {
            if (block.type === 'heading') {
              return (
                <h2
                  key={i}
                  className="mt-10 font-display text-2xl font-semibold text-ink-900 first:mt-0"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === 'quote') {
              return (
                <blockquote
                  key={i}
                  className="my-8 border-l-4 border-gold-400 pl-5 font-display text-xl italic leading-relaxed text-ink-800"
                >
                  {block.text}
                </blockquote>
              );
            }
            return (
              <p key={i} className="mt-5 text-lg leading-relaxed text-ink-600 first:mt-0">
                {block.text}
              </p>
            );
          })}

          {/* CTA */}
          <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-3xl bg-maroon-gradient px-7 py-7 text-ivory sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-lg font-bold">Ready to see a campus for real?</p>
              <p className="mt-1 text-sm text-ivory/80">
                Book a private, student-led tour with a verified current student.
              </p>
            </div>
            <ButtonLink href="/search" variant="gold" size="lg" className="shrink-0">
              Browse guides <ArrowRight size={18} />
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Related */}
      {suggestions.length > 0 && (
        <section className="container-page pb-20 sm:pb-28">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-display text-2xl font-bold text-ink-900">Keep reading</h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-3">
              {suggestions.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                  <div className="overflow-hidden rounded-2xl shadow-soft transition-shadow group-hover:shadow-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug text-ink-900 transition-colors group-hover:text-maroon-900">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-500">{formatDate(p.date)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
