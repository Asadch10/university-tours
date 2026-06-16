'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { Avatar } from '@/components/ui/avatar';
import type { Testimonial } from '@/lib/data';

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const current = items[((index % items.length) + items.length) % items.length]!;

  const go = (d: number) => setState(([i]) => [i + d, d]);

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-4xl border border-ink-200/70 bg-white p-8 shadow-card sm:p-12">
        <Quote className="absolute -top-1 left-8 text-maroon-100" size={72} aria-hidden />
        <div className="relative min-h-[13rem] sm:min-h-[11rem]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.figure
              key={current.id}
              custom={dir}
              initial={{ opacity: 0, x: dir >= 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir >= 0 ? -40 : 40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <StarRating value={current.rating} size={18} />
              <blockquote className="font-display text-xl leading-snug text-ink-800 sm:text-2xl">
                “{current.quote}”
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <Avatar name={current.name} size={44} />
                <div>
                  <p className="font-semibold text-ink-900">{current.name}</p>
                  <p className="text-sm text-ink-500">{current.role}</p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-maroon-900 transition-all hover:border-maroon-900/30 hover:shadow-soft cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2" role="tablist" aria-label="Testimonials">
          {items.map((t, i) => {
            const active = ((index % items.length) + items.length) % items.length === i;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => setState([i, i > index ? 1 : -1])}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  active ? 'w-7 bg-maroon-900' : 'w-2 bg-ink-300 hover:bg-ink-400'
                }`}
              />
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-200 bg-white text-maroon-900 transition-all hover:border-maroon-900/30 hover:shadow-soft cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
