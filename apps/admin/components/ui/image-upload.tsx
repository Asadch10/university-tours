'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn, mediaUrl } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import { useToast } from '@/lib/toast';

/**
 * Single-image picker + uploader. Uploads to the backend on select, stores the returned
 * relative URL via `onChange`, and previews the current value. Used for university banner/logo.
 */
export function ImageUpload({
  value,
  onChange,
  label,
  aspect = 'video',
  className,
}: {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  /** 'video' = wide banner, 'square' = logo. */
  aspect?: 'video' | 'square';
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { url } = await adminApi.uploadImage(file);
      onChange(url);
    } catch (e) {
      toast.error('Upload failed', e instanceof Error ? e.message : undefined);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={className}>
      {label && <p className="mb-1.5 block text-sm font-semibold text-ink-900">{label}</p>}
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border border-ink-200 bg-ink-50',
          aspect === 'video' ? 'aspect-[16/7]' : 'aspect-square',
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(value)} alt="" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
          >
            <ImagePlus size={22} />
            <span className="text-xs font-medium">Upload image</span>
          </button>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <Loader2 size={22} className="animate-spin text-brand-600" />
          </div>
        )}

        {value && !uploading && (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-800 hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/90 text-danger hover:bg-white"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
