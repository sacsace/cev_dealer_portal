'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ordersApi, type Order } from '@/lib/api';
import { DeliveryProgressStepper } from '@/components/dealer/delivery-progress-stepper';
import { Button, Card, DataTable, DealerOrderStageBadge, PageTitle } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';
import { OrderReviewHistory } from '@/components/order/order-review-history';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-[12px] font-medium text-[var(--text-tertiary)]">{label}</dt>
      <dd className="break-words text-[13px] text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

export default function DealerOrderDetailPage() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const backHref = (() => {
    const search = searchParams.get('search');
    return search ? `/orders?search=${encodeURIComponent(search)}` : '/orders';
  })();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    ordersApi
      .get(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>;
  }

  if (!order) {
    return <p className="text-sm text-[var(--text-secondary)]">{t('common.saveFailed')}</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
      </div>

      <PageTitle title={order.orderNo} subtitle={t('orders.detailSubtitle')} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <DealerOrderStageBadge
          orderStatus={order.status}
          deliveryStatus={order.shipment?.deliveryStatus}
        />
      </div>

      <Card className="mb-6 !p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          {t('orders.deliveryProgress')}
        </h2>
        <DeliveryProgressStepper
          orderStatus={order.status}
          deliveryStatus={order.shipment?.deliveryStatus}
        />
        {order.shipment?.courierName || order.shipment?.trackingNo ? (
          <dl className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
            {order.shipment.courierName ? (
              <DetailRow label={t('orders.courier')} value={order.shipment.courierName} />
            ) : null}
            {order.shipment.trackingNo ? (
              <DetailRow label={t('orders.trackingNo')} value={order.shipment.trackingNo} />
            ) : null}
          </dl>
        ) : null}
      </Card>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card className="!p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
            {t('orders.orderInfo')}
          </h2>
          <dl className="space-y-3">
            <DetailRow label={t('orders.date')} value={formatDate(order.createdAt)} />
            <DetailRow label={t('orders.amount')} value={formatCurrency(Number(order.grandTotal))} />
            {order.contactPerson ? (
              <DetailRow label={t('checkout.contactPerson')} value={order.contactPerson} />
            ) : null}
            {order.mobile ? <DetailRow label={t('checkout.mobile')} value={order.mobile} /> : null}
            {order.email ? <DetailRow label={t('checkout.email')} value={order.email} /> : null}
            {order.shippingAddress ? (
              <DetailRow label={t('checkout.shippingAddress')} value={order.shippingAddress} />
            ) : null}
          </dl>
        </Card>

        <Card className="!p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
            {t('checkout.orderSummary')}
          </h2>
          <dl className="space-y-2 text-[13px] text-[var(--text-secondary)]">
            {order.subtotal != null ? (
              <div className="flex justify-between gap-4">
                <span>{t('cart.subtotal')}</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(Number(order.subtotal))}</span>
              </div>
            ) : null}
            {order.gstAmount != null ? (
              <div className="flex justify-between gap-4">
                <span>{t('cart.gst')}</span>
                <span className="text-[var(--text-primary)]">{formatCurrency(Number(order.gstAmount))}</span>
              </div>
            ) : null}
            {order.freightCharge != null && Number(order.freightCharge) > 0 ? (
              <div className="flex justify-between gap-4">
                <span>{t('checkout.freightCharge')}</span>
                <span className="text-[var(--text-primary)]">
                  {formatCurrency(Number(order.freightCharge))}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-[var(--border)] pt-2 font-semibold text-[var(--text-primary)]">
              <span>{t('cart.grandTotal')}</span>
              <span>{formatCurrency(Number(order.grandTotal))}</span>
            </div>
          </dl>
          {order.invoice ? (
            <div className="mt-5 border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-[12px] text-[var(--text-tertiary)]">{t('orders.proformaInvoice')}</p>
              <p className="mb-3 break-all text-[13px] text-[var(--text-primary)]">{order.invoice.invoiceNo}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => ordersApi.downloadProformaInvoice(order.id).catch(() => undefined)}
              >
                {t('orders.downloadProforma')}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t('checkout.orderSummary')}</h2>
        </div>
        <DataTable
          columns={[t('parts.partNo'), t('parts.partName'), t('cart.qty'), t('orders.amount')]}
          rows={order.items.map((item) => [
            item.partNumber,
            item.partName,
            item.quantity,
            formatCurrency(Number(item.totalAmount)),
          ])}
        />
      </Card>

      {(order.reviewEntries?.length ?? 0) > 0 ? (
        <Card className="mt-6 !p-5">
          <OrderReviewHistory entries={order.reviewEntries ?? []} locale={locale} forDealer />
        </Card>
      ) : null}
    </div>
  );
}
