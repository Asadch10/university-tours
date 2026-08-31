/**
 * The three ways to use the marketplace, offered at onboarding and changeable later
 * under Settings → College status.
 *
 * Defined once so the two screens can never drift apart. `key` is the value persisted
 * as `profileJson.intent`, and the backend maps it to the account role.
 */
export interface IntentOption {
  key: 'guide' | 'counselor' | 'guest';
  label: string;
  description: string;
  /** Where to send the user once the choice is saved. */
  href: string;
  /** Read-only wording shown under Settings → College status. */
  statusText: string;
}

export const INTENT_OPTIONS: IntentOption[] = [
  {
    key: 'guide',
    label: 'Become a guide',
    description: 'Host private tour or video chat at your school and get paid.',
    href: '/become-a-guide',
    statusText: 'Guide — you host private campus tours.',
  },
  {
    key: 'counselor',
    label: 'Become a college counselor',
    description: 'Advise families as an independent admissions professional.',
    href: '/become-a-counselor',
    statusText: 'College counselor — you advise families on admissions.',
  },
  {
    key: 'guest',
    label: 'Browse guides / counselors (Guest)',
    description: 'Find a student guide or a counselor and book a session.',
    href: '/search',
    statusText: 'Guest — you book tours and consultations.',
  },
];

/**
 * Resolve a saved intent to an option.
 *
 * Older accounts hold the previous intents (`book`, `other`), so those are mapped onto
 * the closest current option rather than left unmatched.
 */
export function intentOptionFor(intent: unknown, role?: string | null): IntentOption {
  const raw = typeof intent === 'string' ? intent : '';
  const normalised = raw === 'book' || raw === 'other' ? 'guest' : raw;
  const match = INTENT_OPTIONS.find((o) => o.key === normalised);
  if (match) return match;
  // No usable intent — fall back to what the account role implies.
  return INTENT_OPTIONS.find((o) => o.key === (role === 'SELLER' ? 'guide' : 'guest'))!;
}
