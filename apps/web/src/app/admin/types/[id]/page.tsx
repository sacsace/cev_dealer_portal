'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jobCardTypesApi, type JobCardType } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { JobCardTypeForm } from '@/components/admin/job-card-type-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminJobCardTypeEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<JobCardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    jobCardTypesApi
      .get(id)
      .then(setItem)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/types"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('admin.editJobCardType')}
          subtitle={item?.name ?? t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{error}</p>
      ) : item ? (
        <AdminFormCard>
          <JobCardTypeForm
            item={item}
            onSaved={() => router.push('/admin/types')}
            onCancel={() => router.push('/admin/types')}
          />
        </AdminFormCard>
      ) : null}
    </AdminPageBody>
  );
}
