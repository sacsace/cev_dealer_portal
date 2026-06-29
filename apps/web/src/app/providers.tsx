'use client';

import { I18nProvider } from '@/components/providers/i18n-provider';
import { PageVisitTracker } from '@/components/analytics/page-visit-tracker';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <PageVisitTracker />
      {children}
    </I18nProvider>
  );
}
