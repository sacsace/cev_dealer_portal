'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ordersApi, type Order } from '@/lib/api';
import { loadPendingOrderCount } from '@/lib/order-events';
import {
  COURIER_OPTIONS,
  DELIVERY_STATUS_OPTIONS,
  normalizeDeliveryStatus,
  type DeliveryStatusKey,
} from '@/lib/delivery-status';
import {
  Button,
  DeliveryStatusBadge,
  Input,
  Select,
  StatusBadge,
  Textarea,
  useAlertDialog,
  useConfirmDialog,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';
import { OrderReviewHistory } from '@/components/order/order-review-history';

const SHIPMENT_EDITABLE_STATUSES = ['APPROVED', 'PACKED', 'ORDER_SHIPPED', 'DELIVERED'];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-[12px] font-medium text-[var(--text-tertiary)]">{label}</dt>
      <dd className="text-[13px] text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

export function OrderDetailDialog({
  orderId,
  onClose,
  onUpdated,
}: {
  orderId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { t, locale } = useI18n();
  const { alert, alertDialog } = useAlertDialog();
  const { confirm, confirmDialog } = useConfirmDialog();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [shipmentComment, setShipmentComment] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusKey>('PREPARING');

  const open = Boolean(orderId);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setRejectReason('');
      setShipmentComment('');
      return;
    }

    setLoading(true);
    ordersApi
      .get(orderId)
      .then((data) => {
        setOrder(data);
        const shipment = data.shipment;
        const normalized = normalizeDeliveryStatus(shipment?.deliveryStatus, data.status);
        setDeliveryStatus(normalized ?? 'PREPARING');
        setShipmentComment('');
        if (normalized === 'PREPARING') {
          setCourierName('');
          setTrackingNo('');
        } else {
          setCourierName(shipment?.courierName ?? '');
          setTrackingNo(shipment?.trackingNo ?? '');
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!open) return null;

  const canApproveReject = order?.status === 'SUBMITTED';
  const canEditShipment = order && SHIPMENT_EDITABLE_STATUSES.includes(order.status);

  async function handleApprove() {
    if (!order) return;
    setSaving(true);
    try {
      const updated = await ordersApi.approve(order.id);
      setOrder(updated);
      onUpdated();
      await loadPendingOrderCount().catch(() => {});
      await alert({ message: t('admin.orderApproved'), variant: 'success' });
    } catch (err) {
      await alert({
        message: err instanceof Error ? err.message : t('common.saveFailed'),
        variant: 'info',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!order) return;
    const reason = rejectReason.trim();
    if (!reason) {
      await alert({ message: t('admin.orderRejectReasonRequired'), variant: 'info' });
      return;
    }

    const ok = await confirm({
      title: t('admin.reject'),
      message: t('admin.orderRejectConfirm'),
      confirmLabel: t('admin.reject'),
      cancelLabel: t('common.cancel'),
      variant: 'danger',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const updated = await ordersApi.reject(order.id, reason);
      setOrder(updated);
      onUpdated();
      await loadPendingOrderCount().catch(() => {});
      await alert({ message: t('admin.orderRejected'), variant: 'success' });
    } catch (err) {
      await alert({
        message: err instanceof Error ? err.message : t('common.saveFailed'),
        variant: 'info',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveShipment() {
    if (!order) return;
    const isPreparing = deliveryStatus === 'PREPARING';

    if (isPreparing) {
      if (!shipmentComment.trim()) {
        await alert({ message: t('admin.orderShipmentCommentRequired'), variant: 'info' });
        return;
      }
    } else if (!courierName.trim() || !trackingNo.trim()) {
      await alert({ message: t('admin.orderShipmentFieldsRequired'), variant: 'info' });
      return;
    }

    setSaving(true);
    try {
      const updated = await ordersApi.updateShipment(order.id, {
        deliveryStatus,
        ...(isPreparing
          ? { note: shipmentComment.trim() }
          : { courierName: courierName.trim(), trackingNo: trackingNo.trim() }),
      });
      setOrder(updated);
      setShipmentComment('');
      onUpdated();
      await loadPendingOrderCount().catch(() => {});
      await alert({ message: t('admin.orderShipmentSaved'), variant: 'success' });
    } catch (err) {
      await alert({
        message: err instanceof Error ? err.message : t('common.saveFailed'),
        variant: 'info',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {alertDialog}
      {confirmDialog}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-detail-title"
          className="relative z-10 flex max-h-[min(92vh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
            <div className="min-w-0">
              <h2 id="order-detail-title" className="text-base font-semibold text-[var(--text-primary)]">
                {order?.orderNo ?? t('admin.orderDetail')}
              </h2>
              {order && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.status} />
                  {normalizeDeliveryStatus(order.shipment?.deliveryStatus, order.status) && (
                    <DeliveryStatusBadge
                      status={normalizeDeliveryStatus(order.shipment?.deliveryStatus, order.status)!}
                    />
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-black/[0.05]"
              aria-label={t('nav.closeMenu')}
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
            ) : !order ? (
              <p className="text-sm text-[var(--text-secondary)]">{t('common.saveFailed')}</p>
            ) : (
              <div className="space-y-6">
                <dl className="space-y-3">
                  <DetailRow label={t('checkout.dealerName')} value={order.dealer?.dealerName ?? '—'} />
                  <DetailRow label={t('orders.date')} value={formatDate(order.createdAt)} />
                  <DetailRow label={t('orders.amount')} value={formatCurrency(Number(order.grandTotal))} />
                  {order.contactPerson && (
                    <DetailRow label={t('checkout.contactPerson')} value={order.contactPerson} />
                  )}
                  {order.mobile && <DetailRow label={t('checkout.mobile')} value={order.mobile} />}
                  {order.email && <DetailRow label={t('checkout.email')} value={order.email} />}
                  {order.shippingAddress && (
                    <DetailRow label={t('checkout.shippingAddress')} value={order.shippingAddress} />
                  )}
                </dl>

                <div>
                  <h3 className="mb-3 text-[13px] font-semibold text-[var(--text-primary)]">
                    {t('checkout.orderSummary')}
                  </h3>
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            {t('parts.partNo')}
                          </th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            {t('parts.partName')}
                          </th>
                          <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            {t('cart.qty')}
                          </th>
                          <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                            {t('orders.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(order.items ?? []).map((item) => (
                          <tr key={item.partNumber} className="border-b border-[var(--border)] last:border-0">
                            <td className="px-3 py-2.5 text-[13px]">{item.partNumber}</td>
                            <td className="px-3 py-2.5 text-[13px]">{item.partName}</td>
                            <td className="px-3 py-2.5 text-right text-[13px]">{item.quantity}</td>
                            <td className="px-3 py-2.5 text-right text-[13px]">
                              {formatCurrency(Number(item.totalAmount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 space-y-1 text-[13px] text-[var(--text-secondary)]">
                    {order.subtotal != null && (
                      <p>
                        {t('cart.subtotal')}: {formatCurrency(Number(order.subtotal))}
                      </p>
                    )}
                    {order.gstAmount != null && (
                      <p>
                        {t('cart.gst')}: {formatCurrency(Number(order.gstAmount))}
                      </p>
                    )}
                    {order.freightCharge != null && Number(order.freightCharge) > 0 && (
                      <p>
                        {t('checkout.freightCharge')}: {formatCurrency(Number(order.freightCharge))}
                      </p>
                    )}
                  </div>
                </div>

                {canApproveReject && (
                  <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)]/50 p-4">
                    <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {t('admin.orderReview')}
                    </h3>
                    <Textarea
                      label={t('admin.orderRejectReason')}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t('admin.orderRejectReasonPlaceholder')}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleApprove} disabled={saving}>
                        {t('admin.approve')}
                      </Button>
                      <Button variant="outline" onClick={handleReject} disabled={saving}>
                        {t('admin.reject')}
                      </Button>
                    </div>
                  </div>
                )}

                {canEditShipment && (
                  <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] p-4">
                    <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
                      {t('admin.orderShipment')}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Select
                        label={t('admin.deliveryStatus')}
                        value={deliveryStatus}
                        onChange={(e) => {
                          const next = e.target.value as DeliveryStatusKey;
                          setDeliveryStatus(next);
                          if (next === 'PREPARING') {
                            setCourierName('');
                            setTrackingNo('');
                          } else {
                            setShipmentComment('');
                          }
                        }}
                      >
                        {DELIVERY_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {t(`deliveryStatus.${status}`)}
                          </option>
                        ))}
                      </Select>
                      {deliveryStatus === 'PREPARING' ? (
                        <div className="sm:col-span-2">
                          <Textarea
                            label={t('admin.orderShipmentComment')}
                            value={shipmentComment}
                            onChange={(e) => setShipmentComment(e.target.value)}
                            placeholder={t('admin.orderShipmentCommentPlaceholder')}
                          />
                        </div>
                      ) : (
                        <>
                          <Select
                            label={t('admin.courier')}
                            value={courierName}
                            onChange={(e) => setCourierName(e.target.value)}
                          >
                            <option value="">{t('admin.selectCourier')}</option>
                            {COURIER_OPTIONS.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </Select>
                          <div className="sm:col-span-2">
                            <Input
                              label={t('admin.trackingNo')}
                              value={trackingNo}
                              onChange={(e) => setTrackingNo(e.target.value)}
                              placeholder={t('admin.trackingNoPlaceholder')}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <Button onClick={handleSaveShipment} disabled={saving}>
                      {t('admin.saveShipment')}
                    </Button>
                  </div>
                )}

                <div className="space-y-4 border-t border-[var(--border)] pt-6">
                  <OrderReviewHistory
                    entries={order.reviewEntries ?? []}
                    locale={locale}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
