'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

type LookupTypeEntity = {
  id: string;
  name: string;
  nameEn?: string | null;
  sortOrder: number;
  status: string;
};

type LookupTypePayload = {
  name: string;
  nameEn?: string;
  sortOrder?: number;
  status?: string;
};

type LookupTypeApi = {
  create: (data: LookupTypePayload) => Promise<unknown>;
  update: (id: string, data: LookupTypePayload) => Promise<unknown>;
};

type FormState = {
  name: string;
  nameEn: string;
  sortOrder: string;
  status: string;
};

export type LookupTypeFormLabels = {
  name: string;
  nameEn: string;
  namePlaceholder: string;
  nameEnPlaceholder: string;
};

const emptyForm = (): FormState => ({
  name: '',
  nameEn: '',
  sortOrder: '0',
  status: 'ACTIVE',
});

function itemToForm(item: LookupTypeEntity): FormState {
  return {
    name: item.name,
    nameEn: item.nameEn ?? '',
    sortOrder: String(item.sortOrder ?? 0),
    status: item.status,
  };
}

export function LookupTypeForm({
  item,
  api,
  labels,
  onSaved,
  onCancel,
}: {
  item?: LookupTypeEntity | null;
  api: LookupTypeApi;
  labels: LookupTypeFormLabels;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(item);
  const [form, setForm] = useState<FormState>(item ? itemToForm(item) : emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(item ? itemToForm(item) : emptyForm());
    setError('');
  }, [item]);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: LookupTypePayload = {
        name: form.name.trim(),
        nameEn: form.nameEn.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        status: form.status,
      };

      if (isEdit && item) {
        await api.update(item.id, payload);
      } else {
        await api.create(payload);
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
          label={t(labels.name)}
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder={t(labels.namePlaceholder)}
        />
        <Input
          label={t(labels.nameEn)}
          value={form.nameEn}
          onChange={(e) => update('nameEn', e.target.value)}
          placeholder={t(labels.nameEnPlaceholder)}
        />
        <Input
          label={t('admin.sortOrder')}
          type="number"
          min={0}
          value={form.sortOrder}
          onChange={(e) => update('sortOrder', e.target.value)}
        />
        <Select label={t('orders.status')} value={form.status} onChange={(e) => update('status', e.target.value)}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}

      <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4 portal-form-actions">
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
