import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('dealerWarrantyClaimNew', '/repair/warranty-claims/new');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
