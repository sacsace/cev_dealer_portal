'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api';
import { Card, DataTable, PageTitle, PortalSearchBar, PortalStatusTabs, StatusBadge, Button } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

const ORDER_TABS = [
  { key: 'SUBMITTED', status: 'SUBMITTED' },
  { key: 'APPROVED', status: 'APPROVED' },
  { key: 'ORDER_SHIPPED', status: 'ORDER_SHIPPED' },
] as const;

export default function OrdersPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const statusParam = searchParams.get('status');
  const activeStatus =
    ORDER_TABS.find((tab) => tab.status === statusParam)?.status ?? ORDER_TABS[0].status;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = useMemo(
    () =>
      ORDER_TABS.map((tab) => ({
        key: tab.status,
        label:
          tab.status === 'SUBMITTED'
            ? t('nav.pendingOrders')
            : tab.status === 'APPROVED'
              ? t('nav.approvedOrders')
              : t('nav.shippedOrders'),
        href: search
          ? `/orders?status=${tab.status}&search=${encodeURIComponent(search)}`
          : `/orders?status=${tab.status}`,
      })),
    [search, t],
  );

  useEffect(() => {
    if (!statusParam || !ORDER_TABS.some((tab) => tab.status === statusParam)) {
      const next = search
        ? `/orders?status=${ORDER_TABS[0].status}&search=${encodeURIComponent(search)}`
        : `/orders?status=${ORDER_TABS[0].status}`;
      router.replace(next);
    }
  }, [router, search, statusParam]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '100', status: activeStatus };
    if (search) params.search = search;
    ordersApi
      .list(params)
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [activeStatus, search]);

  return (
    <div>
      <PageTitle title={t('orders.title')} subtitle={t('orders.subtitle')} />

      <PortalStatusTabs
        tabs={tabs}
        activeKey={activeStatus}
        ariaLabel={t('orders.title')}
        className="mb-5"
      />

      <Card className="mb-5">
        <PortalSearchBar placeholder={t('orders.searchPlaceholder')} preserveParams={['status']} />
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : orders.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">{t('orders.emptyTab')}</p>
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
            t('orders.proformaInvoice'),
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
            <Button
              key={`${order.id}-invoice`}
              type="button"
              variant="outline"
              className="!min-h-8 !px-3 !py-1.5 !text-xs"
              onClick={(e) => {
                e.stopPropagation();
                ordersApi.downloadProformaInvoice(order.id).catch(() => undefined);
              }}
            >
              {order.invoice?.invoiceNo ?? t('orders.downloadProforma')}
            </Button>,
            order.shipment?.trackingNo ?? '—',
          ])}
        />
      )}
    </div>
  );
}
