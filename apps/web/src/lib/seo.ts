import type { Metadata } from 'next';
import { DEFAULT_LOCALE, translate } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/env';

export const SITE_URL = getSiteUrl();

export type SeoPageKey =
  | 'login'
  | 'terms'
  | 'privacy'
  | 'support'
  | 'adminDashboard'
  | 'adminDealers'
  | 'adminDealerNew'
  | 'adminDealerEdit'
  | 'adminUsers'
  | 'adminCatalog'
  | 'adminCatalogNew'
  | 'adminCatalogEdit'
  | 'adminParts'
  | 'adminPartNew'
  | 'adminPartEdit'
  | 'adminModels'
  | 'adminModelNew'
  | 'adminModelEdit'
  | 'adminFitments'
  | 'adminFitmentNew'
  | 'adminFitmentEdit'
  | 'adminOrders'
  | 'adminJobCards'
  | 'adminJobCardEdit'
  | 'adminProblemTypes'
  | 'adminProblemTypeNew'
  | 'adminProblemTypeEdit'
  | 'adminJobCardTypes'
  | 'adminJobCardTypeNew'
  | 'adminJobCardTypeEdit'
  | 'adminClaims'
  | 'adminClaimDetail'
  | 'adminReports'
  | 'adminAccount'
  | 'dealerHome'
  | 'dealerParts'
  | 'dealerPartDetail'
  | 'dealerCart'
  | 'dealerCheckout'
  | 'dealerOrders'
  | 'dealerJobCards'
  | 'dealerJobCardNew'
  | 'dealerJobCardEdit'
  | 'dealerWarrantyClaims'
  | 'dealerWarrantyClaimNew'
  | 'dealerWarrantyClaimEdit'
  | 'dealerAccount'
  | 'dealerHelp';

const PUBLIC_PAGES: SeoPageKey[] = ['terms', 'privacy', 'support'];

export function pageMetadata(page: SeoPageKey, path: string): Metadata {
  const locale = DEFAULT_LOCALE;
  const title = translate(locale, `seo.${page}.title`);
  const description = translate(locale, `seo.${page}.description`);
  const siteName = translate(locale, 'seo.siteName');
  const noIndex = !PUBLIC_PAGES.includes(page);

  return {
    title,
    description,
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    alternates: {
      canonical: path,
      languages: {
        en: path,
        ko: path,
        'x-default': path,
      },
    },
    openGraph: {
      title,
      description,
      siteName,
      type: 'website',
      locale: 'en_US',
      url: `${SITE_URL}${path}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
