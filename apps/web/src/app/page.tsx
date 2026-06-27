import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import RootRedirect from '@/components/auth/root-redirect';

export const metadata: Metadata = pageMetadata('home', '/');

export default function RootPage() {
  return <RootRedirect />;
}
