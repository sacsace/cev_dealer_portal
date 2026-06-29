'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi } from '@/lib/api';

export function PageVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    analyticsApi.recordVisit(pathname, document.referrer || undefined).catch(() => {});
  }, [pathname]);

  return null;
}
