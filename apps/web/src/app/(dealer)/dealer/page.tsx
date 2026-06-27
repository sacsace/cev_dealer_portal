'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Search,
  ShoppingBag,
  Wrench,
} from 'lucide-react';
import { lookupApi, partsApi, refreshSession, type ApiUser, type Category, type Part, type VehicleModel } from '@/lib/api';
import { buildDealerSearchUrl } from '@/lib/dealer-search';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

export default function DealerHomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [featuredParts, setFeaturedParts] = useState<Part[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    refreshSession().then(setUser);
    partsApi.search({ limit: '6' }).then((res) => setFeaturedParts(res.data)).catch(() => {});
    lookupApi.models().then(setModels).catch(() => {});
    lookupApi.categories().then(setCategories).catch(() => {});
  }, []);

  const dealerName = user?.dealer?.dealerName ?? user?.name ?? t('home.title');

  const primaryActions = [
    {
      href: '/repair/job-cards/new',
      icon: Wrench,
      title: t('home.jobCardEntryTitle'),
      desc: t('home.jobCardEntryDesc'),
      cta: t('nav.jobCardEntry'),
      tone: 'repair' as const,
    },
    {
      href: '/parts',
      icon: ShoppingBag,
      title: t('home.partOrderTitle'),
      desc: t('home.partOrderDesc'),
      cta: t('home.viewAllParts'),
      tone: 'parts' as const,
    },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(buildDealerSearchUrl('global', searchQuery.trim()));
    }
  }

  return (
    <div className="space-y-8">
      <section className="dealer-home-hero rounded-[var(--radius-lg)] px-6 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--cev-green)]">
              {t('home.title')}
            </p>
            <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.25rem)] font-semibold tracking-tight text-[var(--text-primary)]">
              {t('home.welcome')}, {dealerName}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              {t('home.welcomeSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <div className="portal-search-input-wrap flex-1">
              <Search className="portal-search-input-icon h-4 w-4" strokeWidth={1.75} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="apple-input w-full"
              />
            </div>
            <Button type="submit" className="w-full shrink-0 sm:w-auto">
              {t('common.search')}
            </Button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {primaryActions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'dealer-home-action group rounded-[var(--radius-md)] p-6',
              item.tone === 'repair' ? 'dealer-home-action--repair' : 'dealer-home-action--parts',
            )}
          >
            <div className="relative z-[1] flex h-full flex-col">
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)]',
                  item.tone === 'repair'
                    ? 'bg-[rgba(140,198,63,0.12)] text-[var(--cev-green)]'
                    : 'bg-[rgba(140,198,63,0.16)] text-[#5a8f24]',
                )}
              >
                <item.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{item.title}</h2>
              <p className="mt-1 flex-1 text-[14px] leading-relaxed text-[var(--text-secondary)]">{item.desc}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)] group-hover:gap-2.5 transition-all">
                {item.cta}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] md:p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">{t('home.featuredModels')}</h2>
          <div className="flex flex-wrap gap-2">
            {models.slice(0, 8).map((model) => (
              <Link key={model.id} href={`/parts?modelId=${model.id}`} className="apple-chip">
                {model.modelName}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] md:p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">{t('home.featuredCategories')}</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link key={category.id} href={`/parts?categoryId=${category.id}`} className="apple-chip">
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{t('home.featuredParts')}</h2>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{t('home.browseTitle')}</p>
          </div>
          <Link href="/parts" className="apple-link inline-flex items-center gap-1 text-[14px] font-semibold">
            {t('home.viewAllParts')}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredParts.map((part) => {
            const inStock = part.stockQuantity > 0;

            return (
              <Link key={part.id} href={`/parts/${part.id}`} className="dealer-home-part-card group">
                <div className="flex h-32 items-center justify-center bg-[linear-gradient(180deg,#f8f9fb_0%,#eef1f5_100%)] px-4">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold tracking-wide text-[var(--text-secondary)] shadow-[var(--shadow-sm)]">
                    {part.partNumber}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                      {part.partName}
                    </h3>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        inStock ? 'status-badge status-badge--success' : 'status-badge status-badge--danger',
                      )}
                    >
                      {inStock ? t('common.available') : t('common.outOfStock')}
                    </span>
                  </div>
                  <p className="text-[13px] text-[var(--text-secondary)]">{part.category?.name ?? '—'}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
                    <span className="text-[17px] font-semibold text-[var(--text-primary)]">
                      {formatCurrency(Number(part.dealerPrice))}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--accent)]">{t('common.viewDetail')}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
