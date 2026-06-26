'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { partsApi, type Part } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminPartsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
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
      const res = await partsApi.search(params);
      setParts(res.data);
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

  const allSelected = parts.length > 0 && parts.every((part) => selectedIds.has(part.id));
  const someSelected = parts.some((part) => selectedIds.has(part.id));

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
          if (parts.length > 0 && parts.every((part) => prev.has(part.id))) {
            return new Set();
          }
          return new Set(parts.map((part) => part.id));
        });
      },
    }),
    [selectedIds, allSelected, someSelected, parts],
  );

  async function handleDeleteOne(part: Part) {
    const ok = await confirm({ message: t('admin.deletePartConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await partsApi.remove(part.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.partDeleteFailed'));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const message = t('admin.deleteSelectedPartsConfirm').replace('{count}', String(selectedIds.size));
    const ok = await confirm({ message });
    if (!ok) return;

    setDeleting(true);
    setActionError('');
    const failures: string[] = [];

    for (const id of selectedIds) {
      try {
        await partsApi.remove(id);
      } catch {
        const part = parts.find((entry) => entry.id === id);
        failures.push(part?.partNumber ?? id);
      }
    }

    await load(search);

    if (failures.length > 0) {
      setActionError(t('admin.partBulkDeletePartial').replace('{codes}', failures.join(', ')));
    }

    setDeleting(false);
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.partsMgmt')} subtitle={t('admin.partsSubtitle')} />
        <Link href="/admin/parts/new">
          <Button>{t('admin.productRegister')}</Button>
        </Link>
      </div>

      <AdminSearchBar
        placeholder={t('admin.productSearchPlaceholder')}
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
            t('parts.partNo'),
            t('parts.partName'),
            t('parts.category'),
            t('parts.price'),
            t('parts.stock'),
            t('orders.status'),
          ]}
          rowIds={parts.map((part) => part.id)}
          selection={selection}
          onRowClick={(index) => {
            const part = parts[index];
            if (part) router.push(`/admin/parts/${part.id}`);
          }}
          rows={parts.map((part, i) => [
            i + 1,
            part.partNumber,
            part.partName,
            part.category?.name ?? '—',
            formatCurrency(Number(part.dealerPrice)),
            part.stockQuantity,
            <StatusBadge key={`${part.id}-status`} status={part.status} />,
          ])}
          actions={(index) => {
            const part = parts[index];
            if (!part) return null;

            return (
              <button
                type="button"
                onClick={() => handleDeleteOne(part)}
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
