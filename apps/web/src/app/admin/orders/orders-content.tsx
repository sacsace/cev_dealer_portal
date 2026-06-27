'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api';
import { normalizeDeliveryStatus } from '@/lib/delivery-status';
import { Card, DataTable, DeliveryStatusBadge, PageTitle, PortalSearchBar, StatusBadge } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { OrderDetailDialog } from '@/components/admin/order-detail-dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminOrdersContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

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

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.orderMgmt')} subtitle={t('admin.orderSubtitle')} />

      <Card className="mb-5 !p-4">
        <PortalSearchBar placeholder={t('orders.searchPlaceholder')} preserveParams={[]} />
      </Card>

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
          rowIds={orders.map((order) => order.id)}
          onRowClick={(index) => setSelectedOrderId(orders[index]?.id ?? null)}
          rows={orders.map((order, i) => {
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
        />
      )}

      <OrderDetailDialog
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={refreshOrders}
      />
    </AdminPageBody>
  );
}
