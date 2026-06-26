'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession, getSession } from '@/lib/api';
import { getRoleHome } from '@/lib/auth';
import { AuthLoading } from '@/components/auth/auth-guard';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getSession();
    if (!user) {
      router.replace('/login');
      return;
    }

    const home = getRoleHome(user.role);
    if (home === '/login') {
      clearSession();
      router.replace('/login');
      return;
    }

    router.replace(home);
  }, [router]);

  return <AuthLoading />;
}
