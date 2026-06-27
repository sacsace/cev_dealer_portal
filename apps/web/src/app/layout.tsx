import type { Viewport } from 'next';
import type { ReactNode } from 'react';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import { SiteJsonLd } from '@/components/seo/site-json-ld';
import { createRootMetadata } from '@/lib/seo';
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

export const metadata = createRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#8cc63f',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const runtimeApiUrl = getServerApiUrl();

  return (
    <html lang="en" className={`${inter.variable} ${notoSansKr.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <SiteJsonLd />
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
