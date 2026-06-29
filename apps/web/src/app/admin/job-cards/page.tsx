'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { loadJobCardCount } from '@/lib/job-card-events';
import { Button, DataTable, PageTitle, JobCardStatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminActionAlert, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminJobCardsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [items, setItems] = useState<JobCard[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async (q = search) => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.search = q;
      const res = await jobCardsApi.list(params);
      setItems(res.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: JobCard) {
    const ok = await confirm({ message: t('jobCard.deleteConfirm') });
    if (!ok) return;

    try {
      await jobCardsApi.remove(item.id);
      await loadJobCardCount().catch(() => {});
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('jobCard.deleteFailed'));
    }
  }

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.jobCardMgmt')} subtitle={t('admin.jobCardSubtitle')} />
      <AdminSearchBar
        placeholder={t('jobCard.searchPlaceholder')}
        onSearch={(q) => {
          setSearch(q);
          load(q);
        }}
      />

      {actionError ? <AdminActionAlert message={actionError} /> : null}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('admin.jobCardNo'),
            t('checkout.dealerName'),
            t('admin.customer'),
            'VIN',
            t('parts.model'),
            t('orders.date'),
            t('orders.status'),
          ]}
          onRowClick={(index) => {
            const item = items[index];
            if (item) router.push(`/admin/job-cards/${item.id}`);
          }}
          rows={items.map((j, i) => [
            i + 1,
            j.jobCardNo,
            j.dealer?.dealerName ?? '—',
            j.customerName,
            j.vin,
            j.carModelName ?? '—',
            formatDate(j.jobCardDate),
            <JobCardStatusBadge key={`${j.id}-status`} status={j.status} />,
          ])}
          actions={(index) => {
            const item = items[index];
            if (!item) return null;

            return (
              <AdminTableDeleteButton
                stopPropagation
                onClick={() => {
                  void handleDelete(item);
                }}
              />
            );
          }}
        />
      )}

      {confirmDialog}
    </AdminPageBody>
  );
}
