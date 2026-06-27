import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { SITE_URL } from '@/lib/seo';
import { DEFAULT_LOCALE, translate } from '@/lib/i18n';
import { getServerApiUrl } from '@/lib/env';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-kr',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const siteName = translate(DEFAULT_LOCALE, 'seo.siteName');
const siteDescription = translate(DEFAULT_LOCALE, 'seo.siteDescription');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'CEV',
    'Dealer Portal',
    'parts ordering',
    'Job Card',
    'Warranty Claim',
    'CNG',
    'Hyundai',
    'automotive parts',
  ],
  authors: [{ name: 'CEV Engineering Private Limited' }],
  creator: 'CEV Engineering Private Limited',
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName,
    title: siteName,
    description: siteDescription,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary',
    title: siteName,
    description: siteDescription,
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
    shortcut: ['/favicon.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const runtimeApiUrl = getServerApiUrl();

  return (
    <html lang="en" className={`${inter.variable} ${notoSansKr.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__CEV_API_URL__=${JSON.stringify(runtimeApiUrl)};`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
