'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export const JOB_CARD_PROGRESS_STEPS = [
  'CREATED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
] as const;

type JobCardProgressStep = (typeof JOB_CARD_PROGRESS_STEPS)[number];

const STEP_LABEL_KEYS: Record<
  JobCardProgressStep,
  | 'admin.jobCardStageCreated'
  | 'admin.jobCardStageSubmitted'
  | 'admin.jobCardStageUnderReview'
  | 'admin.jobCardStageApproved'
> = {
  CREATED: 'admin.jobCardStageCreated',
  SUBMITTED: 'admin.jobCardStageSubmitted',
  UNDER_REVIEW: 'admin.jobCardStageUnderReview',
  APPROVED: 'admin.jobCardStageApproved',
};

function progressIndex(status: string): number {
  switch (status) {
    case 'CREATED':
      return 0;
    case 'SUBMITTED':
      return 1;
    case 'UNDER_REVIEW':
    case 'REJECTED':
      return 2;
    case 'APPROVED':
    case 'CLOSED':
      return 3;
    default:
      return 0;
  }
}

export function JobCardProgressStepper({ status }: { status: string }) {
  const { t } = useI18n();
  const activeIndex = progressIndex(status);
  const isRejected = status === 'REJECTED';

  return (
    <div className="space-y-3">
      <div className="delivery-progress" role="list" aria-label={t('admin.jobCardProgress')}>
        {JOB_CARD_PROGRESS_STEPS.map((step, index) => (
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
                index === activeIndex && !isRejected && 'delivery-progress__step--active',
                index === activeIndex && isRejected && 'delivery-progress__step--rejected',
              )}
            >
              {t(STEP_LABEL_KEYS[step])}
            </div>
          </div>
        ))}
      </div>
      {isRejected ? (
        <p className="text-[13px] font-medium text-[var(--danger)]">{t('admin.jobCardRejectedNotice')}</p>
      ) : null}
    </div>
  );
}
