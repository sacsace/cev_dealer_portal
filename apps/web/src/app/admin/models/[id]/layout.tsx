import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('adminModelEdit', '/admin/models');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
