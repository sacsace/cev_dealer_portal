import { isValidVin } from '@/lib/validation';

export type DealerSearchScope = 'global' | 'parts' | 'orders' | 'jobCards' | 'warranty';

export function getDealerSearchScope(pathname: string): DealerSearchScope {
  if (pathname.startsWith('/orders')) return 'orders';
  if (pathname.startsWith('/repair/job-cards')) return 'jobCards';
  if (pathname.startsWith('/repair/warranty-claims')) return 'warranty';
  if (pathname.startsWith('/parts')) return 'parts';
  return 'global';
}

export function getSearchPlaceholderKey(scope: DealerSearchScope): string {
  switch (scope) {
    case 'orders':
      return 'orders.searchPlaceholder';
    case 'jobCards':
      return 'jobCard.searchPlaceholder';
    case 'warranty':
      return 'warranty.searchPlaceholder';
    case 'parts':
    case 'global':
    default:
      return 'home.searchPlaceholder';
  }
}

export function buildDealerSearchUrl(
  scope: DealerSearchScope,
  query: string,
  currentParams?: URLSearchParams,
): string {
  const trimmed = query.trim();
  if (!trimmed) {
    return resolveSearchBase(scope, currentParams);
  }

  if (scope === 'global' && isValidVin(trimmed)) {
    return `/repair/job-cards?search=${encodeURIComponent(trimmed)}`;
  }

  const base =
    scope === 'orders'
      ? '/orders'
      : scope === 'jobCards'
        ? '/repair/job-cards'
        : scope === 'warranty'
          ? '/repair/warranty-claims'
          : '/parts';

  const params = new URLSearchParams();

  if (scope === 'orders' && currentParams?.get('status')) {
    params.set('status', currentParams.get('status')!);
  }

  if (scope === 'parts' || scope === 'global') {
    if (currentParams?.get('modelId')) params.set('modelId', currentParams.get('modelId')!);
    if (currentParams?.get('categoryId')) params.set('categoryId', currentParams.get('categoryId')!);
  }

  params.set('search', trimmed);
  return `${base}?${params.toString()}`;
}

function resolveSearchBase(scope: DealerSearchScope, currentParams?: URLSearchParams): string {
  if (scope === 'orders' && currentParams?.get('status')) {
    return `/orders?status=${encodeURIComponent(currentParams.get('status')!)}`;
  }
  if (scope === 'parts' && (currentParams?.get('modelId') || currentParams?.get('categoryId'))) {
    const params = new URLSearchParams();
    if (currentParams?.get('modelId')) params.set('modelId', currentParams.get('modelId')!);
    if (currentParams?.get('categoryId')) params.set('categoryId', currentParams.get('categoryId')!);
    return `/parts?${params.toString()}`;
  }

  switch (scope) {
    case 'orders':
      return '/orders';
    case 'jobCards':
      return '/repair/job-cards';
    case 'warranty':
      return '/repair/warranty-claims';
    case 'parts':
      return '/parts';
    default:
      return '/parts';
  }
}
