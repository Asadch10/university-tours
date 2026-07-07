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
]);

function detailValue(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (Array.isArray(v)) return v.length ? v.map(String).join(', ') : null;
  return null;
}

const labelFromKey = (key: string) =>
  (key.charAt(0).toUpperCase() + key.slice(1)).replace(/([A-Z])/g, ' $1').trim();

/** Every answer from the website's become-a-guide form, grouped into sections. */
export function ListingDetails({ details }: { details: Record<string, unknown> }) {
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

  if (!sections.length) return null;

  return (
    <div className="space-y-4">
      <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Full application</p>
      {sections.map((s) => (
        <div key={s.title} className="rounded-xl border border-ink-200 p-4">
          <p className="text-sm font-semibold text-ink-900">{s.title}</p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {s.fields.map((f) => (
              <div key={f.key} className={f.value.length > 80 ? 'sm:col-span-2' : undefined}>
                <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{f.label}</dt>
                <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
