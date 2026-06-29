'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getSession,
  jobCardsApi,
  lookupApi,
  refreshSession,
  resolveFileUrl,
  type JobCard,
  type JobCardFile,
  type JobCardType,
  type Fitment,
  type ProblemType,
  type VehicleModel,
  type ApiUser,
} from '@/lib/api';
import { loadJobCardCount } from '@/lib/job-card-events';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';
import { isValidVin, normalizeVin } from '@/lib/validation';
import { getDealerJobCardDefaults } from '@/lib/dealer-profile';
import { localizedLookupLabel } from '@/lib/lookup-label';

type FormState = {
  vin: string;
  carModelId: string;
  carModelName: string;
  fitment: string;
  gdmsNo: string;
  type: string;
  kilometers: string;
  customerName: string;
  mobile: string;
  place: string;
  checkedBy: string;
  typeOfProblem: string;
  jobType: string;
  registrationNumber: string;
  dateOfFitment: string;
  customerAddress: string;
  customerComplaint: string;
  notes: string;
  observation: string;
  rectification: string;
};

const emptyForm = (user?: ApiUser | null): FormState => {
  const defaults = getDealerJobCardDefaults(user ?? null);
  return {
    vin: '',
    carModelId: '',
    carModelName: '',
    fitment: '',
    gdmsNo: '',
    type: '',
    kilometers: '',
    customerName: defaults.customerName,
    mobile: defaults.mobile,
    place: defaults.place,
    checkedBy: '',
    typeOfProblem: '',
    jobType: '',
    registrationNumber: '',
    dateOfFitment: '',
    customerAddress: defaults.customerAddress,
    customerComplaint: '',
    notes: '',
    observation: '',
    rectification: '',
  };
};

function jobCardToForm(jobCard: JobCard): FormState {
  return {
    vin: jobCard.vin,
    carModelId: jobCard.carModelId ?? jobCard.carModel?.id ?? '',
    carModelName: jobCard.carModelName ?? jobCard.carModel?.modelName ?? '',
    fitment: jobCard.fitment ?? '',
    gdmsNo: jobCard.gdmsNo ?? '',
    type: jobCard.type ?? '',
    kilometers: jobCard.kilometers != null ? String(jobCard.kilometers) : '',
    customerName: jobCard.customerName,
    mobile: jobCard.mobile,
    place: jobCard.place ?? '',
    checkedBy: jobCard.checkedBy ?? '',
    typeOfProblem: jobCard.typeOfProblem ?? '',
    jobType: jobCard.jobType ?? '',
    registrationNumber: jobCard.registrationNumber ?? '',
    dateOfFitment: jobCard.dateOfFitment ? jobCard.dateOfFitment.slice(0, 10) : '',
    customerAddress: jobCard.customerAddress ?? '',
    customerComplaint: jobCard.customerComplaint ?? '',
    notes: jobCard.notes ?? '',
    observation: jobCard.observation ?? '',
    rectification: jobCard.rectification ?? '',
  };
}

function toPayload(form: FormState) {
  return {
    vin: normalizeVin(form.vin),
    carModelId: form.carModelId || undefined,
    carModelName: form.carModelName.trim() || undefined,
    fitment: form.fitment.trim() || undefined,
    gdmsNo: form.gdmsNo.trim() || undefined,
    type: form.type || undefined,
    kilometers: form.kilometers ? Number(form.kilometers) : undefined,
    customerName: form.customerName.trim(),
    mobile: form.mobile.trim(),
    place: form.place.trim() || undefined,
    checkedBy: form.checkedBy.trim() || undefined,
    typeOfProblem: form.typeOfProblem || undefined,
    jobType: form.jobType.trim() || undefined,
    registrationNumber: form.registrationNumber.trim() || undefined,
    dateOfFitment: form.dateOfFitment || undefined,
    customerAddress: form.customerAddress.trim() || undefined,
    customerComplaint: form.customerComplaint.trim() || undefined,
    notes: form.notes.trim() || undefined,
    observation: form.observation.trim() || undefined,
    rectification: form.rectification.trim() || undefined,
  };
}

