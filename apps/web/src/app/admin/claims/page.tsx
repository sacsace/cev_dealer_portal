'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { warrantyClaimsApi, type WarrantyClaim } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminClaimsPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async (q = search) => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.search = q;
      const res = await warrantyClaimsApi.list(params);
      setClaims(res.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(claim: WarrantyClaim) {
    const ok = await confirm({ message: t('warranty.deleteConfirm') });
    if (!ok) return;

    try {
      await warrantyClaimsApi.remove(claim.id);
      await load(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('warranty.deleteFailed'));
    }
  }

  const canDelete = (status: string) => ['DRAFT', 'REJECTED', 'SUBMITTED'].includes(status);

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.claimMgmt')} subtitle={t('admin.claimSubtitle')} />
      <AdminSearchBar
        placeholder={t('warranty.searchPlaceholder')}
        onSearch={(q) => {
          setSearch(q);
          load(q);
        }}
      />

      {actionError && (
        <p className="mb-4 rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{actionError}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('admin.claimNo'),
            t('checkout.dealerName'),
            t('admin.invoiceNo'),
            t('orders.date'),
            t('orders.status'),
          ]}
          onRowClick={(index) => {
            const claim = claims[index];
            if (claim) router.push(`/admin/claims/${claim.id}`);
          }}
          rows={claims.map((c, i) => [
            i + 1,
            c.warrantyClaimNo,
            c.dealer?.dealerName ?? '—',
            c.invoiceNo,
            formatDate(c.warrantyClaimDate),
            <StatusBadge key={`${c.id}-status`} status={c.status} />,
          ])}
          actions={(index) => {
            const claim = claims[index];
            if (!claim) return null;

            return (
              <div className="flex gap-2">
                {['SUBMITTED', 'UNDER_REVIEW'].includes(claim.status) && (
                  <>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        void warrantyClaimsApi.approve(claim.id).then(() => load(search));
                      }}
                    >
                      {t('admin.approve')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        void warrantyClaimsApi.reject(claim.id).then(() => load(search));
                      }}
                    >
                      {t('admin.reject')}
                    </Button>
                  </>
                )}
                {canDelete(claim.status) && (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#ff3b30] hover:bg-[#fff0ef]"
                    aria-label={t('common.delete')}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(claim);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          }}
        />
      )}

      {confirmDialog}
    </AdminPageBody>
  );
}
