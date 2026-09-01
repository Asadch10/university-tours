/**
 * Account intent — "how do I want to use this app".
 *
 * Mirrors the website's `lib/onboarding-options.ts`. This app is intentionally
 * standalone (no @ucpt/* imports), so the list is redeclared here rather than
 * shared — but the `key` values MUST stay identical to the website's, because
 * they are persisted verbatim as `profileJson.intent` and the backend maps them
 * to the account role:
 *
 *   guide | counselor  → SELLER   (both sell on the marketplace)
 *   guest              → BUYER
 *
 * Mobile previously shipped the pre-counselor values (`book` / `guide` / `other`),
 * so an account onboarded on an older build still carries those. `intentOptionFor`
 * folds them onto the current options instead of leaving the UI unselected.
 */
import { api } from './client';
import type { Role } from './auth';

export type IntentKey = 'guide' | 'counselor' | 'guest';

export interface IntentOption {
  key: IntentKey;
  label: string;
  /** Sub-label shown under the option. */
  description: string;
  /** Read-only wording shown under Settings → College status. */
  statusText: string;
}

export const INTENT_OPTIONS: IntentOption[] = [
  {
    key: 'guide',
    label: 'Become a guide',
    description: 'Host private tour or video chat at your school and get paid.',
    statusText: 'Guide — you host private campus tours.',
  },
  {
    key: 'counselor',
    label: 'Become a college counselor',
    description: 'Advise families as an independent admissions professional.',
    statusText: 'College counselor — you advise families on admissions.',
  },
  {
    key: 'guest',
    label: 'Browse guides / counselors (Guest)',
    description: 'Find a student guide or a counselor and book a session.',
    statusText: 'Guest — you book tours and consultations.',
  },
];

/** Legacy intents from older mobile builds → their current equivalent. */
const LEGACY: Record<string, IntentKey> = { book: 'guest', other: 'guest' };

/** True for the two intents that make the account a seller. */
export const isSellerIntent = (key: string): boolean => key === 'guide' || key === 'counselor';

/**
 * Resolve a stored intent to an option, falling back to what the role implies
 * when the account predates intents entirely.
 */
export function intentOptionFor(intent: unknown, role?: Role | null): IntentOption {
  const raw = typeof intent === 'string' ? intent : '';
  const normalised = LEGACY[raw] ?? raw;
  const match = INTENT_OPTIONS.find((o) => o.key === normalised);
  if (match) return match;
  return INTENT_OPTIONS.find((o) => o.key === (role === 'SELLER' ? 'guide' : 'guest'))!;
}

export interface OnboardingResult {
  id: string;
  role: Role | null;
  profileJson: Record<string, unknown> | null;
}

export const intentApi = {
  /**
   * Persist the onboarding choice. `schools` is only meaningful for `guest`
   * (the schools-of-interest step) and is ignored otherwise by the backend.
   */
  save: (intent: IntentKey, schools?: string[]) =>
    api.request<OnboardingResult>('POST', '/users/me/onboarding', { intent, schools }),
};
