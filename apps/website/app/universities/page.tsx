import type { Metadata } from 'next';
import { UniversityCard } from '@/components/cards/university-card';
import { Reveal, RevealGroup } from '@/components/ui/reveal';
import { universities } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Universities',
  description:
    'Browse 50+ universities with verified student guides offering private campus tours and video consultations.',
};

export default function UniversitiesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-maroon-gradient pt-[var(--header-h)] text-ivory">
        <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="container-page relative py-14 sm:py-20">
          <span className="eyebrow text-gold-300">
            <span className="h-px w-6 bg-gold-300/60" /> Explore campuses
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold sm:text-5xl">
            Universities with verified student guides
          </h1>
          <p className="mt-4 max-w-xl text-ivory/75">
            Every campus below has current students ready to host a private tour or a live video
            consultation. Pick a university to meet its guides.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-page">
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((u) => (
              <Reveal as="div" key={u.slug}>
                <UniversityCard u={u} />
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  );
}
