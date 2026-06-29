'use client';

import { useEffect, useRef, useState } from 'react';
import { jobCardsApi, resolveFileUrl, type JobCard, type JobCardReviewEntry } from '@/lib/api';
import { Button, Card, Select, Textarea, JobCardStatusBadge } from '@/components/ui';
import { JobCardProgressStepper } from '@/components/admin/job-card-progress-stepper';
import { formatDate } from '@/lib/utils';
import { localizedLookupLabel, useLookupCatalog } from '@/lib/lookup-label';
import { useI18n } from '@/components/providers/i18n-provider';

const ADMIN_STATUSES = [
  'CREATED',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLOSED',
] as const;

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[12px] font-medium text-[var(--text-tertiary)]">{label}</dt>
      <dd className="whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-[13px] text-[var(--text-primary)]">
        {value || '—'}
      </dd>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-medium text-[var(--text-primary)]">{label}</p>
      <div className="h-32 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)]/60 px-3 py-2.5 text-[13px] text-[var(--text-primary)]">
        {value?.trim() ? value : '—'}
      </div>
    </div>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function ReviewHistory({
  entries,
  locale,
}: {
  entries: JobCardReviewEntry[];
  locale: string;
}) {
  const { t } = useI18n();

  return (
    <>
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          {t('admin.jobCardReviewHistory')}
        </h3>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {t('admin.jobCardReviewHistoryHint')}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-white/70 px-4 py-8 text-center text-[13px] text-[var(--text-secondary)]">
          {t('admin.jobCardNoReviewHistory')}
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
                        {t('admin.jobCardAdminObservation')}
                      </p>
                      <p className="whitespace-pre-wrap text-[13px] text-[var(--text-secondary)]">
                        {entry.observation}
                      </p>
                    </div>
                  ) : null}

                  {entry.rectification?.trim() ? (
                    <div className="rounded-[var(--radius-md)] bg-[var(--bg-secondary)]/70 px-3 py-2.5">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                        {t('admin.jobCardAdminRectification')}
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

export function AdminJobCardDetail({
  jobCard,
  onUpdated,
  onCancel,
}: {
  jobCard: JobCard;
  onUpdated: (updated: JobCard) => void;
  onCancel: () => void;
}) {
  const { t, locale } = useI18n();
  const { problemTypes, jobCardTypes, fitments } = useLookupCatalog();
  const submittedRef = useRef(jobCard);
  const [status, setStatus] = useState(jobCard.status);
  const [observation, setObservation] = useState('');
  const [rectification, setRectification] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const submitted = submittedRef.current;

  useEffect(() => {
    if (submittedRef.current.id !== jobCard.id) {
      submittedRef.current = jobCard;
    }
    setStatus(jobCard.status);
    setObservation('');
    setRectification('');
  }, [jobCard]);

  async function saveReview(nextStatus?: string, options?: { redirect?: boolean }) {
    setSaving(true);
    setError('');
    setSaveNotice('');
    try {
      const payload: {
        status: string;
        observation?: string;
        rectification?: string;
      } = { status: nextStatus ?? status };
      if (observation.trim()) payload.observation = observation.trim();
      if (rectification.trim()) payload.rectification = rectification.trim();

      const updated = await jobCardsApi.review(jobCard.id, payload);
      setStatus(updated.status);
      setObservation('');
      setRectification('');
      onUpdated(updated);

      if (options?.redirect) {
        setSaveNotice(t('common.saved'));
        window.setTimeout(() => onCancel(), 1000);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  const canQuickReview = ['CREATED', 'SUBMITTED', 'UNDER_REVIEW'].includes(status);

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
              {t('admin.jobCardProgress')}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              {jobCard.jobCardNo} · {formatDate(jobCard.jobCardDate)}
            </p>
          </div>
          <JobCardStatusBadge status={status} />
        </div>
        <JobCardProgressStepper status={status} />
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {t('admin.jobCardSubmittedInfo')}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {t('admin.jobCardSubmittedInfoHint')}
          </p>
        </div>

        <dl className="grid gap-3 md:grid-cols-2">
          <DetailRow label={t('checkout.dealerName')} value={submitted.dealer?.dealerName} />
          <DetailRow label={t('jobCard.vin')} value={submitted.vin} />
          <DetailRow label={t('jobCard.carModel')} value={submitted.carModelName ?? submitted.carModel?.modelName} />
          <DetailRow label={t('jobCard.gdmsNo')} value={submitted.gdmsNo} />
          <DetailRow
            label={t('jobCard.fitment')}
            value={localizedLookupLabel(fitments, submitted.fitment, locale)}
          />
          <DetailRow
            label={t('jobCard.type')}
            value={localizedLookupLabel(jobCardTypes, submitted.type, locale)}
          />
          <DetailRow
            label={t('jobCard.kilometers')}
            value={submitted.kilometers != null ? String(submitted.kilometers) : null}
          />
          <DetailRow label={t('jobCard.customerName')} value={submitted.customerName} />
          <DetailRow label={t('jobCard.mobile')} value={submitted.mobile} />
          <DetailRow label={t('jobCard.place')} value={submitted.place} />
          <DetailRow label={t('jobCard.checkedBy')} value={submitted.checkedBy} />
          <DetailRow
            label={t('jobCard.typeOfProblem')}
            value={localizedLookupLabel(problemTypes, submitted.typeOfProblem, locale)}
          />
          <DetailRow label={t('jobCard.jobType')} value={submitted.jobType} />
          <DetailRow label={t('jobCard.registrationNumber')} value={submitted.registrationNumber} />
          <DetailRow
            label={t('jobCard.dateOfFitment')}
            value={submitted.dateOfFitment ? formatDate(submitted.dateOfFitment) : null}
          />
        </dl>

        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label={t('jobCard.customerAddress')} value={submitted.customerAddress} />
          <ReadOnlyField label={t('jobCard.customerComplaint')} value={submitted.customerComplaint} />
          <ReadOnlyField label={t('jobCard.notes')} value={submitted.notes} />
          <ReadOnlyField label={t('jobCard.observation')} value={submitted.observation} />
          <ReadOnlyField label={t('jobCard.rectification')} value={submitted.rectification} />
        </div>

        {submitted.files && submitted.files.length > 0 ? (
          <div>
            <p className="mb-3 text-[13px] font-medium text-[var(--text-primary)]">{t('jobCard.attachImages')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {submitted.files.map((file) => (
                <div
                  key={file.id}
                  className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveFileUrl(file.fileUrl)}
                    alt={file.fileName}
                    className="aspect-square w-full object-cover"
                  />
                  <p className="truncate px-2 py-1 text-[11px] text-[var(--text-secondary)]">{file.fileName}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {t('admin.jobCardReview')}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('admin.jobCardReviewHint')}</p>
        </div>

        <div className="space-y-4 bg-white px-5 py-5">
          <Select label={t('orders.status')} value={status} onChange={(e) => setStatus(e.target.value)}>
            {ADMIN_STATUSES.map((item) => (
              <option key={item} value={item}>
                {t(`jobCardStatus.${item}`) !== `jobCardStatus.${item}`
                  ? t(`jobCardStatus.${item}`)
                  : t(`status.${item}`)}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 lg:grid-cols-2">
            <Textarea
              label={t('admin.jobCardAdminObservation')}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder={t('admin.jobCardAdminObservationPlaceholder')}
              className="h-32 resize-none overflow-y-auto"
            />
            <Textarea
              label={t('admin.jobCardAdminRectification')}
              value={rectification}
              onChange={(e) => setRectification(e.target.value)}
              placeholder={t('admin.jobCardAdminRectificationPlaceholder')}
              className="h-32 resize-none overflow-y-auto"
            />
          </div>

          {canQuickReview ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={saving} onClick={() => saveReview('APPROVED')}>
                {t('admin.approve')}
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => saveReview('REJECTED')}>
                {t('admin.reject')}
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={() => saveReview('UNDER_REVIEW')}>
                {t('admin.jobCardMarkUnderReview')}
              </Button>
            </div>
          ) : null}

          {error ? <p className="portal-alert portal-alert--error">{error}</p> : null}
          {saveNotice ? <p className="portal-alert portal-alert--success">{saveNotice}</p> : null}

          <div className="portal-form-actions border-t border-[var(--border)] pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              {t('jobCard.backToList')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void saveReview(undefined, { redirect: true })}>
              {saving ? t('common.loading') : t('admin.jobCardSaveReview')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 overflow-hidden bg-[var(--bg-secondary)]/45 p-5">
        <ReviewHistory entries={jobCard.reviewEntries ?? []} locale={locale} />
      </Card>
    </div>
  );
}
