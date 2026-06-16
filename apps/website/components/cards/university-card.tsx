import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Users, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { formatPrice } from '@/lib/utils';
import type { University } from '@/lib/data';

export function UniversityCard({ u }: { u: University }) {
  return (
    <Link
      href={`/universities/${u.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1"
    >
      {/* Campus banner */}
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${u.accent} 0%, #3d0a12 120%)` }}
      >
        <Image
          src={u.image}
          alt={`${u.name} campus`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
        />
        {/* Maroon wash keeps the badge + crest on-brand and text legible */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(180deg, ${u.accent}33 0%, ${u.accent}cc 100%)` }}
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          className="absolute -right-4 -top-3 h-28 w-28 opacity-20 transition-transform duration-500 ease-premium group-hover:scale-110"
        />
        <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between">
          <Badge variant="light">{u.state}</Badge>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-ivory ring-1 ring-inset ring-white/30 backdrop-blur transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-ink-900">{u.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin size={14} /> {u.location}
        </p>
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-600">{u.blurb}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {u.tags.slice(0, 3).map((t) => (
            <Badge key={t} variant="neutral" size="sm">
              {t}
            </Badge>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
          <div className="flex flex-col gap-1">
            <StarRating value={u.rating} count={u.reviews} size={14} />
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <Users size={13} /> {u.ambassadors} student guides
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xs uppercase tracking-wider text-ink-400">From</p>
            <p className="font-display text-lg font-semibold text-maroon-900">
              {formatPrice(u.toursFrom)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
