'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cartApi, type CartResponse } from '@/lib/api';
import { Button, Card, DataTable, PageTitle, useAlertDialog } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

function formatApiError(error: unknown, fallback: string, unreachable: string) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return unreachable;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function CartQuantityInput({
  itemId,
  quantity,
  minQty,
  disabled,
  onCommit,
  onError,
}: {
  itemId: string;
  quantity: number;
  minQty: number;
  disabled?: boolean;
  onCommit: (itemId: string, nextQty: number) => Promise<void>;
  onError: (message: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity, itemId]);

  async function commitValue(raw: string) {
    const next = Number.parseInt(raw, 10);
    if (!Number.isFinite(next) || next < minQty) {
      setDraft(String(quantity));
      await onError(t('cart.invalidQty').replace('{min}', String(minQty)));
      return;
    }
    if (next === quantity) return;

    try {
      await onCommit(itemId, next);
    } catch (error) {
      setDraft(String(quantity));
      await onError(
        formatApiError(error, t('common.saveFailed'), t('common.apiUnreachable')),
      );
    }
  }

  return (
    <input
      type="number"
      min={minQty}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commitValue(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      className="apple-input mx-auto w-16"
    />
  );
}

export default function CartPage() {
  const { t } = useI18n();
  const { alert, alertDialog } = useAlertDialog();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  async function loadCart() {
    const data = await cartApi.get();
    setCart(data);
  }

  useEffect(() => {
    loadCart().catch(async (error) => {
      await alert({
        message: formatApiError(error, t('common.saveFailed'), t('common.apiUnreachable')),
        variant: 'error',
      });
    });
  }, [alert, t]);

  async function updateQuantity(itemId: string, nextQty: number) {
    setBusyItemId(itemId);
    try {
      await cartApi.updateItem(itemId, nextQty);
      await loadCart();
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeCartItem(itemId: string) {
    setBusyItemId(itemId);
    try {
      await cartApi.removeItem(itemId);
      await loadCart();
    } catch (error) {
      await alert({
        message: formatApiError(error, t('common.saveFailed'), t('common.apiUnreachable')),
        variant: 'error',
      });
    } finally {
      setBusyItemId(null);
    }
  }

  if (!cart) return <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>;

  const isEmpty = cart.items.length === 0;

  return (
    <div>
      {alertDialog}
      <PageTitle title={t('cart.title')} subtitle={t('cart.subtitle')} />

      <div className="cart-page-layout">
        <Card className="cart-page-table min-w-0 p-0">
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
              <CartQuantityInput
                key={item.id}
                itemId={item.id}
                quantity={item.quantity}
                minQty={item.part.minimumOrderQty ?? 1}
                disabled={busyItemId === item.id}
                onCommit={updateQuantity}
                onError={(message) => alert({ message, variant: 'error' })}
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
                  disabled={busyItemId === item.id}
                  onClick={() => void removeCartItem(item.id)}
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
