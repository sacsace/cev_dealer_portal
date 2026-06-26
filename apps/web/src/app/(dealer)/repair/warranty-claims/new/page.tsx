'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, PageTitle } from '@/components/ui';
import { WarrantyClaimForm } from '@/components/dealer/warranty-claim-form';
import { useI18n } from '@/components/providers/i18n-provider';

export default function WarrantyClaimNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/repair/warranty-claims"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('warranty.entryTitle')} subtitle={t('warranty.entrySubtitle')} />
      </div>
      <Card>
        <WarrantyClaimForm
          onSaved={() => router.push('/repair/warranty-claims')}
          onCancel={() => router.push('/repair/warranty-claims')}
        />
      </Card>
    </div>
  );
}
