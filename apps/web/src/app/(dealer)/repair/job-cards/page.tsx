'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { jobCardsApi, type JobCard } from '@/lib/api';
import { loadJobCardCount } from '@/lib/job-card-events';
import {
  buildJobCardListHref,
  parseJobCardListTab,
} from '@/lib/job-card-status';
import {
  Button,
  Card,
  DataTable,
  PageTitle,
  PortalSearchBar,
  PortalStatusTabs,
  JobCardStatusBadge,
  useConfirmDialog,
} from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function JobCardListPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const tab = parseJobCardListTab(searchParams.get('tab'));
  const [items, setItems] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const tabs = useMemo(
    () => [
      {
        key: 'active',
        label: t('jobCard.tabActive'),
        href: buildJobCardListHref('/repair/job-cards', 'active', search || undefined),
      },
      {
        key: 'completed',
        label: t('jobCard.tabCompleted'),
        href: buildJobCardListHref('/repair/job-cards', 'completed', search || undefined),
      },
    ],
    [search, t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '100', progress: tab };
      if (search) params.search = search;
      const res = await jobCardsApi.list(params);
      setItems(res.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [search, t, tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: JobCard) {
    const ok = await confirm({ message: t('jobCard.deleteConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await jobCardsApi.remove(item.id);
      await loadJobCardCount().catch(() => {});
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('jobCard.deleteFailed'));
    }
  }

  const emptyMessage =
    tab === 'completed' ? t('jobCard.emptyCompleted') : t('jobCard.emptyActive');

  return (
    <div>
      <div className="portal-page-header">
        <PageTitle title={t('jobCard.title')} subtitle={t('jobCard.listSubtitle')} />
        <Link href="/repair/job-cards/new" className="block w-full sm:w-auto">
          <Button className="w-full sm:w-auto">{t('common.addNew')}</Button>
        </Link>
      </div>

      <Card className="mb-5">
        <PortalStatusTabs
          tabs={tabs}
          activeKey={tab}
          ariaLabel={t('jobCard.title')}
          className="mb-4"
        />
        <PortalSearchBar placeholder={t('jobCard.searchPlaceholder')} preserveParams={['tab']} />
      </Card>

      {actionError && (
        <p className="portal-alert portal-alert--error mb-4">{actionError}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : items.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">{emptyMessage}</p>
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
            if (item) {
              router.push(`/repair/job-cards/${item.id}?fromTab=${tab}`);
            }
          }}
          rows={items.map((item, i) => [
            i + 1,
            formatDate(item.jobCardDate),
            item.jobCardNo,
            item.carModelName ?? '—',
            item.customerName,
            <JobCardStatusBadge key={`${item.id}-status`} status={item.status} />,
          ])}
          actions={(index) => {
            const item = items[index];
            if (!item) return null;

            return (
              <button
                type="button"
                className="portal-icon-btn portal-icon-btn--danger"
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
