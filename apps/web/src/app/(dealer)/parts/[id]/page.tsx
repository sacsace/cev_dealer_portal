'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { cartApi, partsApi, type Part } from '@/lib/api';
import { Button, Card, PageTitle, useAlertDialog } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function PartDetailPage() {
  const { t } = useI18n();
  const { alert, alertDialog } = useAlertDialog();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [part, setPart] = useState<Part | null>(null);
  const [qty, setQty] = useState(1);

  const backHref = (() => {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const modelId = searchParams.get('modelId');
    const categoryId = searchParams.get('categoryId');
    if (search) params.set('search', search);
    if (modelId) params.set('modelId', modelId);
    if (categoryId) params.set('categoryId', categoryId);
    const qs = params.toString();
    return qs ? `/parts?${qs}` : '/parts';
  })();

  useEffect(() => {
    if (id) partsApi.get(id).then(setPart).catch(() => {});
  }, [id]);

  if (!part) return <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>;

  async function addToCart() {
    await cartApi.addItem(part!.id, qty);
    await alert({ message: t('common.addedToCart'), variant: 'success' });
  }

  const rows = [
    [t('parts.partNo'), part.partNumber],
    [t('parts.category'), part.category?.name ?? '—'],
    [t('parts.mrp'), formatCurrency(Number(part.mrp))],
    [t('parts.dealerPrice'), formatCurrency(Number(part.dealerPrice))],
    [t('parts.gst'), `${part.gstRate}%`],
    [t('parts.stock'), String(part.stockQuantity)],
    [t('parts.minOrderQty'), String(part.minimumOrderQty)],
    [t('parts.warranty'), part.warrantyAvailable ? t('common.yes') : t('common.no')],
  ];

  return (
    <div>
      {alertDialog}
      <div className="mb-4">
        <Link
          href={backHref}
          className="inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
      </div>
      <PageTitle title={part.partName} subtitle={part.partNumber} />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <div className="flex h-72 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
            {t('parts.partImage')}
          </div>
        </Card>
        <Card className="space-y-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[var(--border)] pb-3 last:border-0">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className={`font-medium ${label === t('parts.dealerPrice') ? 'text-lg text-[var(--accent)]' : ''}`}>{value}</span>
            </div>
          ))}
          {part.description && (
            <p className="pt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{part.description}</p>
          )}
          <div className="flex items-center gap-3 pt-4">
            <input
              type="number"
              min={part.minimumOrderQty}
              value={qty}
              onChange={(e) => setQty(+e.target.value)}
              className="apple-input w-20"
            />
            <Button onClick={addToCart} disabled={part.stockQuantity <= 0}>
              {t('parts.addToCart')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
