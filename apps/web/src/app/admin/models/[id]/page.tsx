'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { vehicleModelsApi, type VehicleModel } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { VehicleModelForm } from '@/components/admin/vehicle-model-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminVehicleModelEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [model, setModel] = useState<VehicleModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    vehicleModelsApi
      .get(id)
      .then(setModel)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/models"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('admin.editModel')}
          subtitle={model ? `${model.modelCode} · ${model.modelName}` : t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{error}</p>
      ) : model ? (
        <AdminFormCard>
          <VehicleModelForm
            model={model}
            onSaved={() => router.push('/admin/models')}
            onCancel={() => router.push('/admin/models')}
          />
        </AdminFormCard>
      ) : null}
    </AdminPageBody>
  );
}
