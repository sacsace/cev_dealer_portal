'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cartApi, partsApi, type Part } from '@/lib/api';
import { getPartImageUrl } from '@/lib/part-image';
import { Button, useAlertDialog } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

function DetailRow({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-3 last:border-0">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span
        className={cn(
          'text-right text-[13px] font-medium text-[var(--text-primary)]',
          highlight && 'text-base text-[var(--accent)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PartDetailDialog({
  partId,
  onClose,
}: {
  partId: string | null;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const { alert, alertDialog } = useAlertDialog();
  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  const open = Boolean(partId);

  useEffect(() => {
    if (!partId) {
      setPart(null);
      setQty(1);
      return;
    }

    setLoading(true);
    partsApi
      .get(partId)
      .then((data) => {
        setPart(data);
        setQty(data.minimumOrderQty > 0 ? data.minimumOrderQty : 1);
      })
      .catch(() => setPart(null))
      .finally(() => setLoading(false));
  }, [partId]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  async function addToCart() {
    if (!part) return;
    await cartApi.addItem(part.id, qty);
    await alert({ message: t('common.addedToCart'), variant: 'success' });
  }

  const inStock = part ? part.stockQuantity > 0 : false;
  const imageUrl = part ? getPartImageUrl(part) : null;

  return (
    <>
      {alertDialog}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="part-detail-title"
          className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
            <div className="min-w-0">
              <h2 id="part-detail-title" className="text-base font-semibold text-[var(--text-primary)]">
                {part?.partName ?? t('parts.detail')}
              </h2>
              {part && (
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{part.partNumber}</p>
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
            ) : !part ? (
              <p className="text-sm text-[var(--text-secondary)]">{t('common.saveFailed')}</p>
            ) : (
              <div className="space-y-5">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt={part.partName} className="h-full w-full object-cover" />
                  ) : (
                    part.partNumber
                  )}
                </div>

                <div>
                  <DetailRow label={t('parts.category')} value={part.category?.name ?? '—'} />
                  <DetailRow label={t('parts.mrp')} value={formatCurrency(Number(part.mrp))} />
                  <DetailRow
                    label={t('parts.dealerPrice')}
                    value={formatCurrency(Number(part.dealerPrice))}
                    highlight
                  />
                  <DetailRow label={t('parts.gst')} value={`${part.gstRate}%`} />
                  <DetailRow label={t('parts.stock')} value={String(part.stockQuantity)} />
                  <DetailRow label={t('parts.minOrderQty')} value={String(part.minimumOrderQty)} />
                  <DetailRow
                    label={t('parts.warranty')}
                    value={part.warrantyAvailable ? t('common.yes') : t('common.no')}
                  />
                </div>

                {part.description && (
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{part.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
                  <input
                    type="number"
                    min={part.minimumOrderQty}
                    value={qty}
                    onChange={(e) => setQty(+e.target.value)}
                    className="apple-input w-24"
                    aria-label={t('cart.qty')}
                  />
                  <Button onClick={addToCart} disabled={!inStock}>
                    {t('parts.addToCart')}
                  </Button>
                  <span
                    className={cn(
                      'parts-stock-badge',
                      inStock ? 'parts-stock-badge--available' : 'parts-stock-badge--out',
                    )}
                  >
                    {inStock ? t('common.available') : t('common.outOfStock')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
