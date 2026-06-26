'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { CategoryForm } from '@/components/admin/category-form';
import { AdminFormCard, AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminCatalogNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <AdminPageBody>
      <div className="portal-form-page">
        <div className="mb-6">
          <Link
            href="/admin/catalog"
            className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
          >
            ← {t('common.back')}
          </Link>
          <PageTitle title={t('admin.catalogRegister')} subtitle={t('admin.catalogRegisterSubtitle')} />
        </div>

        <AdminFormCard>
          <CategoryForm
            onSaved={() => router.push('/admin/catalog')}
            onCancel={() => router.push('/admin/catalog')}
          />
        </AdminFormCard>
      </div>
    </AdminPageBody>
  );
}
