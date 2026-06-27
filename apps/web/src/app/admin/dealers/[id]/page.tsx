'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { dealersApi, type Dealer } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { DealerForm } from '@/components/admin/dealer-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminDealerEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dealersApi
      .get(id)
      .then(setDealer)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/dealers"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('admin.editDealer')}
          subtitle={dealer ? `${dealer.dealerCode} · ${dealer.dealerName}` : t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="portal-alert portal-alert--error">{error}</p>
      ) : dealer ? (
        <AdminFormCard>
          <DealerForm
            dealer={dealer}
            onSaved={() => router.push('/admin/dealers')}
            onCancel={() => router.push('/admin/dealers')}
          />
        </AdminFormCard>
      ) : null}
    </AdminPageBody>
  );
}
