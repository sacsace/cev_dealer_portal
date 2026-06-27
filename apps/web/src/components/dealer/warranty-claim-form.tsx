'use client';

import { useEffect, useState } from 'react';
import { warrantyClaimsApi, type WarrantyClaim } from '@/lib/api';
import { Button, Input, Textarea } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

type FormState = {
  warrantyClaimDate: string;
  invoiceNo: string;
  jobCardNo: string;
  vin: string;
  carModelName: string;
  partNumber: string;
  partName: string;
  quantity: string;
  claimAmount: string;
  reasonForClaim: string;
  problemDescription: string;
  place: string;
};

const emptyForm = (): FormState => ({
  warrantyClaimDate: new Date().toISOString().slice(0, 10),
  invoiceNo: '',
  jobCardNo: '',
  vin: '',
  carModelName: '',
  partNumber: '',
  partName: '',
  quantity: '1',
  claimAmount: '',
  reasonForClaim: '',
  problemDescription: '',
  place: '',
});

function claimToForm(claim: WarrantyClaim): FormState {
  return {
    warrantyClaimDate: claim.warrantyClaimDate.slice(0, 10),
    invoiceNo: claim.invoiceNo,
    jobCardNo: claim.jobCardNo ?? '',
    vin: claim.vin ?? '',
    carModelName: claim.carModelName ?? '',
    partNumber: claim.partNumber ?? '',
    partName: claim.partName ?? '',
    quantity: String(claim.quantity ?? 1),
    claimAmount: claim.claimAmount != null ? String(claim.claimAmount) : '',
    reasonForClaim: claim.reasonForClaim ?? '',
    problemDescription: claim.problemDescription ?? '',
    place: claim.place ?? '',
  };
}

function toPayload(form: FormState) {
  return {
    warrantyClaimDate: form.warrantyClaimDate,
    invoiceNo: form.invoiceNo.trim(),
    jobCardNo: form.jobCardNo.trim() || undefined,
    vin: form.vin.trim() || undefined,
    carModelName: form.carModelName.trim() || undefined,
    partNumber: form.partNumber.trim() || undefined,
    partName: form.partName.trim() || undefined,
    quantity: Number(form.quantity) || 1,
    claimAmount: form.claimAmount ? Number(form.claimAmount) : undefined,
    reasonForClaim: form.reasonForClaim.trim() || undefined,
    problemDescription: form.problemDescription.trim() || undefined,
    place: form.place.trim() || undefined,
  };
}

export function WarrantyClaimForm({
  claim,
  onSaved,
  onCancel,
}: {
  claim?: WarrantyClaim | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(claim);
  const readOnly = isEdit && claim?.status !== 'DRAFT';
  const [form, setForm] = useState<FormState>(claim ? claimToForm(claim) : emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(claim ? claimToForm(claim) : emptyForm());
    setError('');
  }, [claim]);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function save(submit = false) {
    setError('');
    setLoading(true);

    try {
      const payload = toPayload(form);
      if (isEdit && claim) {
        payload.warrantyClaimDate = claim.warrantyClaimDate.slice(0, 10);
      } else {
        payload.warrantyClaimDate = new Date().toISOString().slice(0, 10);
      }
      let saved: WarrantyClaim;

      if (isEdit && claim) {
        saved = await warrantyClaimsApi.update(claim.id, payload);
      } else {
        saved = await warrantyClaimsApi.create(payload);
      }

      if (submit) {
        await warrantyClaimsApi.submit(saved.id);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {readOnly && (
        <p className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-[13px] text-[var(--text-secondary)]">
          {t('warranty.readOnlyHint')}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Input
          label={t('warranty.date')}
          type="date"
          required
          disabled
          value={form.warrantyClaimDate}
        />
        <Input
          label={t('warranty.invoiceNo')}
          required
          disabled={readOnly}
          value={form.invoiceNo}
          onChange={(e) => update('invoiceNo', e.target.value)}
        />
        <Input
          label={t('warranty.jobCardNo')}
          disabled={readOnly}
          value={form.jobCardNo}
          onChange={(e) => update('jobCardNo', e.target.value)}
        />
        <Input
          label={t('warranty.vin')}
          disabled={readOnly}
          value={form.vin}
          onChange={(e) => update('vin', e.target.value)}
        />
        <Input
          label={t('warranty.carModel')}
          disabled={readOnly}
          value={form.carModelName}
          onChange={(e) => update('carModelName', e.target.value)}
        />
        <Input
          label={t('warranty.partNumber')}
          disabled={readOnly}
          value={form.partNumber}
          onChange={(e) => update('partNumber', e.target.value)}
        />
        <Input
          label={t('warranty.partName')}
          disabled={readOnly}
          value={form.partName}
          onChange={(e) => update('partName', e.target.value)}
        />
        <Input
          label={t('warranty.quantity')}
          type="number"
          min={1}
          disabled={readOnly}
          value={form.quantity}
          onChange={(e) => update('quantity', e.target.value)}
        />
        <Input
          label={t('warranty.claimAmount')}
          type="number"
          disabled={readOnly}
          value={form.claimAmount}
          onChange={(e) => update('claimAmount', e.target.value)}
        />
        <Input
          label={t('warranty.place')}
          required
          disabled={readOnly}
          value={form.place}
          onChange={(e) => update('place', e.target.value)}
        />
        <div className="md:col-span-2 lg:col-span-3 space-y-4">
          <Textarea
            label={t('warranty.reason')}
            disabled={readOnly}
            value={form.reasonForClaim}
            onChange={(e) => update('reasonForClaim', e.target.value)}
          />
          <Textarea
            label={t('warranty.problemDescription')}
            disabled={readOnly}
            value={form.problemDescription}
            onChange={(e) => update('problemDescription', e.target.value)}
          />
        </div>
      </div>

      {error && <p className="portal-alert portal-alert--error">{error}</p>}

      <div className="portal-form-actions border-t border-[var(--border)] pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('warranty.backToList')}
        </Button>
        {!readOnly && (
          <>
            <Button type="button" disabled={loading} onClick={() => save(false)}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
            <Button type="button" disabled={loading} onClick={() => save(true)}>
              {loading ? t('common.loading') : t('warranty.submitClaim')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
