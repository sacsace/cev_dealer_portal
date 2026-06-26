'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { PartForm } from '@/components/admin/part-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminProductRegisterPage() {
  const { t } = useI18n();
  const router = useRouter();

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
          <PageTitle title={t('admin.productRegister')} subtitle={t('admin.productRegisterSubtitle')} />
        </div>

        <AdminFormCard>
          <PartForm onSaved={() => router.push('/admin/parts')} onCancel={() => router.push('/admin/parts')} />
        </AdminFormCard>
      </div>
    </AdminPageBody>
  );
}
