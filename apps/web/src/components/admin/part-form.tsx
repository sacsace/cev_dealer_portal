'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  lookupApi,
  partsApi,
  resolveFileUrl,
  type Category,
  type Part,
  type PartImage,
  type UpdatePartPayload,
  type VehicleModel,
} from '@/lib/api';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

const PART_STATUSES = ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED', 'COMING_SOON'] as const;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

type FormState = {
  partNumber: string;
  partName: string;
  categoryId: string;
  description: string;
  mrp: string;
  dealerPrice: string;
  gstRate: string;
  stockQuantity: string;
  minimumOrderQty: string;
  warrantyAvailable: boolean;
  status: string;
  modelIds: string[];
};

const emptyForm = (): FormState => ({
  partNumber: '',
  partName: '',
  categoryId: '',
  description: '',
  mrp: '',
  dealerPrice: '',
  gstRate: '18',
  stockQuantity: '0',
  minimumOrderQty: '1',
  warrantyAvailable: false,
  status: 'AVAILABLE',
  modelIds: [],
});

function partToForm(part: Part): FormState {
  return {
    partNumber: part.partNumber,
    partName: part.partName,
    categoryId: part.categoryId ?? part.category?.id ?? '',
    description: part.description ?? '',
    mrp: String(part.mrp),
    dealerPrice: String(part.dealerPrice),
    gstRate: String(part.gstRate ?? 18),
    stockQuantity: String(part.stockQuantity ?? 0),
    minimumOrderQty: String(part.minimumOrderQty ?? 1),
    warrantyAvailable: part.warrantyAvailable ?? false,
    status: part.status,
    modelIds: part.modelMappings?.map((mapping) => mapping.modelId || mapping.model.id) ?? [],
  };
}

