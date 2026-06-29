'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSession, ordersApi, type Order } from '@/lib/api';
import { loadPendingOrderCount } from '@/lib/order-events';
import { canDeleteAdminOrder } from '@/lib/admin-access';
import { normalizeDeliveryStatus } from '@/lib/delivery-status';
import { nextSortState, sortByKey, type SortDirection } from '@/lib/table-sort';
import {
  Card,
  DataTable,
  DeliveryStatusBadge,
  PageTitle,
  PortalSearchBar,
  StatusBadge,
  useConfirmDialog,
} from '@/components/ui';
import { AdminActionAlert, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { OrderDetailDialog } from '@/components/admin/order-detail-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

const ORDER_COLUMN_KEYS = [
  'index',
  'orderNo',
  'dealerName',
  'createdAt',
  'grandTotal',
  'status',
  'deliveryStatus',
  'trackingNo',
] as const;

const ORDER_SORT_ACCESSORS: Record<string, (order: Order) => string | number> = {
  orderNo: (order) => order.orderNo,
  dealerName: (order) => order.dealer?.dealerName ?? '',
  createdAt: (order) => new Date(order.createdAt).getTime(),
  grandTotal: (order) => Number(order.grandTotal),
  status: (order) => order.status,
  deliveryStatus: (order) =>
    normalizeDeliveryStatus(order.shipment?.deliveryStatus, order.status) ?? '',
  trackingNo: (order) => order.shipment?.trackingNo ?? '',
};

export default function AdminOrdersContent() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const session = getSession();
  const canDelete = canDeleteAdminOrder(session?.role);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({
    key: 'createdAt',
    direction: 'desc',
  });

  async function loadOrders() {
    const params: Record<string, string> = { limit: '100' };
    if (search) params.search = search;
    const res = await ordersApi.list(params);
    return res.data;
  }

  useEffect(() => {
    setLoading(true);
    loadOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [search]);

  async function refreshOrders() {
    const data = await loadOrders();
    setOrders(data);
  }

  const sortedOrders = useMemo(
    () => sortByKey(orders, sort.key, sort.direction, ORDER_SORT_ACCESSORS),
    [orders, sort.direction, sort.key],
  );

  function handleSort(key: string) {
    setSort((current) => nextSortState(current.key, current.direction, key));
  }

  async function handleDelete(order: Order) {
    if (!canDelete) return;
    const ok = await confirm({ message: t('admin.deleteOrderConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await ordersApi.remove(order.id);
      if (selectedOrderId === order.id) {
        setSelectedOrderId(null);
      }
      await loadPendingOrderCount().catch(() => {});
      await refreshOrders();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.orderDeleteFailed'));
    }
  }

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.orderMgmt')} subtitle={t('admin.orderSubtitle')} />

      <Card className="mb-5 !p-4">
        <PortalSearchBar placeholder={t('orders.searchPlaceholder')} preserveParams={[]} />
      </Card>

      {actionError ? <AdminActionAlert message={actionError} /> : null}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : orders.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">{t('admin.orderEmpty')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('orders.orderNo'),
            t('checkout.dealerName'),
            t('orders.date'),
            t('orders.amount'),
            t('orders.status'),
            t('admin.deliveryStatus'),
            t('admin.trackingNo'),
          ]}
          columnKeys={[...ORDER_COLUMN_KEYS]}
          sortableColumnKeys={ORDER_COLUMN_KEYS.filter((key) => key !== 'index')}
          sort={sort}
          onSort={handleSort}
          rowIds={sortedOrders.map((order) => order.id)}
          onRowClick={(index) => setSelectedOrderId(sortedOrders[index]?.id ?? null)}
          rows={sortedOrders.map((order, i) => {
            const deliveryKey = normalizeDeliveryStatus(order.shipment?.deliveryStatus, order.status);

            return [
              i + 1,
              order.orderNo,
              order.dealer?.dealerName ?? '—',
              formatDate(order.createdAt),
              formatCurrency(Number(order.grandTotal)),
              <StatusBadge key={`${order.id}-status`} status={order.status} />,
              deliveryKey ? (
                <DeliveryStatusBadge key={`${order.id}-delivery`} status={deliveryKey} />
              ) : (
                '—'
              ),
              order.shipment?.trackingNo ?? '—',
            ];
          })}
          actions={
            canDelete
              ? (index) => {
                  const order = sortedOrders[index];
                  if (!order) return null;

                  return (
                    <AdminTableDeleteButton
                      stopPropagation
                      onClick={() => {
                        void handleDelete(order);
                      }}
                    />
                  );
                }
              : undefined
          }
        />
      )}

      <OrderDetailDialog
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={refreshOrders}
      />
      {confirmDialog}
    </AdminPageBody>
  );
}
