'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { PageTitle } from '@/components/ui';
import { AdminJobCardDetail } from '@/components/admin/admin-job-card-detail';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminJobCardDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/job-cards"
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
          onCancel={() => router.push('/admin/job-cards')}
        />
      ) : null}
    </AdminPageBody>
  );
}
