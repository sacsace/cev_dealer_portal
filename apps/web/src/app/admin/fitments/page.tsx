'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fitmentsApi, type Fitment } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminActionAlert, AdminBulkSelectionBar, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminFitmentsPage() {
  const { t, locale } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [items, setItems] = useState<Fitment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { selectedIds, setSelectedIds, selection } = useTableSelection(items);

  const load = useCallback(async (q = search) => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (q) params.search = q;
      const res = await fitmentsApi.list(params);
      setItems(res.data);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  function displayName(item: Fitment) {
    if (locale === 'en' && item.nameEn) return item.nameEn;
    return item.name;
  }

    async function handleDeleteOne(item: Fitment) {
    const ok = await confirm({ message: t('admin.deleteFitmentConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await fitmentsApi.remove(item.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.fitmentDeleteFailed'));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const message = t('admin.deleteSelectedFitmentsConfirm').replace('{count}', String(selectedIds.size));
    const ok = await confirm({ message });
    if (!ok) return;

    setDeleting(true);
    setActionError('');
    const failures: string[] = [];

    for (const id of selectedIds) {
      try {
        await fitmentsApi.remove(id);
      } catch {
        const item = items.find((m) => m.id === id);
        failures.push(item?.name ?? id);
      }
    }

    await load(search);

    if (failures.length > 0) {
      setActionError(t('admin.fitmentBulkDeletePartial').replace('{names}', failures.join(', ')));
    }

    setDeleting(false);
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.fitmentMgmt')} subtitle={t('admin.fitmentSubtitle')} />
        <Link href="/admin/fitments/new">
          <Button>{t('admin.fitmentRegister')}</Button>
        </Link>
      </div>

      <AdminSearchBar
        placeholder={t('admin.fitmentSearchPlaceholder')}
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
            t('admin.fitmentName'),
            t('admin.fitmentNameEn'),
            t('admin.sortOrder'),
            t('orders.status'),
            t('orders.date'),
          ]}
          rowIds={items.map((m) => m.id)}
          selection={selection}
          onRowClick={(index) => {
            const item = items[index];
            if (item) router.push(`/admin/fitments/${item.id}`);
          }}
          rows={items.map((m, i) => [
            i + 1,
            displayName(m),
            m.nameEn ?? '—',
            m.sortOrder,
            <StatusBadge key={`${m.id}-status`} status={m.status} />,
            m.createdAt ? formatDate(m.createdAt) : '—',
          ])}
          actions={(index) => {
            const item = items[index];
            if (!item) return null;

            return (
              <AdminTableDeleteButton onClick={() => handleDeleteOne(item)} />
            );
          }}
        />
      )}
      {confirmDialog}
    </AdminPageBody>
  );
}
