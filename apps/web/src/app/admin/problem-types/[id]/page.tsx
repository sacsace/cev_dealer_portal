'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { problemTypesApi, type ProblemType } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { ProblemTypeForm } from '@/components/admin/problem-type-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminProblemTypeEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<ProblemType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    problemTypesApi
      .get(id)
      .then(setItem)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/problem-types"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('admin.editProblemType')}
          subtitle={item?.name ?? t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="portal-alert portal-alert--error">{error}</p>
      ) : item ? (
        <AdminFormCard>
          <ProblemTypeForm
            item={item}
            onSaved={() => router.push('/admin/problem-types')}
            onCancel={() => router.push('/admin/problem-types')}
          />
        </AdminFormCard>
      ) : null}
    </AdminPageBody>
  );
}
