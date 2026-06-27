import type { MetadataRoute } from 'next';
import { DEFAULT_LOCALE, translate } from '@/lib/i18n';

export default function manifest(): MetadataRoute.Manifest {
  const name = translate(DEFAULT_LOCALE, 'seo.siteName');
  const description = translate(DEFAULT_LOCALE, 'seo.siteDescription');

  return {
    name,
    short_name: 'CEV Dealer',
    description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8cc63f',
    icons: [
      { src: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
