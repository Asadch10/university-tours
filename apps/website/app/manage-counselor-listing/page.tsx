import { redirect } from 'next/navigation';

/**
 * Legacy route. /manage-listing now manages BOTH profiles — it shows a
 * Guide / Counselor switcher when the user holds both, and renders whichever single
 * profile they have otherwise.
 *
 * Kept as a redirect rather than deleted: approval emails already sent out point here.
 */
export default function ManageCounselorListingPage() {
  redirect('/manage-listing');
}
