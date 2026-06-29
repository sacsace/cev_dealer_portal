import { ordersApi } from '@/lib/api';

export const PENDING_ORDERS_UPDATED_EVENT = 'cev:pending-orders-updated';

export function notifyPendingOrdersUpdated(total: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PENDING_ORDERS_UPDATED_EVENT, { detail: { total } }));
}

export async function loadPendingOrderCount() {
  const res = await ordersApi.list({ limit: '1', page: '1', pendingDelivery: 'true' });
  const total = res.meta.total ?? 0;
  notifyPendingOrdersUpdated(total);
  return total;
}
