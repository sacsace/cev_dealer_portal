'use client';

import { Suspense } from 'react';
import AdminOrdersContent from './orders-content';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminOrdersPage() {
  const { t } = useI18n();

  return (
    <Suspense fallback={<p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
