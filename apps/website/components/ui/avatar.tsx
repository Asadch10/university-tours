import { cn } from '@/lib/utils';

/** Initials avatar with a deterministic warm tint. Swap for next/image when real photos exist. */
export function Avatar({
  name,
  src,
  size = 48,
  className,
  ring,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-maroon-gradient font-display font-semibold text-ivory',
        ring && 'ring-2 ring-ivory ring-offset-2 ring-offset-transparent',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
