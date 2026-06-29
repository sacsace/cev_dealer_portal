'use client';

import { ChevronRight } from 'lucide-react';
import {
  DEALER_ORDER_STAGES,
  dealerOrderStageIndex,
  getDealerOrderStage,
  type DealerOrderStage,
} from '@/lib/dealer-order-stage';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

const STAGE_LABEL_KEYS: Record<DealerOrderStage, 'orders.stageConfirmation' | 'orders.stagePreparing' | 'orders.stageCompleted'> = {
  CONFIRMATION: 'orders.stageConfirmation',
  PREPARING: 'orders.stagePreparing',
  COMPLETED: 'orders.stageCompleted',
};

export function DeliveryProgressStepper({
  orderStatus,
  deliveryStatus,
}: {
  orderStatus: string;
  deliveryStatus?: string | null;
}) {
  const { t } = useI18n();
  const stage = getDealerOrderStage(orderStatus, deliveryStatus);
  const activeIndex = dealerOrderStageIndex(stage);

  return (
    <div className="delivery-progress" role="list" aria-label={t('orders.deliveryProgress')}>
      {DEALER_ORDER_STAGES.map((step, index) => (
        <div key={step} className="flex min-w-0 items-center" role="listitem">
          {index > 0 ? (
            <ChevronRight
              className={cn(
                'delivery-progress__arrow mx-1.5 h-4 w-4 shrink-0',
                index <= activeIndex ? 'text-[var(--cev-green)]' : 'text-[var(--text-tertiary)]',
              )}
              strokeWidth={2}
              aria-hidden
            />
          ) : null}
          <div
            className={cn(
              'delivery-progress__step',
              index < activeIndex && 'delivery-progress__step--done',
              index === activeIndex && 'delivery-progress__step--active',
            )}
          >
            {t(STAGE_LABEL_KEYS[step])}
          </div>
        </div>
      ))}
    </div>
  );
}
