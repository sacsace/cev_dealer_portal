import { SITE_URL } from '@/lib/seo';
import { DEFAULT_LOCALE, translate } from '@/lib/i18n';

export function SiteJsonLd() {
  const siteName = translate(DEFAULT_LOCALE, 'seo.siteName');
  const siteDescription = translate(DEFAULT_LOCALE, 'seo.siteDescription');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'CEV Engineering Private Limited',
        url: SITE_URL,
      },
      {
        '@type': 'WebSite',
        name: siteName,
        description: siteDescription,
        url: SITE_URL,
        publisher: {
          '@type': 'Organization',
          name: 'CEV Engineering Private Limited',
        },
      },
      {
        '@type': 'WebApplication',
        name: siteName,
        description: siteDescription,
        url: SITE_URL,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
