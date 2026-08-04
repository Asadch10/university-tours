import { ButtonLink } from '@/components/ui/button';

/** Lightweight on-brand placeholder for account pages that aren't built out yet. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <main className="relative min-h-dvh bg-canvas pb-24 pt-[calc(var(--header-h)+4rem)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-radial-fade" aria-hidden />
      <div className="relative mx-auto max-w-lg px-5 text-center">
        <p className="eyebrow mb-3 justify-center">Coming soon</p>
        <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-600">{description}</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/profile" variant="primary" size="lg">
            Back to profile
          </ButtonLink>
          <ButtonLink href="/" variant="outline" size="lg">
            Home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
