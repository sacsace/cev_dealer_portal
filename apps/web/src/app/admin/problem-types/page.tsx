'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { problemTypesApi, type ProblemType } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminProblemTypesPage() {
  const { t, locale } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [items, setItems] = useState<ProblemType[]>([]);
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
      const res = await problemTypesApi.list(params);
      setItems(res.data);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  function displayName(item: ProblemType) {
    if (locale === 'en' && item.nameEn) return item.nameEn;
    return item.name;
  }

  const allSelected = items.length > 0 && items.every((m) => selectedIds.has(m.id));
  const someSelected = items.some((m) => selectedIds.has(m.id));

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
          if (items.length > 0 && items.every((m) => prev.has(m.id))) {
            return new Set();
          }
          return new Set(items.map((m) => m.id));
        });
      },
    }),
    [selectedIds, allSelected, someSelected, items],
  );

  async function handleDeleteOne(item: ProblemType) {
    const ok = await confirm({ message: t('admin.deleteProblemTypeConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await problemTypesApi.remove(item.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.problemTypeDeleteFailed'));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const message = t('admin.deleteSelectedProblemTypesConfirm').replace('{count}', String(selectedIds.size));
    const ok = await confirm({ message });
    if (!ok) return;

    setDeleting(true);
    setActionError('');
    const failures: string[] = [];

    for (const id of selectedIds) {
      try {
        await problemTypesApi.remove(id);
      } catch {
        const item = items.find((m) => m.id === id);
        failures.push(item?.name ?? id);
      }
    }

    await load(search);

    if (failures.length > 0) {
      setActionError(t('admin.problemTypeBulkDeletePartial').replace('{names}', failures.join(', ')));
    }

    setDeleting(false);
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.problemTypeMgmt')} subtitle={t('admin.problemTypeSubtitle')} />
        <Link href="/admin/problem-types/new">
          <Button>{t('admin.problemTypeRegister')}</Button>
        </Link>
      </div>

      <AdminSearchBar
        placeholder={t('admin.problemTypeSearchPlaceholder')}
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
            t('admin.problemTypeName'),
            t('admin.problemTypeNameEn'),
            t('admin.sortOrder'),
            t('orders.status'),
            t('orders.date'),
          ]}
          rowIds={items.map((m) => m.id)}
          selection={selection}
          onRowClick={(index) => {
            const item = items[index];
            if (item) router.push(`/admin/problem-types/${item.id}`);
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
