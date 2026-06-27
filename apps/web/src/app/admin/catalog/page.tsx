'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { categoriesApi, type Category } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminActionAlert, AdminBulkSelectionBar, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminCatalogPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [items, setItems] = useState<Category[]>([]);
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
      const res = await categoriesApi.list(params);
      setItems(res.data);
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

  async function handleDeleteOne(item: Category) {
    const ok = await confirm({ message: t('admin.deleteCategoryConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await categoriesApi.remove(item.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.categoryDeleteFailed'));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const message = t('admin.deleteSelectedCategoriesConfirm').replace('{count}', String(selectedIds.size));
    const ok = await confirm({ message });
    if (!ok) return;

    setDeleting(true);
    setActionError('');
    const failures: string[] = [];

    for (const id of selectedIds) {
      try {
        await categoriesApi.remove(id);
      } catch {
        const item = items.find((entry) => entry.id === id);
        failures.push(item?.name ?? id);
      }
    }

    await load(search);

    if (failures.length > 0) {
      setActionError(t('admin.categoryBulkDeletePartial').replace('{names}', failures.join(', ')));
    }

    setDeleting(false);
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.catalogMgmt')} subtitle={t('admin.catalogSubtitle')} />
        <Link href="/admin/catalog/new">
          <Button>{t('admin.catalogRegister')}</Button>
        </Link>
      </div>

      <AdminSearchBar
        placeholder={t('admin.catalogSearchPlaceholder')}
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
            t('admin.catalogName'),
            t('admin.catalogDescription'),
            t('orders.status'),
            t('orders.date'),
          ]}
          rowIds={items.map((item) => item.id)}
          selection={selection}
          onRowClick={(index) => {
            const item = items[index];
            if (item) router.push(`/admin/catalog/${item.id}`);
          }}
          rows={items.map((item, i) => [
            i + 1,
            item.name,
            item.description?.trim() || '—',
            <StatusBadge key={`${item.id}-status`} status={item.status ?? 'ACTIVE'} />,
            item.createdAt ? formatDate(item.createdAt) : '—',
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
