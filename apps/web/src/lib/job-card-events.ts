import { jobCardsApi } from '@/lib/api';

export const JOB_CARDS_UPDATED_EVENT = 'cev:job-cards-updated';

export function notifyJobCardsUpdated(total: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(JOB_CARDS_UPDATED_EVENT, { detail: { total } }));
}

export async function loadJobCardCount() {
  const res = await jobCardsApi.list({ limit: '1', page: '1' });
  const total = res.meta.total ?? 0;
  notifyJobCardsUpdated(total);
  return total;
}
