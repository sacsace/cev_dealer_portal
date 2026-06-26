'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { VehicleModelForm } from '@/components/admin/vehicle-model-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminVehicleModelNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/models"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('admin.modelRegister')} subtitle={t('admin.modelRegisterSubtitle')} />
      </div>

      <AdminFormCard>
        <VehicleModelForm onSaved={() => router.push('/admin/models')} onCancel={() => router.push('/admin/models')} />
      </AdminFormCard>
    </AdminPageBody>
  );
}
