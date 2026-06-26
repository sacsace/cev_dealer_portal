'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { Button, Card, DataTable, PageTitle, PortalSearchBar, StatusBadge, useConfirmDialog } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function JobCardListPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [items, setItems] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
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

    setActionError('');
    try {
      await jobCardsApi.remove(item.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('jobCard.deleteFailed'));
    }
  }

  return (
    <div>
      <div className="portal-page-header">
        <PageTitle title={t('jobCard.title')} subtitle={t('jobCard.listSubtitle')} />
        <Link href="/repair/job-cards/new" className="block w-full sm:w-auto">
          <Button className="w-full sm:w-auto">{t('common.addNew')}</Button>
        </Link>
      </div>

      <Card className="mb-5">
        <PortalSearchBar placeholder={t('jobCard.searchPlaceholder')} preserveParams={[]} />
      </Card>

      {actionError && (
        <p className="mb-4 rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{actionError}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : items.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('jobCard.date'),
            t('jobCard.jobCardNo'),
            t('jobCard.carModel'),
            t('jobCard.customer'),
            t('orders.status'),
          ]}
          onRowClick={(index) => {
            const item = items[index];
            if (item) router.push(`/repair/job-cards/${item.id}`);
          }}
          rows={items.map((item, i) => [
            i + 1,
            formatDate(item.jobCardDate),
            item.jobCardNo,
            item.carModelName ?? '—',
            item.customerName,
            <StatusBadge key={`${item.id}-status`} status={item.status} />,
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
    </div>
  );
}
