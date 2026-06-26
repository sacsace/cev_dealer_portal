'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { ProblemTypeForm } from '@/components/admin/problem-type-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminProblemTypeNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/problem-types"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('admin.problemTypeRegister')} subtitle={t('admin.problemTypeRegisterSubtitle')} />
      </div>

      <AdminFormCard>
        <ProblemTypeForm
          onSaved={() => router.push('/admin/problem-types')}
          onCancel={() => router.push('/admin/problem-types')}
        />
      </AdminFormCard>
    </AdminPageBody>
  );
}
