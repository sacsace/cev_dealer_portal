'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PageTitle } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { PortalStatusTabs } from '@/components/ui/portal-status-tabs';
import { useI18n } from '@/components/providers/i18n-provider';

export function SettingsShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const activeKey = pathname.startsWith('/admin/settings/traffic') ? 'traffic' : 'mail';

  const tabs = [
    { key: 'mail', label: t('admin.settingsTabMail'), href: '/admin/settings/mail' },
    { key: 'traffic', label: t('admin.settingsTabTraffic'), href: '/admin/settings/traffic' },
  ];

  return (
    <AdminPageBody>
      <PageTitle title={t('admin.settings')} subtitle={t('admin.settingsSubtitle')} />
      <PortalStatusTabs
        tabs={tabs}
        activeKey={activeKey}
        ariaLabel={t('admin.settings')}
        className="mb-6"
      />
      {children}
    </AdminPageBody>
  );
}
