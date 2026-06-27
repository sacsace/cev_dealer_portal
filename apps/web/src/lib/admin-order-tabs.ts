/** Admin order management tabs (query param: `tab`). */
export const ADMIN_ORDER_TABS = [
  { key: 'history', labelKey: 'admin.orderTabHistory' },
  { key: 'delivery', labelKey: 'admin.orderTabDelivery' },
  { key: 'pending', labelKey: 'admin.orderTabPending' },
] as const;

export type AdminOrderTabKey = (typeof ADMIN_ORDER_TABS)[number]['key'];

export const DEFAULT_ADMIN_ORDER_TAB: AdminOrderTabKey = 'history';

export const DELIVERY_ORDER_STATUSES = ['PACKED', 'ORDER_SHIPPED', 'DELIVERED'] as const;

export function isAdminOrderTabKey(value: string | null | undefined): value is AdminOrderTabKey {
  return ADMIN_ORDER_TABS.some((tab) => tab.key === value);
}
