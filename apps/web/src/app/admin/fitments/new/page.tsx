'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { FitmentForm } from '@/components/admin/fitment-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminFitmentNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/fitments"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('admin.fitmentRegister')} subtitle={t('admin.fitmentRegisterSubtitle')} />
      </div>

      <AdminFormCard>
        <FitmentForm
          onSaved={() => router.push('/admin/fitments')}
          onCancel={() => router.push('/admin/fitments')}
        />
      </AdminFormCard>
    </AdminPageBody>
  );
}
