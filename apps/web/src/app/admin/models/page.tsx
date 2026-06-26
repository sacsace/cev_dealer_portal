'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { vehicleModelsApi, type VehicleModel } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminVehicleModelsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (q = search) => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.search = q;
      const res = await vehicleModelsApi.list(params);
      setModels(res.data);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const allSelected = models.length > 0 && models.every((m) => selectedIds.has(m.id));
  const someSelected = models.some((m) => selectedIds.has(m.id));

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
          if (models.length > 0 && models.every((m) => prev.has(m.id))) {
            return new Set();
          }
          return new Set(models.map((m) => m.id));
        });
      },
    }),
    [selectedIds, allSelected, someSelected, models],
  );

  async function handleDeleteOne(model: VehicleModel) {
    const ok = await confirm({ message: t('admin.deleteModelConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await vehicleModelsApi.remove(model.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.modelDeleteFailed'));
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;

    const message = t('admin.deleteSelectedModelsConfirm').replace('{count}', String(selectedIds.size));
    const ok = await confirm({ message });
    if (!ok) return;

    setDeleting(true);
    setActionError('');
    const failures: string[] = [];

    for (const id of selectedIds) {
      try {
        await vehicleModelsApi.remove(id);
      } catch {
        const model = models.find((m) => m.id === id);
        failures.push(model?.modelCode ?? id);
      }
    }

    await load(search);

    if (failures.length > 0) {
      setActionError(t('admin.modelBulkDeletePartial').replace('{codes}', failures.join(', ')));
    }

    setDeleting(false);
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.modelMgmt')} subtitle={t('admin.modelSubtitle')} />
        <Link href="/admin/models/new">
          <Button>{t('admin.modelRegister')}</Button>
        </Link>
      </div>

      <AdminSearchBar
        placeholder={t('admin.modelSearchPlaceholder')}
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
            t('admin.modelName'),
            t('admin.modelCode'),
            t('admin.modelYear'),
            t('orders.status'),
            t('orders.date'),
          ]}
          rowIds={models.map((m) => m.id)}
          selection={selection}
          onRowClick={(index) => {
            const model = models[index];
            if (model) router.push(`/admin/models/${model.id}`);
          }}
          rows={models.map((m, i) => [
            i + 1,
            m.modelName,
            m.modelCode,
            m.year ?? '—',
            <StatusBadge key={`${m.id}-status`} status={m.status ?? 'ACTIVE'} />,
            m.createdAt ? formatDate(m.createdAt) : '—',
          ])}
          actions={(index) => {
            const model = models[index];
            if (!model) return null;

            return (
              <button
                type="button"
                onClick={() => handleDeleteOne(model)}
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
