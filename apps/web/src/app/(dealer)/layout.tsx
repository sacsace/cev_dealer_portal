'use client';

import { Suspense } from 'react';
import { DealerShell } from '@/components/layout/dealer-layout';
import { AuthLoading, useAuthRedirect } from '@/components/auth/auth-guard';

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  const ready = useAuthRedirect('dealer');

  if (!ready) return <AuthLoading />;

  return (
    <Suspense fallback={<AuthLoading />}>
      <DealerShell>{children}</DealerShell>
    </Suspense>
  );
}
