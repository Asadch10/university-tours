import Link from 'next/link';
import { GraduationCap, Clock, Video, Footprints, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { formatPrice } from '@/lib/utils';
import type { Ambassador } from '@/lib/data';

export function AmbassadorCard({ a }: { a: Ambassador }) {
  return (
    <Link
      href={`/ambassadors/${a.id}`}
      className="group flex flex-col rounded-3xl border border-ink-200/70 bg-white p-5 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-lift focus-visible:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        <Avatar name={a.name} src={a.avatar} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-base font-semibold text-ink-900">{a.name}</h3>
            {a.verified && <BadgeCheck size={16} className="shrink-0 text-verified" aria-label="Verified student" />}
          </div>
          <p className="truncate text-sm text-ink-500">{a.university}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-ink-500">
            <GraduationCap size={13} /> {a.major} · ’{String(a.gradYear).slice(2)}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-600">{a.bio}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {a.services.includes('CAMPUS_TOUR') && (
          <Badge variant="maroon" size="sm">
            <Footprints size={12} /> In-person
          </Badge>
        )}
        {a.services.includes('VIDEO_CONSULTATION') && (
          <Badge variant="gold" size="sm">
            <Video size={12} /> Video
          </Badge>
        )}
        <Badge variant="neutral" size="sm">
          <Clock size={12} /> {a.responseTime}
        </Badge>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
        <StarRating value={a.rating} count={a.reviews} size={14} />
        <div className="text-right">
          <p className="text-2xs uppercase tracking-wider text-ink-400">From</p>
          <p className="font-display text-lg font-semibold text-maroon-900">{formatPrice(a.priceFrom)}</p>
        </div>
      </div>
    </Link>
  );
}
