'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
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

      {actionError && (
        <p className="mb-4 rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{actionError}</p>
      )}

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
            <StatusBadge key={`${j.id}-status`} status={j.status} />,
          ])}
          actions={(index) => {
            const item = items[index];
            if (!item) return null;

            return (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#ff3b30] hover:bg-[#fff0ef]"
                aria-label={t('common.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(item);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            );
          }}
        />
      )}

      {confirmDialog}
    </AdminPageBody>
  );
}
