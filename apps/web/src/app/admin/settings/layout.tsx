import type { ReactNode } from 'react';
import { pageMetadata } from '@/lib/seo';
import { SettingsShell } from '@/components/admin/settings-shell';

export const metadata = pageMetadata('adminSettings', '/admin/settings');

export default function Layout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
