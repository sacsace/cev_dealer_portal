'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { JobCardTypeForm } from '@/components/admin/job-card-type-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminJobCardTypeNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/types"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('admin.jobCardTypeRegister')} subtitle={t('admin.jobCardTypeRegisterSubtitle')} />
      </div>

      <AdminFormCard>
        <JobCardTypeForm
          onSaved={() => router.push('/admin/types')}
          onCancel={() => router.push('/admin/types')}
        />
      </AdminFormCard>
    </AdminPageBody>
  );
}
