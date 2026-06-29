'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api';
import { Card, DataTable, DealerOrderStageBadge, PageTitle, PortalSearchBar, Button } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

function buildOrderDetailPath(orderId: string, searchParams: URLSearchParams) {
  const search = searchParams.get('search');
  if (!search) return `/orders/${orderId}`;
  return `/orders/${orderId}?search=${encodeURIComponent(search)}`;
}

export default function OrdersPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const statusParam = searchParams.get('status');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!statusParam) return;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const qs = params.toString();
    router.replace(qs ? `/orders?${qs}` : '/orders');
  }, [router, search, statusParam]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '100' };
    if (search) params.search = search;
    ordersApi
      .list(params)
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [search]);

  function goToOrderDetail(orderId: string) {
    router.push(buildOrderDetailPath(orderId, searchParams));
  }

  return (
    <div>
      <PageTitle title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <Card className="mb-5">
        <PortalSearchBar placeholder={t('orders.searchPlaceholder')} preserveParams={[]} />
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : orders.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">{t('orders.empty')}</p>
      ) : (
        <DataTable
          rowIds={orders.map((order) => order.id)}
          onRowClick={(index) => {
            const order = orders[index];
            if (order) goToOrderDetail(order.id);
          }}
          columns={[
            '#',
            t('orders.orderNo'),
            t('orders.date'),
            t('orders.parts'),
            t('orders.qty'),
            t('orders.amount'),
            t('orders.status'),
            t('orders.proformaInvoice'),
            t('orders.track'),
          ]}
          rows={orders.map((order, i) => [
            i + 1,
            <span key={`${order.id}-no`} className="block truncate" title={order.orderNo}>
              {order.orderNo}
            </span>,
            formatDate(order.createdAt),
            order.items.length,
            order.items.reduce((s, item) => s + item.quantity, 0),
            formatCurrency(Number(order.grandTotal)),
            <DealerOrderStageBadge
              key={`${order.id}-stage`}
              orderStatus={order.status}
              deliveryStatus={order.shipment?.deliveryStatus}
            />,
            <Button
              key={`${order.id}-invoice`}
              type="button"
              variant="outline"
              className="!min-h-8 !max-w-full !px-3 !py-1.5 !text-xs"
              onClick={(e) => {
                e.stopPropagation();
                ordersApi.downloadProformaInvoice(order.id).catch(() => undefined);
              }}
            >
              {t('orders.downloadProforma')}
            </Button>,
            <span key={`${order.id}-track`} className="block truncate" title={order.shipment?.trackingNo ?? undefined}>
              {order.shipment?.trackingNo ?? '—'}
            </span>,
          ])}
        />
      )}
    </div>
  );
}
