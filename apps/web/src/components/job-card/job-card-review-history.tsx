'use client';

import { JobCardStatusBadge } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';
import type { JobCardReviewEntry } from '@/lib/api';

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function JobCardReviewHistory({
  entries,
  locale,
  forDealer = false,
}: {
  entries: JobCardReviewEntry[];
  locale: string;
  forDealer?: boolean;
}) {
  const { t } = useI18n();

  const title = forDealer ? t('jobCard.reviewHistory') : t('admin.jobCardReviewHistory');
  const hint = forDealer ? t('jobCard.reviewHistoryHint') : t('admin.jobCardReviewHistoryHint');
  const empty = forDealer ? t('jobCard.noReviewHistory') : t('admin.jobCardNoReviewHistory');
  const observationLabel = forDealer
    ? t('jobCard.reviewObservation')
    : t('admin.jobCardAdminObservation');
  const rectificationLabel = forDealer
    ? t('jobCard.reviewRectification')
    : t('admin.jobCardAdminRectification');

  return (
    <>
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{hint}</p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-[13px] text-[var(--text-secondary)]">
          {empty}
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]"
            >
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-1 bg-[var(--text-primary)]/15"
              />

              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 pl-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)]">{entry.authorName}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{entry.authorRole}</p>
                </div>
                <time className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] text-[var(--text-tertiary)]">
                  {formatDateTime(entry.createdAt, locale)}
                </time>
              </div>

              {entry.status ? (
                <div className="mb-3 pl-2">
                  <JobCardStatusBadge status={entry.status} />
                </div>
              ) : null}

              {(entry.observation?.trim() || entry.rectification?.trim()) && (
                <div className="space-y-2 pl-2">
                  {entry.observation?.trim() ? (
                    <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)]/70 px-3 py-2.5">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                        {observationLabel}
                      </p>
                      <p className="whitespace-pre-wrap text-[13px] text-[var(--text-secondary)]">
                        {entry.observation}
                      </p>
                    </div>
                  ) : null}

                  {entry.rectification?.trim() ? (
                    <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)]/70 px-3 py-2.5">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                        {rectificationLabel}
                      </p>
                      <p className="whitespace-pre-wrap text-[13px] text-[var(--text-secondary)]">
                        {entry.rectification}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
