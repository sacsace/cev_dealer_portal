import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('adminProblemTypeEdit', '/admin/problem-types');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
