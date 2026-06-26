'use client';

import { useEffect, useState } from 'react';
import {
  vehicleModelsApi,
  type CreateVehicleModelPayload,
  type UpdateVehicleModelPayload,
  type VehicleModel,
} from '@/lib/api';
import { Button, Input, Select } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

const MODEL_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

type FormState = {
  modelName: string;
  modelCode: string;
  year: string;
  status: string;
};

const emptyForm = (): FormState => ({
  modelName: '',
  modelCode: '',
  year: '',
  status: 'ACTIVE',
});

function modelToForm(model: VehicleModel): FormState {
  return {
    modelName: model.modelName,
    modelCode: model.modelCode,
    year: model.year ?? '',
    status: model.status ?? 'ACTIVE',
  };
}

export function VehicleModelForm({
  model,
  onSaved,
  onCancel,
}: {
  model?: VehicleModel | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(model);
  const [form, setForm] = useState<FormState>(model ? modelToForm(model) : emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(model ? modelToForm(model) : emptyForm());
    setError('');
  }, [model]);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit && model) {
        const payload: UpdateVehicleModelPayload = {
          modelName: form.modelName.trim(),
          modelCode: form.modelCode.trim(),
          year: form.year.trim() || undefined,
          status: form.status,
        };
        await vehicleModelsApi.update(model.id, payload);
      } else {
        const payload: CreateVehicleModelPayload = {
          modelName: form.modelName.trim(),
          modelCode: form.modelCode.trim().toUpperCase(),
          year: form.year.trim() || undefined,
          status: form.status,
        };
        await vehicleModelsApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={t('admin.modelName')}
          required
          value={form.modelName}
          onChange={(e) => update('modelName', e.target.value)}
          placeholder={t('admin.modelNamePlaceholder')}
        />
        <Input
          label={t('admin.modelCode')}
          required
          value={form.modelCode}
          disabled={isEdit}
          onChange={(e) => update('modelCode', e.target.value.toUpperCase())}
          placeholder={t('admin.modelCodePlaceholder')}
        />
        <Input
          label={t('admin.modelYear')}
          value={form.year}
          onChange={(e) => update('year', e.target.value)}
          placeholder="2024"
        />
        <Select label={t('orders.status')} value={form.status} onChange={(e) => update('status', e.target.value)}>
          {MODEL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('common.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
