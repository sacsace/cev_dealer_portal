'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api';
import {
  ADMIN_ORDER_TABS,
  DEFAULT_ADMIN_ORDER_TAB,
  DELIVERY_ORDER_STATUSES,
  isAdminOrderTabKey,
} from '@/lib/admin-order-tabs';
import { Button, Card, DataTable, PageTitle, PortalSearchBar, PortalStatusTabs, StatusBadge } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

async function fetchOrdersForTab(tab: string, search: string): Promise<Order[]> {
  const params: Record<string, string> = { limit: '100' };
  if (search) params.search = search;

  if (tab === 'pending') {
    const res = await ordersApi.list({ ...params, status: 'SUBMITTED' });
    return res.data;
  }

  if (tab === 'delivery') {
    const results = await Promise.all(
      DELIVERY_ORDER_STATUSES.map((status) => ordersApi.list({ ...params, status })),
    );
    const merged = results.flatMap((res) => res.data);
    const unique = [...new Map(merged.map((order) => [order.id, order])).values()];
    unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return unique;
  }

  const res = await ordersApi.list(params);
  return res.data;
}

export default function AdminOrdersContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const tabParam = searchParams.get('tab');
  const activeTab = isAdminOrderTabKey(tabParam) ? tabParam : DEFAULT_ADMIN_ORDER_TAB;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = useMemo(() => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);

    return ADMIN_ORDER_TABS.map((tab) => {
      const hrefQuery = new URLSearchParams(query);
      hrefQuery.set('tab', tab.key);
      const qs = hrefQuery.toString();
      return {
        key: tab.key,
        label: t(tab.labelKey),
        href: qs ? `/admin/orders?${qs}` : `/admin/orders?tab=${tab.key}`,
      };
    });
  }, [search, t]);

  useEffect(() => {
    if (!isAdminOrderTabKey(tabParam)) {
      const next = new URLSearchParams();
      next.set('tab', DEFAULT_ADMIN_ORDER_TAB);
      if (search) next.set('search', search);
      router.replace(`/admin/orders?${next.toString()}`);
    }
  }, [router, search, tabParam]);

  useEffect(() => {
    setLoading(true);
    fetchOrdersForTab(activeTab, search)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  async function approve(id: string) {
    await ordersApi.approve(id);
    const data = await fetchOrdersForTab(activeTab, search);
    setOrders(data);
  }

  async function reject(id: string) {
    await ordersApi.reject(id);
    const data = await fetchOrdersForTab(activeTab, search);
    setOrders(data);
  }

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.orderMgmt')} subtitle={t('admin.orderSubtitle')} />

      <PortalStatusTabs
        tabs={tabs}
        activeKey={activeTab}
        ariaLabel={t('admin.orderMgmt')}
        className="mb-5"
      />

      <Card className="mb-5 !p-4">
        <PortalSearchBar
          placeholder={t('orders.searchPlaceholder')}
          preserveParams={['tab']}
        />
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : orders.length === 0 && search ? (
        <p className="text-sm text-[var(--text-secondary)]">
          {t('common.noSearchResults').replace('{query}', search)}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">{t('admin.orderEmptyTab')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('orders.orderNo'),
            t('checkout.dealerName'),
            t('orders.date'),
            t('orders.amount'),
            t('orders.status'),
            t('orders.track'),
          ]}
          rows={orders.map((order, i) => [
            i + 1,
            order.orderNo,
            order.dealer?.dealerName ?? '—',
            formatDate(order.createdAt),
            formatCurrency(Number(order.grandTotal)),
            <StatusBadge key={`${order.id}-status`} status={order.status} />,
            order.shipment?.trackingNo ?? '—',
          ])}
          actions={(index) => {
            const order = orders[index];
            if (activeTab !== 'pending' || order.status !== 'SUBMITTED') return null;
            return (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => approve(order.id)}>
                  {t('admin.approve')}
                </Button>
                <Button variant="outline" onClick={() => reject(order.id)}>
                  {t('admin.reject')}
                </Button>
              </div>
            );
          }}
        />
      )}
    </AdminPageBody>
  );
}
