'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type StatusTab = {
  key: string;
  label: string;
  href: string;
};

export function PortalStatusTabs({
  tabs,
  activeKey,
  ariaLabel,
  className,
}: {
  tabs: StatusTab[];
  activeKey: string;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={cn('portal-status-tabs', className)} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          role="tab"
          aria-selected={activeKey === tab.key}
          className={cn(
            'portal-status-tabs__btn',
            activeKey === tab.key && 'portal-status-tabs__btn--active',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
