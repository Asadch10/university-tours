import { Suspense } from 'react';
import type { Metadata } from 'next';
import { ResetPasswordView } from '@/components/auth/reset-password-view';

export const metadata: Metadata = { title: 'Create a new password' };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordView />
    </Suspense>
  );
}
