'use client';

import { useEffect, useState } from 'react';
import { categoriesApi, type Category } from '@/lib/api';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;

type FormState = {
  name: string;
  description: string;
  status: string;
};

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  status: 'ACTIVE',
});

function itemToForm(item: Category): FormState {
  return {
    name: item.name,
    description: item.description ?? '',
    status: item.status ?? 'ACTIVE',
  };
}

export function CategoryForm({
  item,
  onSaved,
  onCancel,
}: {
  item?: Category | null;
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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
      };

      if (isEdit && item) {
        await categoriesApi.update(item.id, payload);
      } else {
        await categoriesApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-[min(60vh,520px)] flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          label={t('admin.catalogName')}
          required
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder={t('parts.category')}
        />
        {isEdit && (
          <Select label={t('orders.status')} value={form.status} onChange={(e) => update('status', e.target.value)}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <Textarea
          label={t('admin.catalogDescription')}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={12}
          className="min-h-[220px] flex-1"
        />
      </div>

      {error && <p className="portal-alert portal-alert--error">{error}</p>}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
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
