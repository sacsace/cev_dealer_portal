'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { categoriesApi, type Category } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminCatalogPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [items, setItems] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);

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
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someSelected = items.some((item) => selectedIds.has(item.id));

  const selection = useMemo(
    () => ({
      selectedIds,
      allSelected,
      someSelected,
      onToggle: (id: string) => {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      },
      onToggleAll: () => {
        setSelectedIds((prev) => {
          if (items.length > 0 && items.every((item) => prev.has(item.id))) {
            return new Set();
          }
          return new Set(items.map((item) => item.id));
        });
      },
    }),
    [selectedIds, allSelected, someSelected, items],
  );

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

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-4 py-3 shadow-[var(--shadow-sm)]">
          <span className="text-[13px] text-[var(--text-secondary)]">
            {t('admin.selectedCount').replace('{count}', String(selectedIds.size))}
          </span>
          <Button variant="danger" disabled={deleting} onClick={handleBulkDelete}>
            {deleting ? t('common.loading') : t('admin.deleteSelected')}
          </Button>
        </div>
      )}

      {actionError && (
        <p className="mb-4 rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{actionError}</p>
      )}

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
              <button
                type="button"
                onClick={() => handleDeleteOne(item)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[#fff0ef] hover:text-[#ff3b30]"
                aria-label={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            );
          }}
        />
      )}
      {confirmDialog}
    </AdminPageBody>
  );
}
