'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { partsApi, type Part } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminActionAlert, AdminBulkSelectionBar, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { PartBulkImportDialog } from '@/components/admin/part-bulk-import-dialog';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatCurrency } from '@/lib/utils';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminPartsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { selectedIds, setSelectedIds, selection } = useTableSelection(parts);

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
        <div className="portal-page-header-actions">
          <Button type="button" variant="outline" onClick={() => setBulkOpen(true)}>
            {t('admin.partBulkRegister')}
          </Button>
          <Link href="/admin/parts/new">
            <Button>{t('admin.productRegister')}</Button>
          </Link>
        </div>
      </div>

      <AdminSearchBar
        placeholder={t('admin.productSearchPlaceholder')}
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
              <AdminTableDeleteButton onClick={() => handleDeleteOne(part)} />
            );
          }}
        />
      )}
      {confirmDialog}
      <PartBulkImportDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => load(search)}
      />
    </AdminPageBody>
  );
}
