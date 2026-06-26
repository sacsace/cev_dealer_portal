'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearSession, getSession } from '@/lib/api';
import { canAccessAdmin, canAccessDealer, getRoleHome } from '@/lib/auth';

type AuthZone = 'dealer' | 'admin' | 'login' | 'public';

export function useAuthRedirect(zone: AuthZone) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = getSession();

    if (zone === 'login') {
      if (user) {
        const home = getRoleHome(user.role);
        if (home === '/login') {
          clearSession();
          setReady(true);
          return;
        }
        if (pathname !== home) {
          router.replace(home);
          return;
        }
      }
      setReady(true);
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (zone === 'dealer' && !canAccessDealer(user.role)) {
      router.replace(getRoleHome(user.role));
      return;
    }

    if (zone === 'admin' && !canAccessAdmin(user.role)) {
      router.replace(getRoleHome(user.role));
      return;
    }

    setReady(true);
  }, [pathname, router, zone]);

  return ready;
}

export function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
    </div>
  );
}
