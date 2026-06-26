import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata('adminProblemTypeNew', '/admin/problem-types/new');

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