function resolveCarModelFromLookup(
  models: VehicleModel[],
  lookup: { carModelId: string | null; carModelName: string | null },
): Pick<FormState, 'carModelId' | 'carModelName'> {
  if (lookup.carModelId) {
    const model = models.find((item) => item.id === lookup.carModelId);
    return {
      carModelId: lookup.carModelId,
      carModelName: model?.modelName ?? lookup.carModelName ?? '',
    };
  }

  if (lookup.carModelName) {
    const match = models.find(
      (item) => item.modelName.toLowerCase() === lookup.carModelName!.toLowerCase(),
    );
    if (match) {
      return { carModelId: match.id, carModelName: match.modelName };
    }
    return { carModelId: '', carModelName: lookup.carModelName };
  }

  return { carModelId: '', carModelName: '' };
}

function modelLabel(model: VehicleModel) {
  return model.year ? `${model.modelName} (${model.year})` : model.modelName;
}

export function JobCardForm({
  jobCard,
  onSaved,
  onCancel,
}: {
  jobCard?: JobCard | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t, locale } = useI18n();
  const isEdit = Boolean(jobCard);
  const [sessionUser, setSessionUser] = useState<ApiUser | null>(() => getSession());
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [jobCardTypes, setJobCardTypes] = useState<JobCardType[]>([]);
  const [fitments, setFitments] = useState<Fitment[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [form, setForm] = useState<FormState>(() =>
    jobCard ? jobCardToForm(jobCard) : emptyForm(getSession()),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<JobCardFile[]>(jobCard?.files ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialVinRef = useRef(jobCard?.vin ?? '');

  useEffect(() => {
    lookupApi.problemTypes().then(setProblemTypes).catch(() => {});
    lookupApi.jobCardTypes().then(setJobCardTypes).catch(() => {});
    lookupApi.fitments().then(setFitments).catch(() => {});
    lookupApi.models().then(setVehicleModels).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) return;

    refreshSession()
      .then((user) => {
        if (!user) return;
        setSessionUser(user);
        setForm((prev) => {
          const defaults = getDealerJobCardDefaults(user);
          return {
            ...prev,
            customerName: defaults.customerName,
            mobile: defaults.mobile,
            customerAddress: defaults.customerAddress,
            place: defaults.place,
          };
        });
      })
      .catch(() => {});
  }, [isEdit]);

  useEffect(() => {
    if (jobCard) {
      initialVinRef.current = jobCard.vin;
      setForm(jobCardToForm(jobCard));
      setUploadedFiles(jobCard.files ?? []);
      setPendingFiles([]);
      setPendingPreviews([]);
      setError('');
      return;
    }

    initialVinRef.current = '';
    const user = getSession();
    setSessionUser(user);
    setForm(emptyForm(user));
    setUploadedFiles([]);
    setPendingFiles([]);
    setPendingPreviews([]);
    setError('');
  }, [jobCard]);

  useEffect(() => {
    if (isEdit && form.vin === initialVinRef.current) return;

    if (!isValidVin(form.vin)) {
      if (!isEdit) {
        setForm((prev) => ({ ...prev, carModelId: '', carModelName: '' }));
      }
      return;
    }

    const vin = normalizeVin(form.vin);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      jobCardsApi
        .lookupByVin(vin)
        .then((lookup) => {
          if (cancelled) return;

          setForm((prev) => {
            if (normalizeVin(prev.vin) !== vin) return prev;

            if (!lookup.carModelId && !lookup.carModelName) {
              return isEdit ? prev : { ...prev, carModelId: '', carModelName: '' };
            }

            return { ...prev, ...resolveCarModelFromLookup(vehicleModels, lookup) };
          });
        })
        .catch(() => {});
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.vin, isEdit, vehicleModels]);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

  function update(field: keyof FormState, value: string) {
    const nextValue = field === 'vin' ? normalizeVin(value) : value;
    setForm((prev) => ({ ...prev, [field]: nextValue }));
  }

  function updateCarModel(modelId: string) {
    const model = vehicleModels.find((item) => item.id === modelId);
    setForm((prev) => ({
      ...prev,
      carModelId: modelId,
      carModelName: model?.modelName ?? '',
    }));
  }

  function problemLabel(item: ProblemType) {
    return localizedLookupLabel([item], item.name, locale) ?? item.name;
  }

  function typeLabel(item: JobCardType) {
    return localizedLookupLabel([item], item.name, locale) ?? item.name;
  }

  function fitmentLabel(item: Fitment) {
    return localizedLookupLabel([item], item.name, locale) ?? item.name;
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    setPendingFiles((prev) => [...prev, ...selected]);
    setPendingPreviews((prev) => [
      ...prev,
      ...selected.map((file) => URL.createObjectURL(file)),
    ]);
    e.target.value = '';
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPendingPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return next;
    });
  }

  async function removeUploadedFile(fileId: string) {
    if (!jobCard?.id) return;

    setLoading(true);
    setError('');
    try {
      await jobCardsApi.removeFile(jobCard.id, fileId);
      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('jobCard.uploadFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function uploadPendingFiles(jobCardId: string) {
    for (const file of pendingFiles) {
      await jobCardsApi.uploadFile(jobCardId, file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!isValidVin(form.vin)) {
      setError(t('jobCard.vinInvalid'));
      return;
    }

    if (!form.carModelId && !form.carModelName.trim()) {
      setError(t('jobCard.carModelRequired'));
      return;
    }

    setLoading(true);

    try {
      const payload = toPayload(form);
      let savedId = jobCard?.id;

      if (isEdit && jobCard) {
        await jobCardsApi.update(jobCard.id, payload);
      } else {
        const created = await jobCardsApi.create(payload);
        savedId = created.id;
      }

      if (savedId && pendingFiles.length > 0) {
        await uploadPendingFiles(savedId);
      }

      if (!isEdit) {
        await loadJobCardCount().catch(() => {});
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof FormState; label: string; required?: boolean; type?: string; hint?: string; maxLength?: number }[] = [
    { key: 'vin', label: t('jobCard.vin'), required: true, hint: t('jobCard.vinHint'), maxLength: 17 },
    { key: 'gdmsNo', label: t('jobCard.gdmsNo'), required: true },
    { key: 'kilometers', label: t('jobCard.kilometers'), required: true },
    { key: 'customerName', label: t('jobCard.customerName'), required: true },
    { key: 'mobile', label: t('jobCard.mobile'), required: true },
    { key: 'place', label: t('jobCard.place'), required: true },
    { key: 'checkedBy', label: t('jobCard.checkedBy'), required: true },
    { key: 'jobType', label: t('jobCard.jobType'), required: true },
    { key: 'registrationNumber', label: t('jobCard.registrationNumber'), required: true },
    { key: 'dateOfFitment', label: t('jobCard.dateOfFitment'), required: true, type: 'date' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sessionUser?.dealer?.dealerName && !isEdit && (
        <p className="text-[13px] text-[var(--text-secondary)]">{sessionUser.dealer.dealerName}</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => {
          if (field.key === 'vin') {
            return (
              <Input
                key={field.key}
                label={field.label}
                required={field.required}
                type={field.type ?? 'text'}
                maxLength={field.maxLength}
                value={form[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.hint}
              />
            );
          }

          if (field.key === 'gdmsNo') {
            return (
              <div key="car-model-row" className="contents">
                <Select
                  label={t('jobCard.carModel')}
                  required
                  value={form.carModelId}
                  onChange={(e) => updateCarModel(e.target.value)}
                >
                  <option value="">{t('jobCard.selectCarModel')}</option>
                  {vehicleModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {modelLabel(model)}
                    </option>
                  ))}
                </Select>
                <Input
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  type={field.type ?? 'text'}
                  maxLength={field.maxLength ?? (field.key === 'mobile' ? 10 : undefined)}
                  value={form[field.key]}
                  onChange={(e) => update(field.key, e.target.value)}
                  placeholder={field.hint}
                />
              </div>
            );
          }

          return (
            <Input
              key={field.key}
              label={field.label}
              required={field.required}
              type={field.type ?? 'text'}
              maxLength={field.maxLength ?? (field.key === 'mobile' ? 10 : undefined)}
              value={form[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder={field.hint}
            />
          );
        })}
        <Select
          label={t('jobCard.fitment')}
          required
          value={form.fitment}
          onChange={(e) => update('fitment', e.target.value)}
        >
          <option value="">{t('jobCard.selectFitment')}</option>
          {fitments.map((item) => (
            <option key={item.id} value={item.name}>
              {fitmentLabel(item)}
            </option>
          ))}
        </Select>
        <Select
          label={t('jobCard.type')}
          required
          value={form.type}
          onChange={(e) => update('type', e.target.value)}
        >
          <option value="">{t('jobCard.selectType')}</option>
          {jobCardTypes.map((item) => (
            <option key={item.id} value={item.name}>
              {typeLabel(item)}
            </option>
          ))}
        </Select>
        <Select
          label={t('jobCard.typeOfProblem')}
          required
          value={form.typeOfProblem}
          onChange={(e) => update('typeOfProblem', e.target.value)}
        >
          <option value="">{t('jobCard.selectTypeOfProblem')}</option>
          {problemTypes.map((item) => (
            <option key={item.id} value={item.name}>
              {problemLabel(item)}
            </option>
          ))}
        </Select>
        <div className="md:col-span-2 lg:col-span-3 grid gap-4 md:grid-cols-2">
          <Textarea
            label={t('jobCard.customerAddress')}
            value={form.customerAddress}
            onChange={(e) => update('customerAddress', e.target.value)}
          />
          <Textarea
            label={t('jobCard.customerComplaint')}
            value={form.customerComplaint}
            onChange={(e) => update('customerComplaint', e.target.value)}
          />
          <Textarea
            label={t('jobCard.notes')}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />
          <Textarea
            label={t('jobCard.observation')}
            value={form.observation}
            onChange={(e) => update('observation', e.target.value)}
          />
          <Textarea
            label={t('jobCard.rectification')}
            value={form.rectification}
            onChange={(e) => update('rectification', e.target.value)}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3 space-y-3 border-t border-[var(--border)] pt-4">
          <div>
            <p className="mb-1 text-[13px] font-medium text-[var(--text-primary)]">
              {t('jobCard.attachImages')}
            </p>
            <p className="text-[12px] text-[var(--text-secondary)]">{t('jobCard.imageHint')}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('jobCard.addImages')}
          </Button>

          {(uploadedFiles.length > 0 || pendingPreviews.length > 0) && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveFileUrl(file.fileUrl)}
                    alt={file.fileName}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                    disabled={loading}
                    onClick={() => removeUploadedFile(file.id)}
                  >
                    {t('jobCard.removeImage')}
                  </button>
                  <p className="truncate px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                    {file.fileName}
                  </p>
                </div>
              ))}
              {pendingPreviews.map((preview, index) => (
                <div
                  key={preview}
                  className="group relative overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt={pendingFiles[index]?.name ?? 'preview'}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                    disabled={loading}
                    onClick={() => removePendingFile(index)}
                  >
                    {t('jobCard.removeImage')}
                  </button>
                  <p className="truncate px-2 py-1 text-[11px] text-[var(--text-secondary)]">
                    {pendingFiles[index]?.name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="portal-alert portal-alert--error">{error}</p>}

      <div className="portal-form-actions border-t border-[var(--border)] pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('jobCard.backToList')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
