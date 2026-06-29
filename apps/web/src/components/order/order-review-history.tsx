'use client';

import { DeliveryStatusBadge, StatusBadge } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';
import type { OrderReviewEntry } from '@/lib/api';
import { normalizeDeliveryStatus } from '@/lib/delivery-status';

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function actionLabelKey(action: string) {
  if (action === 'APPROVED' || action === 'REJECTED' || action === 'SHIPMENT_UPDATED') {
    return `orderReviewAction.${action}`;
  }
  return null;
}

export function OrderReviewHistory({
  entries,
  locale,
  forDealer = false,
}: {
  entries: OrderReviewEntry[];
  locale: string;
  forDealer?: boolean;
}) {
  const { t } = useI18n();

  const title = forDealer ? t('orders.reviewHistory') : t('admin.orderReviewHistory');
  const hint = forDealer ? t('orders.reviewHistoryHint') : t('admin.orderReviewHistoryHint');
  const empty = forDealer ? t('orders.noReviewHistory') : t('admin.orderNoReviewHistory');
  const rejectReasonLabel = forDealer ? t('orders.rejectReason') : t('admin.orderReviewRejectReason');
  const commentLabel = forDealer ? t('orders.shipmentComment') : t('admin.orderReviewComment');

  return (
    <>
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{hint}</p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-[13px] text-[var(--text-secondary)]">
          {empty}
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => {
            const actionKey = actionLabelKey(entry.action);
            const deliveryKey = normalizeDeliveryStatus(entry.deliveryStatus, entry.status ?? undefined);

            return (
              <li
                key={entry.id}
                className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]"
              >
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 bg-[var(--text-primary)]/15"
                />

                <div className="mb-3 flex flex-wrap items-start justify-between gap-2 pl-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)]">{entry.authorName}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{entry.authorRole}</p>
                  </div>
                  <time className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] text-[var(--text-tertiary)]">
                    {formatDateTime(entry.createdAt, locale)}
                  </time>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2 pl-2">
                  {actionKey ? (
                    <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-primary)]">
                      {t(actionKey)}
                    </span>
                  ) : null}
                  {entry.status ? <StatusBadge status={entry.status} /> : null}
                  {deliveryKey ? <DeliveryStatusBadge status={deliveryKey} /> : null}
                </div>

                {(entry.courierName?.trim() ||
                  entry.trackingNo?.trim() ||
                  entry.note?.trim()) && (
                  <div className="space-y-2 pl-2">
                    {entry.courierName?.trim() ? (
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">{t('admin.courier')}:</span>{' '}
                        {entry.courierName}
                      </p>
                    ) : null}
                    {entry.trackingNo?.trim() ? (
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        <span className="font-medium text-[var(--text-primary)]">{t('admin.trackingNo')}:</span>{' '}
                        {entry.trackingNo}
                      </p>
                    ) : null}
                    {entry.note?.trim() ? (
                      <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)]/70 px-3 py-2.5">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                          {entry.action === 'REJECTED' ? rejectReasonLabel : commentLabel}
                        </p>
                        <p className="whitespace-pre-wrap text-[13px] text-[var(--text-secondary)]">
                          {entry.note}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