export function PartForm({
  part,
  onSaved,
  onCancel,
}: {
  part?: Part | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(part);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [form, setForm] = useState<FormState>(part ? partToForm(part) : emptyForm());
  const [uploadedImages, setUploadedImages] = useState<PartImage[]>(part?.images ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([lookupApi.categories(), lookupApi.models()])
      .then(([cats, mods]) => {
        setCategories(cats);
        setModels(mods);
        if (!part && cats[0]) {
          setForm((prev) => ({ ...prev, categoryId: prev.categoryId || cats[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLookups(false));
  }, [part]);

  useEffect(() => {
    setForm(part ? partToForm(part) : emptyForm());
    setUploadedImages(part?.images ?? []);
    setPendingFiles([]);
    setPendingPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setError('');
  }, [part]);

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviews]);

  function update(field: keyof FormState, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleModel(modelId: string) {
    setForm((prev) => ({
      ...prev,
      modelIds: prev.modelIds.includes(modelId)
        ? prev.modelIds.filter((id) => id !== modelId)
        : [...prev.modelIds, modelId],
    }));
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

  async function removeUploadedImage(imageId: string) {
    if (!part?.id) return;

    setLoading(true);
    setError('');
    try {
      await partsApi.removeImage(part.id, imageId);
      setUploadedImages((prev) => prev.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('parts.uploadFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function uploadPendingFiles(partId: string) {
    for (const file of pendingFiles) {
      const image = await partsApi.uploadImage(partId, file);
      setUploadedImages((prev) => [...prev, image]);
    }
    setPendingFiles([]);
    setPendingPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.categoryId) {
      setError(t('admin.noCatalogHint'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        partName: form.partName.trim(),
        categoryId: form.categoryId,
        description: form.description.trim() || undefined,
        mrp: Number(form.mrp),
        dealerPrice: Number(form.dealerPrice),
        gstRate: Number(form.gstRate),
        stockQuantity: Number(form.stockQuantity),
        minimumOrderQty: Number(form.minimumOrderQty),
        warrantyAvailable: form.warrantyAvailable,
        status: form.status,
        modelIds: form.modelIds,
      };

      let savedId = part?.id;

      if (isEdit && part) {
        await partsApi.update(part.id, payload as UpdatePartPayload);
      } else {
        const created = await partsApi.create({
          partNumber: form.partNumber.trim(),
          ...payload,
        });
        savedId = created.id;
      }

      if (savedId && pendingFiles.length > 0) {
        await uploadPendingFiles(savedId);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (loadingLookups) {
    return <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>;
  }

  if (categories.length === 0) {
    return (
      <div>
        <p className="text-[13px] text-[var(--text-secondary)]">{t('admin.noCatalogHint')}</p>
        <Button className="mt-4" type="button" onClick={() => router.push('/admin/catalog/new')}>
          {t('admin.catalogRegister')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={t('parts.partNo')}
          required
          disabled={isEdit}
          value={form.partNumber}
          onChange={(e) => update('partNumber', e.target.value)}
        />
        <Input
          label={t('parts.partName')}
          required
          value={form.partName}
          onChange={(e) => update('partName', e.target.value)}
        />
        <Select
          label={t('admin.selectCatalog')}
          required
          value={form.categoryId}
          onChange={(e) => update('categoryId', e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
        <Select label={t('orders.status')} value={form.status} onChange={(e) => update('status', e.target.value)}>
          {PART_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
            </option>
          ))}
        </Select>
        <Input
          label={t('parts.mrp')}
          required
          type="number"
          min="0"
          step="0.01"
          value={form.mrp}
          onChange={(e) => update('mrp', e.target.value)}
        />
        <Input
          label={t('parts.dealerPrice')}
          required
          type="number"
          min="0"
          step="0.01"
          value={form.dealerPrice}
          onChange={(e) => update('dealerPrice', e.target.value)}
        />
        <Input
          label={t('parts.gst')}
          type="number"
          min="0"
          step="0.01"
          value={form.gstRate}
          onChange={(e) => update('gstRate', e.target.value)}
        />
        <Input
          label={t('parts.stock')}
          type="number"
          min="0"
          value={form.stockQuantity}
          onChange={(e) => update('stockQuantity', e.target.value)}
        />
        <Input
          label={t('parts.minOrderQty')}
          type="number"
          min="1"
          value={form.minimumOrderQty}
          onChange={(e) => update('minimumOrderQty', e.target.value)}
        />
        <label className="flex items-center gap-2 pt-6 text-[13px]">
          <input
            type="checkbox"
            checked={form.warrantyAvailable}
            onChange={(e) => update('warrantyAvailable', e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border-strong)]"
          />
          {t('parts.warranty')}
        </label>
      </div>

      <div className="space-y-3 border-t border-[var(--border)] pt-4">
        <div>
          <p className="mb-1 text-[13px] font-medium text-[var(--text-primary)]">{t('parts.partImage')}</p>
          <p className="text-[12px] text-[var(--text-secondary)]">{t('parts.imageHint')}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
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
          {t('parts.addImages')}
        </Button>

        {(uploadedImages.length > 0 || pendingPreviews.length > 0) && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resolveFileUrl(image.url)}
                  alt={form.partName || form.partNumber}
                  className="aspect-square w-full object-cover"
                />
                {isEdit ? (
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                    disabled={loading}
                    onClick={() => removeUploadedImage(image.id)}
                  >
                    {t('parts.removeImage')}
                  </button>
                ) : null}
              </div>
            ))}
            {pendingPreviews.map((preview, index) => (
              <div
                key={preview}
                className="group relative overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                  disabled={loading}
                  onClick={() => removePendingFile(index)}
                >
                  {t('parts.removeImage')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Textarea
        label={t('parts.description')}
        value={form.description}
        onChange={(e) => update('description', e.target.value)}
        rows={3}
      />

      {models.length > 0 && (
        <fieldset>
          <legend className="mb-2 block text-[13px] font-medium text-[var(--text-primary)]">
            {t('parts.compatibleModels')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {models.map((model) => (
              <label
                key={model.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] hover:bg-[var(--bg-secondary)]"
              >
                <input
                  type="checkbox"
                  checked={form.modelIds.includes(model.id)}
                  onChange={() => toggleModel(model.id)}
                  className="h-3.5 w-3.5"
                />
                {model.modelName}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && <p className="portal-alert portal-alert--error">{error}</p>}

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
