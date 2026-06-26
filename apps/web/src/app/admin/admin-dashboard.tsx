'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  ClipboardList,
  Wrench,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { getSession, type ApiUser } from '@/lib/api';
import { adminNavGroups } from '@/lib/admin-nav';
import { fetchAdminStats, type AdminStats } from '@/lib/admin-stats';
import { Card, PageTitle } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    setUser(getSession());
    fetchAdminStats()
      .then(setStats)
      .catch(() =>
        setStats({
          totalDealers: 0,
          todayOrders: 0,
          pendingOrders: 0,
          pendingJobCards: 0,
          pendingClaims: 0,
          lowStockParts: 0,
        }),
      );
  }, []);

  const statCards = [
    { label: t('admin.totalDealers'), value: stats?.totalDealers ?? '—', icon: Building2, tone: 'blue' as const, href: '/admin/dealers' },
    { label: t('admin.todayOrders'), value: stats?.todayOrders ?? '—', icon: TrendingUp, tone: 'green' as const, href: '/admin/orders' },
    { label: t('admin.pendingOrders'), value: stats?.pendingOrders ?? '—', icon: ClipboardList, tone: 'yellow' as const, href: '/admin/orders' },
    { label: t('admin.pendingJobCards'), value: stats?.pendingJobCards ?? '—', icon: Wrench, tone: 'blue' as const, href: '/admin/job-cards' },
    { label: t('admin.pendingClaims'), value: stats?.pendingClaims ?? '—', icon: ShieldCheck, tone: 'green' as const, href: '/admin/claims' },
    { label: t('admin.lowStock'), value: stats?.lowStockParts ?? '—', icon: AlertCircle, tone: 'yellow' as const, href: '/admin/parts' },
  ];

  const toneClass = {
    blue: 'bg-[rgba(0,174,239,0.1)] text-[var(--cev-blue)]',
    green: 'bg-[rgba(140,198,63,0.12)] text-[var(--cev-green)]',
    yellow: 'bg-[rgba(247,236,19,0.18)] text-[#9a8f00]',
  };

  return (
    <AdminPageBody>
      <PageTitle
        title={user ? t('admin.welcome').replace('{name}', user.name) : t('admin.dashboard')}
        subtitle={t('admin.dashboardSubtitle')}
      />

      <section className="mb-10">
        <h2 className="admin-section-label">{t('admin.overview')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href}>
                <Card hover className="admin-stat-card flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass[stat.tone]}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[13px] text-[var(--text-secondary)]">{stat.label}</div>
                    <div className="admin-stat-value">{stat.value}</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {adminNavGroups.map((group) => (
        <section key={group.key} className="mb-8 last:mb-0">
          <h2 className="admin-section-label">{t(group.labelKey)}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.key} href={item.href}>
                  <Card hover className="admin-module-card group">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--accent)] transition-colors group-hover:bg-[rgba(0,174,239,0.1)]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="text-[13px] font-semibold leading-snug">{t(item.labelKey)}</div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </AdminPageBody>
  );
}
