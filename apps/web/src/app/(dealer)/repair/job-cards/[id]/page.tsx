'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { Card, PageTitle } from '@/components/ui';
import { JobCardForm } from '@/components/dealer/job-card-form';
import { buildJobCardListHref, parseJobCardListTab } from '@/lib/job-card-status';
import { useI18n } from '@/components/providers/i18n-provider';

export default function JobCardEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params.id as string;
  const fromTab = parseJobCardListTab(searchParams.get('fromTab') ?? searchParams.get('tab'));
  const listHref = buildJobCardListHref('/repair/job-cards', fromTab);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    jobCardsApi
      .get(id)
      .then(setJobCard)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={listHref}
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('jobCard.editTitle')}
          subtitle={jobCard ? `${jobCard.jobCardNo} · ${jobCard.customerName}` : t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="portal-alert portal-alert--error">{error}</p>
      ) : jobCard ? (
        <Card>
          <JobCardForm
            jobCard={jobCard}
            onSaved={() => router.push(listHref)}
            onCancel={() => router.push(listHref)}
          />
        </Card>
      ) : null}
    </div>
  );
}
