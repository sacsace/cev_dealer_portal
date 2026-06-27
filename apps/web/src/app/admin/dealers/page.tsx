'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dealersApi, type Dealer } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminActionAlert, AdminBulkSelectionBar, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { useTableSelection } from '@/hooks/use-table-selection';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminDealersPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { selectedIds, setSelectedIds, selection } = useTableSelection(dealers);

  const load = useCallback(async (q = search) => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.search = q;
      const res = await dealersApi.list(params);
      setDealers(res.data);
      setSelectedIds(new Set());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [search, t, setSelectedIds]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDeleteOne(dealer: Dealer) {
    const ok = await confirm({ message: t('admin.deleteDealerConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await dealersApi.remove(dealer.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.dealerDeleteFailed'));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const message = t('admin.deleteSelectedDealersConfirm').replace('{count}', String(selectedIds.size));
    const ok = await confirm({ message });
    if (!ok) return;

    setDeleting(true);
    setActionError('');
    const failures: string[] = [];

    for (const id of selectedIds) {
      try {
        await dealersApi.remove(id);
      } catch {
        const dealer = dealers.find((d) => d.id === id);
        failures.push(dealer?.dealerCode ?? id);
      }
    }

    await load(search);

    if (failures.length > 0) {
      setActionError(t('admin.dealerBulkDeletePartial').replace('{codes}', failures.join(', ')));
    }

    setDeleting(false);
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.dealerMgmt')} subtitle={t('admin.dealerSubtitle')} />
        <Link href="/admin/dealers/new">
          <Button>{t('admin.dealerRegister')}</Button>
        </Link>
      </div>

      <AdminSearchBar
        onSearch={(q) => {
          setSearch(q);
          load(q);
        }}
      />

      {selectedIds.size > 0 ? (
        <AdminBulkSelectionBar count={selectedIds.size} deleting={deleting} onDelete={handleBulkDelete} />
      ) : null}

      {actionError ? <AdminActionAlert message={actionError} /> : null}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('checkout.dealerCode'),
            t('checkout.dealerName'),
            t('checkout.email'),
            t('checkout.mobile'),
            t('admin.location'),
            t('orders.status'),
            t('orders.date'),
          ]}
          rowIds={dealers.map((d) => d.id)}
          selection={selection}
          onRowClick={(index) => {
            const dealer = dealers[index];
            if (dealer) router.push(`/admin/dealers/${dealer.id}`);
          }}
          rows={dealers.map((d, i) => [
            i + 1,
            d.dealerCode,
            d.dealerName,
            d.email,
            d.mobile ?? '—',
            [d.city, d.state].filter(Boolean).join(', ') || '—',
            <StatusBadge key={`${d.id}-status`} status={d.status} />,
            formatDate(d.createdAt),
          ])}
          actions={(index) => {
            const dealer = dealers[index];
            if (!dealer) return null;

            return (
              <AdminTableDeleteButton onClick={() => handleDeleteOne(dealer)} />
            );
          }}
        />
      )}
      {confirmDialog}
    </AdminPageBody>
  );
}
