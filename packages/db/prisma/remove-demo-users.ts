/**
 * Removes the demo users the seed used to create (and everything that hangs off
 * them). Real sign-ups are never touched — accounts are matched against an exact
 * allow-list of the seeded addresses, not a pattern, so a genuine customer who
 * happens to use an .edu address can't be caught by it.
 *
 *   pnpm --filter @ucpt/db exec tsx prisma/remove-demo-users.ts            # dry run
 *   pnpm --filter @ucpt/db exec tsx prisma/remove-demo-users.ts --apply    # delete
 *
 * Deletion order matters: Listing.seller and Booking.buyer/seller are
 * onDelete: Restrict, so the dependants go first or the delete is rejected.
 *
 * Safety: if a demo account has real bookings, payouts or reviews attached, it is
 * SKIPPED rather than force-deleted — that would mean someone transacted against
 * it and the row is now real history, not test data.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: [] });
const APPLY = process.argv.includes('--apply');

/** Exactly the accounts the old seed created. Nothing else is ever considered. */
const DEMO_EMAILS = [
  'karen.d@example.com',
  'marcus.t@example.com',
  'alvarez@example.com',
  'wei.lin@example.com',
  'rachel.g@example.com',
  'maya.r@stanford.edu',
  'daniel.o@harvard.edu',
  'sofia.m@ucla.edu',
  'aiden.c@nyu.edu',
  'priya.nair@umich.edu',
  'jordan.b@utexas.edu',
];

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true, name: true, role: true },
  });

  if (users.length === 0) {
    console.log('No demo users present — nothing to do.');
    return;
  }

  console.log(`${APPLY ? 'DELETING' : 'DRY RUN — would delete'} ${users.length} demo account(s):\n`);

  const removable: string[] = [];
  for (const u of users) {
    const [bookingsBuyer, bookingsSeller, payouts, reviews] = await Promise.all([
      prisma.booking.count({ where: { buyerId: u.id } }),
      prisma.booking.count({ where: { sellerId: u.id } }),
      prisma.payout.count({ where: { sellerId: u.id } }),
      prisma.review.count({ where: { OR: [{ buyerId: u.id }, { sellerId: u.id }] } }),
    ]);
    const listings = await prisma.listing.count({ where: { sellerId: u.id } });
    const realActivity = bookingsBuyer + bookingsSeller + payouts + reviews;

    if (realActivity > 0) {
      console.log(`  SKIP  ${u.email.padEnd(26)} has real activity ` +
        `(bookings:${bookingsBuyer + bookingsSeller} payouts:${payouts} reviews:${reviews}) — left in place`);
      continue;
    }
    console.log(`  DROP  ${u.email.padEnd(26)} ${String(u.role).padEnd(7)} listings:${listings}`);
    removable.push(u.id);
  }

  if (!APPLY) {
    console.log(`\nDry run only. Re-run with --apply to delete ${removable.length} account(s).`);
    return;
  }
  if (removable.length === 0) {
    console.log('\nNothing safe to delete.');
    return;
  }

  // Only Listing needs clearing by hand — it's onDelete: Restrict. sellerProfile,
  // counselorProfile, Document, Application and Device are all Cascade, so they
  // go with the user automatically.
  const result = await prisma.$transaction(async (tx) => {
    const listings = await tx.listing.findMany({ where: { sellerId: { in: removable } }, select: { id: true } });
    const listingIds = listings.map((l) => l.id);
    if (listingIds.length) {
      await tx.listingOption.deleteMany({ where: { listingId: { in: listingIds } } });
      await tx.listing.deleteMany({ where: { id: { in: listingIds } } });
    }
    const users = await tx.user.deleteMany({ where: { id: { in: removable } } });
    return { listings: listingIds.length, users: users.count };
  });

  console.log(`\nDeleted ${result.users} user(s) and ${result.listings} listing(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
