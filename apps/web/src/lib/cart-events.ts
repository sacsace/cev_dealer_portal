export const CART_UPDATED_EVENT = 'cev:cart-updated';

export function notifyCartUpdated(itemCount: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { itemCount } }));
}
