export type JobCardListTab = 'active' | 'completed';

export const ACTIVE_JOB_CARD_STATUSES = ['CREATED', 'SUBMITTED', 'UNDER_REVIEW'] as const;
export const COMPLETED_JOB_CARD_STATUSES = ['APPROVED', 'REJECTED', 'CLOSED'] as const;

export function isCompletedJobCardStatus(status: string): boolean {
  return (COMPLETED_JOB_CARD_STATUSES as readonly string[]).includes(status);
}

export function jobCardListTabForStatus(status: string): JobCardListTab {
  return isCompletedJobCardStatus(status) ? 'completed' : 'active';
}

export function parseJobCardListTab(value: string | null | undefined): JobCardListTab {
  return value === 'completed' ? 'completed' : 'active';
}

export function buildJobCardListHref(path: string, tab: JobCardListTab, search?: string) {
  const params = new URLSearchParams();
  if (tab === 'completed') params.set('tab', 'completed');
  if (search) params.set('search', search);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
