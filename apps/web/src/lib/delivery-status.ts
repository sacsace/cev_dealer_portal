export type DeliveryStatusKey = 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED';

export const DELIVERY_STATUS_OPTIONS: DeliveryStatusKey[] = ['PREPARING', 'IN_TRANSIT', 'DELIVERED'];

export const COURIER_OPTIONS = [
  'Blue Dart',
  'DTDC',
  'Delhivery',
  'FedEx',
  'Ekart',
  'Shadowfax',
  'India Post',
];

export function normalizeDeliveryStatus(
  deliveryStatus?: string | null,
  orderStatus?: string,
): DeliveryStatusKey | null {
  const normalized = deliveryStatus?.trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'PREPARING') return 'PREPARING';
  if (normalized === 'IN_TRANSIT') return 'IN_TRANSIT';
  if (normalized === 'DELIVERED') return 'DELIVERED';

  if (deliveryStatus === 'In Transit') return 'IN_TRANSIT';

  if (orderStatus === 'PACKED') return 'PREPARING';
  if (orderStatus === 'ORDER_SHIPPED') return 'IN_TRANSIT';
  if (orderStatus === 'DELIVERED') return 'DELIVERED';

  return null;
}
