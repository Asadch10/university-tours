import { Badge } from '@/components/ui/badge';

/** Tour-type chips shared by the listings table and the listing detail page. */
const TOUR_TYPE_BADGE: Record<string, { label: string; variant: 'brand' | 'info' }> = {
  'Campus tour': { label: 'In-person', variant: 'brand' },
  'Video chat': { label: 'Video', variant: 'info' },
};

export function TourTypeBadges({ tourTypes }: { tourTypes: string[] }) {
  if (!tourTypes.length) return <span className="text-ink-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tourTypes.map((t) => {
        const b = TOUR_TYPE_BADGE[t] ?? { label: t, variant: 'info' as const };
        return (
          <Badge key={t} variant={b.variant} size="md">
            {b.label}
          </Badge>
        );
      })}
    </div>
  );
}

// The full become-a-guide form, grouped the way the website presents it. Keys
// match what the website saves in `profileJson.guideListing`.
const DETAIL_SECTIONS: { title: string; fields: { key: string; label: string }[] }[] = [
  {
    title: 'About the guide',
    fields: [
      { key: 'gender', label: 'Gender' },
      { key: 'age', label: 'Age' },
      { key: 'academicYear', label: 'Academic year' },
      { key: 'admissionType', label: 'Admission type' },
      { key: 'hometown', label: 'Hometown' },
      { key: 'personality', label: 'Personality' },
    ],
  },
  {
    title: 'Academics',
    fields: [
      { key: 'academicFocus', label: 'Academic focus' },
      { key: 'majors', label: 'Majors' },
      { key: 'minors', label: 'Minors' },
      { key: 'favoriteClass', label: 'Favorite class' },
      { key: 'careerGoals', label: 'Career goals' },
    ],
  },
  {
    title: 'Campus life',
    fields: [
      { key: 'extracurriculars', label: 'Extracurriculars' },
      { key: 'clubs', label: 'Clubs' },
      { key: 'housing', label: 'Housing' },
      { key: 'freeNight', label: 'Free night' },
    ],
  },
  {
    title: 'Experience & tips',
    fields: [
      { key: 'experienceRating', label: 'Experience rating' },
      { key: 'describeExperience', label: 'Their experience' },
      { key: 'tip', label: 'Tip for future students' },
    ],
  },
  {
    title: 'Background',
    fields: [
      { key: 'highSchool', label: 'High school' },
      { key: 'previousCollege', label: 'Previous college' },
    ],
  },
  {
    title: 'Other',
    fields: [
      { key: 'groupTours', label: 'Open to group tours' },
      { key: 'referral', label: 'Referral' },
      { key: 'agreedContract', label: 'Agreed to contract' },
      { key: 'agreedGuidelines', label: 'Agreed to guidelines' },
    ],
  },
];

// Fields already rendered elsewhere on the page (or internal bookkeeping).
const DETAIL_KEYS_SHOWN = new Set([
  ...DETAIL_SECTIONS.flatMap((s) => s.fields.map((f) => f.key)),
  'listingTitle', 'intro', 'school', 'tourTypes', 'photos',
  'status', 'submittedAt', 'publishedAt', 'completedStep',
  // `answers` is the questionnaire snapshot (array of objects) — rendered separately
  // below, not as a raw "[object Object]" string. `availability` is shown elsewhere.
  'answers', 'availability', 'hostedBy',
]);

function detailValue(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length ? v.map(String).join(', ') : null;
  return null;
}

/** True for an uploaded image URL (e.g. the student ID photo) so we render it, not its text. */
const isImageUrl = (v: string) =>
  /^https?:\/\//i.test(v) && (/\.(jpe?g|png|webp|gif|avif|heic)(\?|$)/i.test(v) || /\/uploads\//i.test(v));

const labelFromKey = (key: string) =>
  (key.charAt(0).toUpperCase() + key.slice(1)).replace(/([A-Z])/g, ' $1').trim();

/** Every answer from the website's become-a-guide form, grouped into sections. */
export function ListingDetails({
  details,
  onImageOpen,
}: {
  details: Record<string, unknown>;
  onImageOpen?: (src: string) => void;
}) {
  // Anything the website starts saving that this page doesn't know yet still shows up.
  const extraFields = Object.keys(details)
    .filter((k) => !DETAIL_KEYS_SHOWN.has(k) && detailValue(details[k]) !== null)
    .map((key) => ({ key, label: labelFromKey(key) }));

  const sections = [
    ...DETAIL_SECTIONS,
    ...(extraFields.length ? [{ title: 'More', fields: extraFields }] : []),
  ]
    .map((s) => ({
      ...s,
      fields: s.fields
        .map((f) => ({ ...f, value: detailValue(details[f.key]) }))
        .filter((f): f is typeof f & { value: string } => f.value !== null),
    }))
    .filter((s) => s.fields.length > 0);

  // Custom questionnaire answers (admin-added questions without a stable key).
  // Keyed answers already surface via their top-level keys in the sections above.
  const customAnswers = (Array.isArray(details['answers']) ? (details['answers'] as unknown[]) : [])
    .map((a) => (a && typeof a === 'object' ? (a as { key?: unknown; label?: unknown; value?: unknown }) : null))
    .filter((a): a is { key?: unknown; label?: unknown; value?: unknown } => !!a && !a.key)
    .map((a) => ({
      label: typeof a.label === 'string' && a.label.trim() ? a.label : 'Question',
      value: Array.isArray(a.value) ? a.value.map(String).join(', ') : String(a.value ?? ''),
    }))
    .filter((a) => a.value.trim());

  if (!sections.length && !customAnswers.length) return null;

  return (
    <div className="space-y-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Full application</p>
      {sections.map((s) => (
        <div key={s.title} className="rounded-xl border border-ink-200 p-4">
          <p className="text-sm font-semibold text-ink-900">{s.title}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {s.fields.map((f) => {
              const image = isImageUrl(f.value);
              return (
                <div key={f.key} className={image || f.value.length > 80 ? 'sm:col-span-2' : undefined}>
                  <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{f.label}</dt>
                  {image ? (
                    onImageOpen ? (
                      <button
                        type="button"
                        onClick={() => onImageOpen(f.value)}
                        className="mt-1.5 block w-fit overflow-hidden rounded-lg border border-ink-200 bg-ink-100 transition hover:border-brand-300 hover:shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.value} alt={f.label} className="h-28 w-auto max-w-full object-contain" />
                      </button>
                    ) : (
                      <a
                        href={f.value}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 block w-fit overflow-hidden rounded-lg border border-ink-200 transition-opacity hover:opacity-90"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.value} alt={f.label} className="h-28 w-auto max-w-full object-contain" />
                      </a>
                    )
                  ) : (
                    <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{f.value}</dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      ))}

      {customAnswers.length > 0 && (
        <div className="rounded-xl border border-ink-200 p-4">
          <p className="text-sm font-semibold text-ink-900">More questions</p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {customAnswers.map((a, i) => (
              <div key={i} className={a.value.length > 80 ? 'sm:col-span-2' : undefined}>
                <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{a.label}</dt>
                <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{a.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
