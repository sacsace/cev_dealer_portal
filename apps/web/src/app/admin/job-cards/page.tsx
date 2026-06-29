'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, jobCardsApi, type JobCard } from '@/lib/api';
import { loadJobCardCount } from '@/lib/job-card-events';
import {
  buildJobCardListHref,
  parseJobCardListTab,
  type JobCardListTab,
} from '@/lib/job-card-status';
import { canDeleteAdminJobCard } from '@/lib/admin-access';
import {
  Card,
  DataTable,
  PageTitle,
  JobCardStatusBadge,
  PortalStatusTabs,
  useConfirmDialog,
} from '@/components/ui';
import { AdminActionAlert, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { nextSortState, sortByKey, type SortDirection } from '@/lib/table-sort';
import { useI18n } from '@/components/providers/i18n-provider';

const JOB_CARD_COLUMN_KEYS = [
  'index',
  'jobCardNo',
  'dealerName',
  'customerName',
  'vin',
  'carModelName',
  'jobCardDate',
  'status',
] as const;

const JOB_CARD_SORT_ACCESSORS: Record<string, (item: JobCard) => string | number> = {
  jobCardNo: (item) => item.jobCardNo,
  dealerName: (item) => item.dealer?.dealerName ?? '',
  customerName: (item) => item.customerName,
  vin: (item) => item.vin,
  carModelName: (item) => item.carModelName ?? '',
  jobCardDate: (item) => new Date(item.jobCardDate).getTime(),
  status: (item) => item.status,
};

export default function AdminJobCardsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = getSession();
  const canDelete = canDeleteAdminJobCard(session?.role);
  const tab = parseJobCardListTab(searchParams.get('tab'));
  const [items, setItems] = useState<JobCard[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({
    key: 'jobCardDate',
    direction: 'desc',
  });

  const tabs = useMemo(
    () => [
      {
        key: 'active',
        label: t('jobCard.tabActive'),
        href: buildJobCardListHref('/admin/job-cards', 'active'),
      },
      {
        key: 'completed',
        label: t('jobCard.tabCompleted'),
        href: buildJobCardListHref('/admin/job-cards', 'completed'),
      },
    ],
    [t],
  );

  const load = useCallback(
    async (q = search, nextTab: JobCardListTab = tab) => {
      setLoading(true);
      setActionError('');
      try {
        const params: Record<string, string> = { limit: '50', progress: nextTab };
        if (q) params.search = q;
        const res = await jobCardsApi.list(params);
        setItems(res.data);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
      } finally {
        setLoading(false);
      }
    },
    [search, t, tab],
  );

  useEffect(() => {
    load(search, tab);
  }, [load, search, tab]);

  const sortedItems = useMemo(
    () => sortByKey(items, sort.key, sort.direction, JOB_CARD_SORT_ACCESSORS),
    [items, sort.direction, sort.key],
  );

  function handleSort(key: string) {
    setSort((current) => nextSortState(current.key, current.direction, key));
  }

  async function handleDelete(item: JobCard) {
    if (!canDelete) return;
    const ok = await confirm({ message: t('jobCard.deleteConfirm') });
    if (!ok) return;

    try {
      await jobCardsApi.remove(item.id);
      await loadJobCardCount().catch(() => {});
      await load(search, tab);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('jobCard.deleteFailed'));
    }
  }

  const emptyMessage =
    tab === 'completed' ? t('jobCard.emptyCompleted') : t('jobCard.emptyActive');

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.jobCardMgmt')} subtitle={t('admin.jobCardSubtitle')} />
      <Card className="mb-5 !p-4">
        <PortalStatusTabs
          tabs={tabs}
          activeKey={tab}
          ariaLabel={t('admin.jobCardMgmt')}
          className="mb-4"
        />
        <AdminSearchBar
          placeholder={t('jobCard.searchPlaceholder')}
          onSearch={(q) => {
            setSearch(q);
            load(q, tab);
          }}
        />
      </Card>

      {actionError ? <AdminActionAlert message={actionError} /> : null}

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
            t('admin.jobCardNo'),
            t('checkout.dealerName'),
            t('admin.customer'),
            'VIN',
            t('parts.model'),
            t('orders.date'),
            t('orders.status'),
          ]}
          columnKeys={[...JOB_CARD_COLUMN_KEYS]}
          sortableColumnKeys={JOB_CARD_COLUMN_KEYS.filter((key) => key !== 'index')}
          sort={sort}
          onSort={handleSort}
          onRowClick={(index) => {
            const item = sortedItems[index];
            if (item) {
              router.push(`/admin/job-cards/${item.id}?fromTab=${tab}`);
            }
          }}
          rows={sortedItems.map((j, i) => [
            i + 1,
            j.jobCardNo,
            j.dealer?.dealerName ?? '—',
            j.customerName,
            j.vin,
            j.carModelName ?? '—',
            formatDate(j.jobCardDate),
            <JobCardStatusBadge key={`${j.id}-status`} status={j.status} />,
          ])}
          actions={
            canDelete
              ? (index) => {
                  const item = sortedItems[index];
                  if (!item) return null;

                  return (
                    <AdminTableDeleteButton
                      stopPropagation
                      onClick={() => {
                        void handleDelete(item);
                      }}
                    />
                  );
                }
              : undefined
          }
        />
      )}

      {confirmDialog}
    </AdminPageBody>
  );
}
