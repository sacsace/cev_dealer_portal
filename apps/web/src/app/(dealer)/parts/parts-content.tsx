'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cartApi, lookupApi, partsApi, type Part, type Category, type VehicleModel } from '@/lib/api';
import { Button, Card, DataTable, Input, PageTitle, Select, useAlertDialog } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';
import { PartDetailDialog } from '@/components/dealer/part-detail-dialog';

function StockBadge({ inStock, label }: { inStock: boolean; label: string }) {
  return (
    <span className={cn('parts-stock-badge', inStock ? 'parts-stock-badge--available' : 'parts-stock-badge--out')}>
      {label}
    </span>
  );
}

function PartCard({
  part,
  onAddToCart,
  onOpenDetail,
  detailLabel,
  cartLabel,
  availableLabel,
  outOfStockLabel,
}: {
  part: Part;
  onAddToCart: (partId: string) => void;
  onOpenDetail: (partId: string) => void;
  detailLabel: string;
  cartLabel: string;
  availableLabel: string;
  outOfStockLabel: string;
}) {
  const inStock = part.stockQuantity > 0;

  return (
    <Card
      hover
      className="parts-card parts-card--clickable"
      onClick={() => onOpenDetail(part.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(part.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${part.partName} ${detailLabel}`}
    >
      <div className="parts-card-media">
        <span className="parts-card-media-code">{part.partNumber}</span>
      </div>
      <h3 className="parts-card-name">{part.partName}</h3>
      <p className="parts-card-category">{part.category?.name ?? '—'}</p>
      <div className="parts-card-meta">
        <span className="parts-card-price">{formatCurrency(Number(part.dealerPrice))}</span>
        <StockBadge inStock={inStock} label={inStock ? availableLabel : outOfStockLabel} />
      </div>
      <div className="parts-card-actions" onClick={(e) => e.stopPropagation()}>
        <Button type="button" variant="outline" className="w-full" onClick={() => onOpenDetail(part.id)}>
          {detailLabel}
        </Button>
        <Button type="button" className="w-full" onClick={() => onAddToCart(part.id)} disabled={!inStock}>
          {cartLabel}
        </Button>
      </div>
    </Card>
  );
}

export default function PartsPageContent() {
  const { t } = useI18n();
  const { alert, alertDialog } = useAlertDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [parts, setParts] = useState<Part[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [modelId, setModelId] = useState(searchParams.get('modelId') ?? '');
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') ?? '');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

  const hasActiveFilters = Boolean(
    searchParams.get('search') || searchParams.get('modelId') || searchParams.get('categoryId'),
  );

  async function loadParts(params: Record<string, string> = {}) {
    setLoading(true);
    try {
      const res = await partsApi.search(params);
      setParts(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    lookupApi.models().then(setModels).catch(() => {});
    lookupApi.categories().then(setCategories).catch(() => {});
    const params: Record<string, string> = {};
    if (searchParams.get('modelId')) params.modelId = searchParams.get('modelId')!;
    if (searchParams.get('categoryId')) params.categoryId = searchParams.get('categoryId')!;
    if (searchParams.get('search')) {
      params.search = searchParams.get('search')!;
      setSearch(params.search);
    } else {
      setSearch('');
    }
    setModelId(searchParams.get('modelId') ?? '');
    setCategoryId(searchParams.get('categoryId') ?? '');
    loadParts(params);
  }, [searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (modelId) params.set('modelId', modelId);
    if (categoryId) params.set('categoryId', categoryId);
    const qs = params.toString();
    router.push(qs ? `/parts?${qs}` : '/parts');
  }

  function clearFilters() {
    setSearch('');
    setModelId('');
    setCategoryId('');
    router.push('/parts');
  }

  async function addToCart(partId: string) {
    await cartApi.addItem(partId, 1);
    await alert({ message: t('common.addedToCart'), variant: 'success' });
  }

  function openPartDetail(partId: string) {
    setSelectedPartId(partId);
  }

  const emptyMessage =
    searchParams.get('search')
      ? t('common.noSearchResults').replace('{query}', searchParams.get('search')!)
      : t('parts.noFilterResults');

  return (
    <div className="w-full min-w-0">
      {alertDialog}
      <PartDetailDialog partId={selectedPartId} onClose={() => setSelectedPartId(null)} />
      <div className="parts-page-shell">
        <div className="parts-page-heading">
          <PageTitle title={t('parts.title')} subtitle={t('parts.subtitle')} className="mb-0" />
        </div>

        <Card className="parts-filter-card">
          <h3 className="parts-filter-title">{t('common.filters')}</h3>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input label={t('common.keyword')} value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select label={t('parts.model')} value={modelId} onChange={(e) => setModelId(e.target.value)}>
              <option value="">{t('common.allModels')}</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.modelName}
                </option>
              ))}
            </Select>
            <Select label={t('parts.category')} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">{t('common.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="grid gap-2 pt-1">
              <Button type="submit" className="w-full">
                {t('common.search')}
              </Button>
              {hasActiveFilters && (
                <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="parts-results-column min-w-0">
          <div className="parts-results-toolbar">
            <p className="parts-results-count">
              {loading ? t('common.loading') : t('parts.resultCount').replace('{count}', String(parts.length))}
            </p>
            <div className="parts-view-toggle" role="tablist" aria-label={t('parts.title')}>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'grid'}
                className={cn('parts-view-toggle-btn', view === 'grid' && 'parts-view-toggle-btn--active')}
                onClick={() => setView('grid')}
              >
                {t('common.grid')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'list'}
                className={cn('parts-view-toggle-btn', view === 'list' && 'parts-view-toggle-btn--active')}
                onClick={() => setView('list')}
              >
                {t('common.list')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="parts-empty-state">{t('common.loading')}</div>
          ) : parts.length === 0 && hasActiveFilters ? (
            <div className="parts-empty-state">{emptyMessage}</div>
          ) : view === 'grid' ? (
            <div className="parts-grid">
              {parts.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  onAddToCart={addToCart}
                  onOpenDetail={openPartDetail}
                  detailLabel={t('parts.detail')}
                  cartLabel={t('parts.addToCart')}
                  availableLabel={t('common.available')}
                  outOfStockLabel={t('common.outOfStock')}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="parts-mobile-list">
                {parts.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    onAddToCart={addToCart}
                    onOpenDetail={openPartDetail}
                    detailLabel={t('parts.detail')}
                    cartLabel={t('parts.addToCart')}
                    availableLabel={t('common.available')}
                    outOfStockLabel={t('common.outOfStock')}
                  />
                ))}
              </div>

              <Card className="parts-desktop-table parts-list-table overflow-hidden p-0">
                <DataTable
                  rowIds={parts.map((part) => part.id)}
                  onRowClick={(index) => {
                    const part = parts[index];
                    if (part) openPartDetail(part.id);
                  }}
                  columns={[
                    t('parts.partNo'),
                    t('parts.partName'),
                    t('parts.category'),
                    t('parts.price'),
                    t('parts.stock'),
                  ]}
                  rows={parts.map((part) => [
                    part.partNumber,
                    part.partName,
                    part.category?.name ?? '—',
                    formatCurrency(Number(part.dealerPrice)),
                    <StockBadge
                      key={`${part.id}-stock`}
                      inStock={part.stockQuantity > 0}
                      label={part.stockQuantity > 0 ? t('common.available') : t('common.outOfStock')}
                    />,
                  ])}
                  actions={(index) => {
                    const part = parts[index];
                    if (!part) return null;

                    return (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button type="button" variant="outline" onClick={() => openPartDetail(part.id)}>
                          {t('parts.detail')}
                        </Button>
                        <Button type="button" onClick={() => addToCart(part.id)} disabled={part.stockQuantity <= 0}>
                          {t('common.add')}
                        </Button>
                      </div>
                    );
                  }}
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
