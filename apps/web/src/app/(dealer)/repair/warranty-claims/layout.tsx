import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('dealerWarrantyClaims', '/repair/warranty-claims');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
