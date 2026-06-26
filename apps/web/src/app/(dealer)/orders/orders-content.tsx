'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api';
import { Card, DataTable, PageTitle, PortalSearchBar, StatusBadge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function OrdersPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? undefined;
  const search = searchParams.get('search') ?? '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '100' };
    if (status) params.status = status;
    if (search) params.search = search;
    ordersApi
      .list(params)
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status, search]);

  return (
    <div>
      <PageTitle title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <Card className="mb-5">
        <PortalSearchBar placeholder={t('orders.searchPlaceholder')} preserveParams={['status']} />
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : orders.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('orders.orderNo'),
            t('orders.date'),
            t('orders.parts'),
            t('orders.qty'),
            t('orders.amount'),
            t('orders.status'),
            t('orders.track'),
          ]}
          rows={orders.map((order, i) => [
            i + 1,
            order.orderNo,
            formatDate(order.createdAt),
            order.items.length,
            order.items.reduce((s, item) => s + item.quantity, 0),
            formatCurrency(Number(order.grandTotal)),
            <StatusBadge key={order.id} status={order.status} />,
            order.shipment?.trackingNo ?? '—',
          ])}
        />
      )}
    </div>
  );
}
