'use client';

import { AuthLoading, useAuthRedirect } from '@/components/auth/auth-guard';
import { AdminShell } from '@/components/layout/admin-layout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const ready = useAuthRedirect('admin');

  if (!ready) return <AuthLoading />;

  return <AdminShell>{children}</AdminShell>;
}
