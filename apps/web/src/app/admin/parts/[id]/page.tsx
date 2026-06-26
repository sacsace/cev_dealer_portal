'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { partsApi, type Part } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { PartForm } from '@/components/admin/part-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminProductEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    partsApi
      .get(id)
      .then(setPart)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <AdminPageBody>
      <div className="portal-form-page">
        <div className="mb-6">
          <Link
            href="/admin/parts"
            className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
          >
            ← {t('common.back')}
          </Link>
          <PageTitle
            title={t('admin.editProduct')}
            subtitle={part ? `${part.partNumber} · ${part.partName}` : t('common.loading')}
          />
        </div>

        {loading ? (
          <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
        ) : error ? (
          <p className="rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{error}</p>
        ) : part ? (
          <AdminFormCard>
            <PartForm
              part={part}
              onSaved={() => router.push('/admin/parts')}
              onCancel={() => router.push('/admin/parts')}
            />
          </AdminFormCard>
        ) : null}
      </div>
    </AdminPageBody>
  );
}
