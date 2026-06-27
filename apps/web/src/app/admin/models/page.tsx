'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { vehicleModelsApi, type VehicleModel } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminActionAlert, AdminBulkSelectionBar, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useTableSelection } from '@/hooks/use-table-selection';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminVehicleModelsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { selectedIds, setSelectedIds, selection } = useTableSelection(models);

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
              <AdminTableDeleteButton onClick={() => handleDeleteOne(model)} />
            );
          }}
        />
      )}
      {confirmDialog}
    </AdminPageBody>
  );
}
