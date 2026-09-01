/**
 * Identity verification — the mobile client for the same endpoints the website uses
 * (apps/website/lib/client-api.ts → verificationApi).
 *
 * IMPORTANT, and the wording in the UI depends on it: this proves WHO someone is, not
 * that they are a student. Stripe confirms a government ID is genuine and matches a
 * selfie; enrolment is still established by the student-ID photo the applicant uploads
 * and by admin review. No document ever reaches our servers — only a status is stored.
 */
import { api } from './client';
import type { ApplicantKind } from './applications';

export type VerificationMethod = 'MANUAL' | 'STRIPE_IDENTITY' | 'ID_ME';
export type VerificationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'FAILED'
  | 'CANCELED';

export interface VerificationDto {
  id: string;
  kind: ApplicantKind;
  method: VerificationMethod;
  status: VerificationStatus;
  lastError: string | null;
  verifiedAt: string | null;
}

export interface StartVerificationResult {
  id: string;
  /** For Stripe.js on the web. Unused on mobile — there is no Expo Go native SDK. */
  clientSecret: string | null;
  /** Stripe's own hosted page. This is what mobile opens. */
  url: string | null;
  status: VerificationStatus;
}

const kindQuery = (kind?: ApplicantKind) => (kind ? `?kind=${kind}` : '');

/**
 * Identifies this client to the backend so Stripe's `return_url` lands somewhere useful
 * for a phone. Without it Stripe returns to the website's /manage-listing, which the
 * in-app browser has no session for — it would bounce to /login and read as a failure
 * even though the check succeeded.
 */
const clientQuery = (kind?: ApplicantKind) => `${kind ? `?kind=${kind}&` : '?'}client=mobile`;

export const verificationApi = {
  /** The signed-in applicant's record, or null when they've never started. */
  mine: (kind?: ApplicantKind) =>
    api.request<VerificationDto | null>('GET', `/verification/me${kindQuery(kind)}`),

  /**
   * Start or RESUME a Stripe Identity session. The backend deliberately reuses an
   * unfinished session rather than creating a new one per tap — each created session is
   * billable.
   */
  startStripe: (kind?: ApplicantKind) =>
    api.request<StartVerificationResult>('POST', `/verification/stripe/start${clientQuery(kind)}`),

  /** Re-read Stripe's own status. Safety net for a webhook that never arrived. */
  refresh: (kind?: ApplicantKind) =>
    api.request<VerificationDto | null>('POST', `/verification/refresh${kindQuery(kind)}`),
};
