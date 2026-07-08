import '../env.js'; // load .env first (Stripe + DB creds)
import { prisma } from '@ucpt/db';
import { isStripeEnabled } from '../lib/stripe.js';
import { syncPaymentRecord } from '../services/booking.service.js';

// One-off: create Payment records for bookings that were authorized/captured before
// the Payment model existed (pulls the PaymentIntent from Stripe for each).
async function main() {
  if (!isStripeEnabled()) {
    console.error('Stripe is not configured — aborting.');
    process.exit(1);
  }
  const bookings = await prisma.booking.findMany({
    where: { stripePaymentIntentId: { not: null }, payment: null },
    select: { id: true, stripePaymentIntentId: true, status: true },
  });
  console.log(`Found ${bookings.length} booking(s) with a PaymentIntent but no Payment record.`);

  let ok = 0;
  for (const b of bookings) {
    try {
      await syncPaymentRecord(b.id, b.stripePaymentIntentId as string);
      const saved = await prisma.payment.findUnique({ where: { bookingId: b.id }, select: { status: true, cardBrand: true, cardLast4: true } });
      if (saved) {
        ok++;
        console.log(`  ✓ ${b.id} (${b.status}) → ${saved.status} ${saved.cardBrand ?? ''} ${saved.cardLast4 ?? ''}`.trimEnd());
      } else {
        console.log(`  · ${b.id} (${b.status}) → no payment saved (intent may be missing/expired)`);
      }
    } catch (err) {
      console.error(`  ✗ ${b.id}:`, err instanceof Error ? err.message : err);
    }
  }
  console.log(`Done. Backfilled ${ok}/${bookings.length}.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
