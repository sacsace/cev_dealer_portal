'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { DealerForm } from '@/components/admin/dealer-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminDealerNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/dealers"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('admin.dealerRegister')} subtitle={t('admin.dealerSubtitle')} />
      </div>

      <AdminFormCard>
        <DealerForm onSaved={() => router.push('/admin/dealers')} onCancel={() => router.push('/admin/dealers')} />
      </AdminFormCard>
    </AdminPageBody>
  );
}
