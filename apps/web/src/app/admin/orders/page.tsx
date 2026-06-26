'use client';

import { useCallback, useEffect, useState } from 'react';
import { ordersApi, type Order } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge } from '@/components/ui';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminOrdersPage() {
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.list({ limit: '50' });
      setOrders(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    await ordersApi.approve(id);
    load();
  }

  async function reject(id: string) {
    await ordersApi.reject(id);
    load();
  }

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.orderMgmt')} subtitle={t('admin.orderSubtitle')} />
      <AdminSearchBar onSearch={() => load()} placeholder={t('admin.refreshList')} />
      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('orders.orderNo'),
            t('checkout.dealerName'),
            t('orders.date'),
            t('orders.amount'),
            t('orders.status'),
          ]}
          rows={orders.map((o, i) => [
            i + 1,
            o.orderNo,
            o.dealer?.dealerName ?? '—',
            formatDate(o.createdAt),
            formatCurrency(Number(o.grandTotal)),
            <StatusBadge key={o.id} status={o.status} />,
          ])}
          actions={(index) => {
            const order = orders[index];
            if (order.status !== 'SUBMITTED') return null;
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
