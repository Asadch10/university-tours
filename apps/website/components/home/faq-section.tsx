'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-10 sm:py-12">
      <div className="container-page">

        {/* Heading */}
        <h2 className="text-center font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          Frequently asked questions
        </h2>

        {/* List */}
        <div className="mx-auto mt-8 max-w-3xl">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="border-t border-ink-100 last:border-b"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className={cn(
                    'flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-6 text-left transition-colors duration-200',
                    isOpen ? 'bg-ink-50/70' : 'hover:bg-ink-50/70',
                  )}
                >
                  <span className="text-base font-bold text-ink-900 sm:text-[1.05rem]">
                    {item.q}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-ink-400 transition-transform duration-300 ease-premium',
                      isOpen && 'rotate-45 text-ink-700',
                    )}
                  >
                    <Plus size={22} strokeWidth={1.75} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-6 text-[0.95rem] leading-relaxed text-ink-600">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
