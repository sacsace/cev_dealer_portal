'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { AdminJobCardDetail } from '@/components/admin/admin-job-card-detail';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import {
  buildJobCardListHref,
  jobCardListTabForStatus,
  parseJobCardListTab,
} from '@/lib/job-card-status';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminJobCardDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params.id as string;
  const fromTab = parseJobCardListTab(searchParams.get('fromTab') ?? searchParams.get('tab'));
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    jobCardsApi
      .get(id)
      .then(async (card) => {
        if (card.status === 'CREATED') {
          return jobCardsApi.markReceived(id);
        }
        return card;
      })
      .then(setJobCard)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  function goBack(options?: { status?: string }) {
    const tab = options?.status ? jobCardListTabForStatus(options.status) : fromTab;
    router.push(buildJobCardListHref('/admin/job-cards', tab));
  }

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href={buildJobCardListHref('/admin/job-cards', fromTab)}
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('admin.viewJobCard')}
          subtitle={jobCard ? `${jobCard.jobCardNo} · ${jobCard.dealer?.dealerName ?? ''}` : t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="portal-alert portal-alert--error">{error}</p>
      ) : jobCard ? (
        <AdminJobCardDetail
          jobCard={jobCard}
          onUpdated={setJobCard}
          onCancel={goBack}
        />
      ) : null}
    </AdminPageBody>
  );
}
