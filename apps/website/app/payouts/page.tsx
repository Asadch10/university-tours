import type { Metadata } from 'next';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'Payouts' };

export default function PayoutsPage() {
  return (
    <ComingSoon
      title="Payouts"
      description="Track your earnings, connect a payout method, and review your payment history as a guide."
    />
  );
}
