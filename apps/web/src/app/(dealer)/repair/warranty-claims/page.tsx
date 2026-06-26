'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { warrantyClaimsApi, type WarrantyClaim } from '@/lib/api';
import { Button, Card, DataTable, PageTitle, PortalSearchBar, StatusBadge, useConfirmDialog } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function WarrantyClaimListPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [items, setItems] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      const res = await warrantyClaimsApi.list(params);
      setItems(res.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: WarrantyClaim) {
    const ok = await confirm({ message: t('warranty.deleteConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await warrantyClaimsApi.remove(item.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('warranty.deleteFailed'));
    }
  }

  const canDelete = (status: string) => ['DRAFT', 'REJECTED'].includes(status);

  return (
    <div>
      <div className="portal-page-header">
        <PageTitle title={t('warranty.title')} subtitle={t('warranty.listSubtitle')} />
        <Link href="/repair/warranty-claims/new" className="block w-full sm:w-auto">
          <Button className="w-full sm:w-auto">{t('common.addNew')}</Button>
        </Link>
      </div>

      <Card className="mb-5">
        <PortalSearchBar placeholder={t('warranty.searchPlaceholder')} preserveParams={[]} />
      </Card>

      {actionError && (
        <p className="mb-4 rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{actionError}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : items.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : (
        <DataTable
          columns={['#', t('warranty.date'), t('warranty.claimNo'), t('warranty.invoiceNo'), t('orders.status')]}
          onRowClick={(index) => {
            const item = items[index];
            if (item) router.push(`/repair/warranty-claims/${item.id}`);
          }}
          rows={items.map((item, i) => [
            i + 1,
            formatDate(item.warrantyClaimDate),
            item.warrantyClaimNo,
            item.invoiceNo,
            <StatusBadge key={`${item.id}-status`} status={item.status} />,
          ])}
          actions={(index) => {
            const item = items[index];
            if (!item || !canDelete(item.status)) return null;

            return (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#ff3b30] hover:bg-[#fff0ef]"
                aria-label={t('common.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(item);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            );
          }}
        />
      )}

      {confirmDialog}
    </div>
  );
}
