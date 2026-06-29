'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi, ordersApi, getSession } from '@/lib/api';
import { notifyCartUpdated } from '@/lib/cart-events';
import { Button, Card, Input, PageTitle, useAlertDialog } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export default function CheckoutPage() {
  const { t } = useI18n();
  const { alert, alertDialog } = useAlertDialog();
  const router = useRouter();
  const user = getSession();
  const [cart, setCart] = useState<Awaited<ReturnType<typeof cartApi.get>> | null>(null);
  const [form, setForm] = useState({
    billingAddress: '',
    shippingAddress: '',
    contactPerson: '',
    mobile: '',
    email: user?.dealer?.email ?? user?.email ?? '',
    freightCharge: 0,
  });

  useEffect(() => {
    cartApi.get().then(setCart).catch(() => router.push('/cart'));
  }, [router]);

  async function placeOrder() {
    const order = await ordersApi.create(form);
    try {
      await ordersApi.downloadProformaInvoice(order.id);
    } catch {
      // Order succeeded even if PDF download fails in the browser.
    }
    await alert({ message: t('common.orderPlaced'), variant: 'success' });
    notifyCartUpdated(0);
    router.push('/orders');
  }

  if (!cart) return <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>;

  return (
    <div>
      {alertDialog}
      <PageTitle title={t('checkout.title')} subtitle={t('checkout.subtitle')} />
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="space-y-4">
          <Input label={t('checkout.dealerName')} value={user?.dealer?.dealerName ?? ''} readOnly />
          <Input label={t('checkout.dealerCode')} value={user?.dealer?.dealerCode ?? ''} readOnly />
          <Input label={t('checkout.billingAddress')} value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} />
          <Input label={t('checkout.shippingAddress')} value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} />
          <Input label={t('checkout.contactPerson')} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <Input label={t('checkout.mobile')} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} maxLength={10} />
          <Input label={t('checkout.email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Card>
        <Card>
          <h3 className="mb-4 text-lg font-semibold tracking-tight">{t('checkout.orderSummary')}</h3>
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between border-b border-[var(--border)] py-3 text-sm last:border-0">
              <span className="text-[var(--text-secondary)]">{item.part.partName} × {item.quantity}</span>
              <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
            </div>
          ))}
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{t('cart.subtotal')}</span><span>{formatCurrency(cart.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)]">{t('cart.gst')}</span><span>{formatCurrency(cart.gstAmount)}</span></div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-semibold">
              <span>{t('cart.grandTotal')}</span><span>{formatCurrency(cart.grandTotal)}</span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => router.push('/cart')}>{t('common.backToCart')}</Button>
            <Button onClick={placeOrder}>{t('common.placeOrder')}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
