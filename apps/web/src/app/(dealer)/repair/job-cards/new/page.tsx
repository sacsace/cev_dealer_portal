'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, PageTitle } from '@/components/ui';
import { JobCardForm } from '@/components/dealer/job-card-form';
import { useI18n } from '@/components/providers/i18n-provider';

export default function JobCardNewPage() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/repair/job-cards"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle title={t('jobCard.entryTitle')} subtitle={t('jobCard.entrySubtitle')} />
      </div>
      <Card>
        <JobCardForm
          onSaved={() => router.push('/repair/job-cards')}
          onCancel={() => router.push('/repair/job-cards')}
        />
      </Card>
    </div>
  );
}
