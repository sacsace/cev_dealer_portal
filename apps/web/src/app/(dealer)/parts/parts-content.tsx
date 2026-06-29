'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cartApi, lookupApi, partsApi, type Part, type Category, type VehicleModel } from '@/lib/api';
import { getPartImageUrl } from '@/lib/part-image';
import { Button, Card, DataTable, Input, PageTitle, useAlertDialog } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

function buildPartDetailPath(partId: string, searchParams: URLSearchParams) {
  const params = new URLSearchParams();
  const search = searchParams.get('search');
  const modelId = searchParams.get('modelId');
  const categoryId = searchParams.get('categoryId');
  if (search) params.set('search', search);
  if (modelId) params.set('modelId', modelId);
  if (categoryId) params.set('categoryId', categoryId);
  const qs = params.toString();
  return qs ? `/parts/${partId}?${qs}` : `/parts/${partId}`;
}

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
  cartLabel,
  availableLabel,
  outOfStockLabel,
}: {
  part: Part;
  onAddToCart: (partId: string) => void;
  onOpenDetail: (partId: string) => void;
  cartLabel: string;
  availableLabel: string;
  outOfStockLabel: string;
}) {
  const { t } = useI18n();
  const inStock = part.stockQuantity > 0;
  const imageUrl = getPartImageUrl(part);

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
      aria-label={`${part.partName}, ${t('common.viewDetail')}`}
    >
      <div className="parts-card-media">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={part.partName} className="h-full w-full object-cover" />
        ) : (
          <span className="parts-card-media-code">{part.partNumber}</span>
        )}
      </div>
      <h3 className="parts-card-name">{part.partName}</h3>
      <p className="parts-card-category">{part.category?.name ?? '—'}</p>
      <div className="parts-card-meta">
        <span className="parts-card-price">{formatCurrency(Number(part.dealerPrice))}</span>
        <StockBadge inStock={inStock} label={inStock ? availableLabel : outOfStockLabel} />
      </div>
      <div className="parts-card-actions" onClick={(e) => e.stopPropagation()}>
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
  }, []);

  useEffect(() => {
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

  function pushFilters(overrides: Partial<{ search: string; modelId: string; categoryId: string }> = {}) {
    const params = new URLSearchParams();
    const q = (overrides.search ?? search).trim();
    const m = overrides.modelId ?? modelId;
    const c = overrides.categoryId ?? categoryId;
    if (q) params.set('search', q);
    if (m) params.set('modelId', m);
    if (c) params.set('categoryId', c);
    const qs = params.toString();
    router.replace(qs ? `/parts?${qs}` : '/parts');
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    pushFilters({ search });
  }

  function clearFilters() {
    setSearch('');
    setModelId('');
    setCategoryId('');
    router.replace('/parts');
  }

  async function addToCart(partId: string) {
    await cartApi.addItem(partId, 1);
    await alert({ message: t('common.addedToCart'), variant: 'success' });
  }

  function goToPartDetail(partId: string) {
    router.push(buildPartDetailPath(partId, searchParams));
  }

  const emptyMessage =
    searchParams.get('search')
      ? t('common.noSearchResults').replace('{query}', searchParams.get('search')!)
      : t('parts.noFilterResults');

  return (
    <div className="w-full min-w-0">
      {alertDialog}
      <div className="parts-page-shell">
        <div className="parts-page-heading">
          <PageTitle title={t('parts.title')} subtitle={t('parts.subtitle')} className="mb-0" />
        </div>

        <Card className="parts-filter-card">
          <h3 className="parts-filter-title">{t('common.filters')}</h3>
          <form onSubmit={handleSearch} className="parts-filter-form">
            <div className="parts-filter-field">
              <Input label={t('common.keyword')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="parts-filter-lists">
              <div className="parts-filter-group">
                <p className="parts-filter-list-label">{t('parts.model')}</p>
                <div className="parts-filter-list" role="listbox" aria-label={t('parts.model')}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={!modelId}
                    className={cn('parts-filter-list__item', !modelId && 'parts-filter-list__item--active')}
                    onClick={() => pushFilters({ modelId: '' })}
                  >
                    {t('common.allModels')}
                  </button>
                  {models.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      role="option"
                      aria-selected={modelId === model.id}
                      className={cn(
                        'parts-filter-list__item',
                        modelId === model.id && 'parts-filter-list__item--active',
                      )}
                      onClick={() => pushFilters({ modelId: model.id })}
                    >
                      {model.modelName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="parts-filter-group parts-filter-group--category">
                <p className="parts-filter-list-label">{t('parts.category')}</p>
                <div className="parts-filter-list" role="listbox" aria-label={t('parts.category')}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={!categoryId}
                    className={cn('parts-filter-list__item', !categoryId && 'parts-filter-list__item--active')}
                    onClick={() => pushFilters({ categoryId: '' })}
                  >
                    {t('common.allCategories')}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      role="option"
                      aria-selected={categoryId === category.id}
                      className={cn(
                        'parts-filter-list__item',
                        categoryId === category.id && 'parts-filter-list__item--active',
                      )}
                      onClick={() => pushFilters({ categoryId: category.id })}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="parts-filter-actions grid gap-2 pt-1">
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
                  onOpenDetail={goToPartDetail}
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
                    onOpenDetail={goToPartDetail}
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
                    if (part) goToPartDetail(part.id);
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
                      <div onClick={(e) => e.stopPropagation()}>
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
