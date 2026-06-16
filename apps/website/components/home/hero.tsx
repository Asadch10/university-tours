'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Star, Footprints } from 'lucide-react';
import { SearchBar } from '@/components/search/search-bar';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-gold-500/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-maroon-400/20 blur-3xl" aria-hidden />
      {/* Floating crest */}
      <motion.img
        src="/logo.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-[6%] top-24 hidden h-44 w-44 opacity-[0.12] lg:block"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="container-page relative py-16 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200 ring-1 ring-inset ring-white/15 backdrop-blur">
              <ShieldCheck size={14} /> Verified students · 50+ universities
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-ivory sm:text-5xl lg:text-6xl"
          >
            See the <span className="text-gold-gradient">real campus</span>
            <br className="hidden sm:block" /> before you decide.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ivory/75 sm:text-lg"
          >
            Book a private campus tour or live video consultation with a current student.
            Honest insight, your questions answered, no admissions spin.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" className="mt-9">
            <SearchBar />
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-ivory/70"
          >
            <span className="inline-flex items-center gap-2">
              <Star size={15} className="fill-gold-400 text-gold-400" /> 4.9/5 from 1,800+ families
            </span>
            <span className="inline-flex items-center gap-2">
              <Footprints size={15} className="text-gold-300" /> 18,000+ tours given
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} className="text-gold-300" /> Charged only on acceptance
            </span>
          </motion.div>
        </div>
      </div>

      {/* Curved transition into the page */}
      <div className="relative">
        <svg viewBox="0 0 1440 60" className="block w-full" preserveAspectRatio="none" aria-hidden>
          <path d="M0 60 C 360 10, 1080 10, 1440 60 Z" fill="#fbf8f3" />
        </svg>
      </div>
    </section>
  );
}
