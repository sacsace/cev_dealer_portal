import { normalizeDeliveryStatus } from '@/lib/delivery-status';

export type DealerOrderStage = 'CONFIRMATION' | 'PREPARING' | 'COMPLETED';

export const DEALER_ORDER_STAGES: DealerOrderStage[] = ['CONFIRMATION', 'PREPARING', 'COMPLETED'];

export function getDealerOrderStage(
  orderStatus: string,
  deliveryStatus?: string | null,
): DealerOrderStage {
  const delivery = normalizeDeliveryStatus(deliveryStatus, orderStatus);

  if (orderStatus === 'DELIVERED' || delivery === 'DELIVERED') {
    return 'COMPLETED';
  }

  if (
    orderStatus === 'PACKED' ||
    orderStatus === 'ORDER_SHIPPED' ||
    delivery === 'PREPARING' ||
    delivery === 'IN_TRANSIT'
  ) {
    return 'PREPARING';
  }

  return 'CONFIRMATION';
}

export function dealerOrderStageIndex(stage: DealerOrderStage) {
  return DEALER_ORDER_STAGES.indexOf(stage);
}
