import type { Metadata } from 'next';
import { DEFAULT_LOCALE, translate } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/env';

export const SITE_URL = getSiteUrl();

export const SITE_NAME = 'CEV Dealer Portal';

const OG_IMAGE_PATH = '/apple-icon.png';

export type SeoPageKey =
  | 'home'
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

const SITE_KEYWORDS = [
  'CEV Dealer Portal',
  'CEV',
  'dealer portal',
  'parts ordering',
  'Job Card',
  'Warranty Claim',
  'CNG',
  'Hyundai',
  'automotive parts',
  'B2B',
];

function getSiteName(locale = DEFAULT_LOCALE) {
  return translate(locale, 'seo.siteName');
}

function getSiteDescription(locale = DEFAULT_LOCALE) {
  return translate(locale, 'seo.siteDescription');
}

function openGraphImages(siteName: string): NonNullable<Metadata['openGraph']>['images'] {
  return [
    {
      url: OG_IMAGE_PATH,
      width: 180,
      height: 180,
      alt: siteName,
    },
  ];
}

export function createRootMetadata(): Metadata {
  const siteName = getSiteName();
  const siteDescription = getSiteDescription();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    applicationName: siteName,
    keywords: SITE_KEYWORDS,
    authors: [{ name: 'CEV Engineering Private Limited' }],
    creator: 'CEV Engineering Private Limited',
    publisher: 'CEV Engineering Private Limited',
    category: 'business',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: { index: false, follow: false },
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      alternateLocale: ['ko_KR'],
      siteName,
      title: siteName,
      description: siteDescription,
      url: SITE_URL,
      images: openGraphImages(siteName),
    },
    twitter: {
      card: 'summary',
      title: siteName,
      description: siteDescription,
      images: [OG_IMAGE_PATH],
    },
    icons: {
      icon: [
        { url: '/favicon.png', type: 'image/png', sizes: '48x48' },
        { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      ],
      apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
      shortcut: ['/favicon.png'],
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: 'default',
    },
  };
}

export function pageMetadata(page: SeoPageKey, path: string): Metadata {
  const locale = DEFAULT_LOCALE;
  const title = translate(locale, `seo.${page}.title`);
  const description = translate(locale, `seo.${page}.description`);
  const siteName = getSiteName();
  const noIndex = !PUBLIC_PAGES.includes(page);
  const canonicalUrl = `${SITE_URL}${path}`;

  return {
    title,
    description,
    keywords: [...SITE_KEYWORDS, title],
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
      title: `${title} | ${siteName}`,
      description,
      siteName,
      type: 'website',
      locale: 'en_US',
      alternateLocale: ['ko_KR'],
      url: canonicalUrl,
      images: openGraphImages(siteName),
    },
    twitter: {
      card: 'summary',
      title: `${title} | ${siteName}`,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
