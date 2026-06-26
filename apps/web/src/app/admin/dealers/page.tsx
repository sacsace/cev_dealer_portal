'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { dealersApi, type Dealer } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminDealersPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
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
      const res = await dealersApi.list(params);
      setDealers(res.data);
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

  const allSelected = dealers.length > 0 && dealers.every((d) => selectedIds.has(d.id));
  const someSelected = dealers.some((d) => selectedIds.has(d.id));

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
          if (dealers.length > 0 && dealers.every((d) => prev.has(d.id))) {
            return new Set();
          }
          return new Set(dealers.map((d) => d.id));
        });
      },
    }),
    [selectedIds, allSelected, someSelected, dealers],
  );

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
              <button
                type="button"
                onClick={() => handleDeleteOne(dealer)}
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
