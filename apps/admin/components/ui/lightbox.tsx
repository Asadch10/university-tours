'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';

/**
 * Shared image lightbox. `open(src)` shows the image large over a dark backdrop
 * (portaled to <body> so it covers the whole viewport, incl. the topbar); render
 * the returned `node` once in the page. Pairs with <ImageThumb />.
 */
export function useLightbox(): { open: (src: string) => void; node: ReactNode } {
  const [src, setSrc] = useState<string | null>(null);
  const open = useCallback((s: string) => setSrc(s), []);
  const close = useCallback(() => setSrc(null), []);

  const node =
    src && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas/90 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
            onClick={close}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close preview"
              className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-900 shadow-lg ring-1 ring-black/5 transition hover:bg-ink-100"
            >
              <X size={22} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] w-auto max-w-[min(88vw,720px)] rounded-xl object-contain shadow-2xl"
            />
          </div>,
          document.body,
        )
      : null;

  return { open, node };
}

/** Compact clickable image thumbnail that opens the full image in the lightbox. */
export function ImageThumb({
  src,
  alt,
  onOpen,
  className,
}: {
  src: string;
  alt: string;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-lg border border-ink-200 bg-ink-100 transition hover:border-brand-300 hover:shadow-md ${className ?? ''}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <span className="absolute inset-0 flex items-center justify-center bg-canvas/0 opacity-0 transition group-hover:bg-canvas/40 group-hover:opacity-100">
        <ZoomIn size={18} className="text-white" />
      </span>
    </button>
  );
}
