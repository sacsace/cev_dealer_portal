'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cartApi, type CartResponse } from '@/lib/api';
import { Button, Card, DataTable, PageTitle } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function CartPage() {
  const { t } = useI18n();
  const [cart, setCart] = useState<CartResponse | null>(null);

  async function loadCart() {
    const data = await cartApi.get();
    setCart(data);
  }

  useEffect(() => {
    loadCart().catch(() => {});
  }, []);

  if (!cart) return <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>;

  const isEmpty = cart.items.length === 0;

  return (
    <div>
      <PageTitle title={t('cart.title')} subtitle={t('cart.subtitle')} />

      <div className="cart-page-layout">
        <Card className="cart-page-table min-w-0 overflow-hidden p-0">
          <DataTable
            columns={[
              t('parts.partNo'),
              t('parts.partName'),
              t('cart.qty'),
              t('cart.unitPrice'),
              t('cart.gst'),
              t('cart.total'),
            ]}
            rows={cart.items.map((item) => [
              item.part.partNumber,
              item.part.partName,
              <input
                key={item.id}
                type="number"
                min={1}
                value={item.quantity}
                onChange={async (e) => {
                  await cartApi.updateItem(item.id, +e.target.value);
                  loadCart();
                }}
                className="apple-input mx-auto w-16"
              />,
              formatCurrency(item.unitPrice),
              formatCurrency(item.gstAmount),
              formatCurrency(item.totalAmount),
            ])}
            actions={(index) => {
              const item = cart.items[index];
              if (!item) return null;

              return (
                <Button
                  variant="danger"
                  onClick={async () => {
                    await cartApi.removeItem(item.id);
                    loadCart();
                  }}
                >
                  {t('common.remove')}
                </Button>
              );
            }}
          />
        </Card>

        <Card className="cart-summary-card space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{t('cart.subtotal')}</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-secondary)]">{t('cart.gst')}</span>
            <span>{formatCurrency(cart.gstAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-semibold">
            <span>{t('cart.grandTotal')}</span>
            <span>{formatCurrency(cart.grandTotal)}</span>
          </div>
          {isEmpty ? (
            <Button className="mt-2 w-full" disabled>
              {t('cart.checkout')}
            </Button>
          ) : (
            <Link href="/checkout">
              <Button className="mt-2 w-full">{t('cart.checkout')}</Button>
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
