'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  TrendingUp,
  ClipboardList,
  Wrench,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { getSession, type ApiUser } from '@/lib/api';
import {
  canViewAdminCatalogStats,
  canViewAdminClaimStats,
  canViewAdminJobCardStats,
  canViewAdminOrderStats,
  canViewAdminOrganizationStats,
} from '@/lib/admin-access';
import { filterAdminQuickActions } from '@/lib/admin-quick-actions';
import { fetchAdminDashboardData, type AdminDashboardData } from '@/lib/admin-stats';
import { DashboardTrendChart } from '@/components/admin/dashboard-trend-chart';
import { ReportBarChart } from '@/components/admin/report-bar-chart';
import { Card, PageTitle } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

const emptyDashboard: AdminDashboardData = {
  stats: {
    totalDealers: 0,
    todayOrders: 0,
    pendingOrders: 0,
    pendingJobCards: 0,
    pendingClaims: 0,
    lowStockParts: 0,
  },
  charts: {
    ordersByStatus: [],
    claimsByStatus: [],
    ordersLast7Days: [],
  },
};

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(() => getSession());
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);

  useEffect(() => {
    const session = getSession();
    setUser(session);
    fetchAdminDashboardData(session?.role)
      .then(setDashboard)
      .catch(() => setDashboard(emptyDashboard));
  }, []);

  const stats = dashboard?.stats;
  const charts = dashboard?.charts;

  const statCards = [
    ...(canViewAdminOrganizationStats(user?.role)
      ? [{ label: t('admin.totalDealers'), value: stats?.totalDealers ?? '—', icon: Building2, tone: 'green' as const, href: '/admin/dealers' }]
      : []),
    ...(canViewAdminOrderStats(user?.role)
      ? [
          { label: t('admin.todayOrders'), value: stats?.todayOrders ?? '—', icon: TrendingUp, tone: 'green' as const, href: '/admin/orders' },
          { label: t('admin.pendingOrders'), value: stats?.pendingOrders ?? '—', icon: ClipboardList, tone: 'yellow' as const, href: '/admin/orders' },
        ]
      : []),
    ...(canViewAdminJobCardStats(user?.role)
      ? [{ label: t('admin.pendingJobCards'), value: stats?.pendingJobCards ?? '—', icon: Wrench, tone: 'green' as const, href: '/admin/job-cards' }]
      : []),
    ...(canViewAdminClaimStats(user?.role)
      ? [{ label: t('admin.pendingClaims'), value: stats?.pendingClaims ?? '—', icon: ShieldCheck, tone: 'yellow' as const, href: '/admin/claims' }]
      : []),
    ...(canViewAdminCatalogStats(user?.role)
      ? [{ label: t('admin.lowStock'), value: stats?.lowStockParts ?? '—', icon: AlertCircle, tone: 'yellow' as const, href: '/admin/parts' }]
      : []),
  ];

  const quickActions = useMemo(() => filterAdminQuickActions(user?.role), [user?.role]);

  const orderStatusRows = useMemo(
    () =>
      (charts?.ordersByStatus ?? []).map((row) => ({
        label: t(`status.${row.label}`) !== `status.${row.label}` ? t(`status.${row.label}`) : row.label.replace(/_/g, ' '),
        count: row.count,
      })),
    [charts?.ordersByStatus, t],
  );

  const claimStatusRows = useMemo(
    () =>
      (charts?.claimsByStatus ?? []).map((row) => ({
        label: t(`status.${row.label}`) !== `status.${row.label}` ? t(`status.${row.label}`) : row.label.replace(/_/g, ' '),
        count: row.count,
      })),
    [charts?.claimsByStatus, t],
  );

  const toneClass = {
    green: 'admin-dashboard-kpi__icon--green',
    yellow: 'admin-dashboard-kpi__icon--yellow',
  };

  return (
    <AdminPageBody>
      <PageTitle
        title={user ? t('admin.welcome').replace('{name}', user.name) : t('admin.dashboard')}
        subtitle={t('admin.dashboardSubtitle')}
      />

      <section className="mb-8">
        <h2 className="admin-section-label">{t('admin.overview')}</h2>
        <div className="admin-dashboard-kpi-grid">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.href} className="admin-dashboard-kpi">
                <div className={`admin-dashboard-kpi__icon ${toneClass[stat.tone]}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <div className="admin-dashboard-kpi__label">{stat.label}</div>
                  <div className="admin-dashboard-kpi__value">{stat.value}</div>
                </div>
                <ArrowRight className="admin-dashboard-kpi__arrow h-4 w-4 shrink-0" strokeWidth={1.75} />
              </Link>
            );
          })}
        </div>
      </section>

      {quickActions.length > 0 && (
        <section className="mb-8">
          <h2 className="admin-section-label">{t('admin.quickActions')}</h2>
          <div className="admin-dashboard-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.key} href={action.href} className="admin-dashboard-quick-action">
                  <span className="admin-dashboard-quick-action__icon">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span>{t(action.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="admin-dashboard-charts">
        {canViewAdminOrderStats(user?.role) && (
          <Card className="admin-dashboard-chart-card p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('admin.ordersTrend')}</h3>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('admin.ordersTrendHint')}</p>
              </div>
              <Link href="/admin/orders" className="admin-dashboard-chart-link">
                {t('admin.viewAllOrders')}
              </Link>
            </div>
            {charts?.ordersLast7Days?.length ? (
              <DashboardTrendChart points={charts.ordersLast7Days} />
            ) : (
              <p className="admin-dashboard-empty">{t('admin.noChartData')}</p>
            )}
          </Card>
        )}

        {canViewAdminOrderStats(user?.role) && (
          <Card className="admin-dashboard-chart-card p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('admin.ordersByStatus')}</h3>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('admin.ordersByStatusHint')}</p>
              </div>
              <Link href="/admin/reports" className="admin-dashboard-chart-link">
                {t('admin.viewReports')}
              </Link>
            </div>
            {orderStatusRows.length > 0 ? (
              <ReportBarChart rows={orderStatusRows} />
            ) : (
              <p className="admin-dashboard-empty">{t('admin.noChartData')}</p>
            )}
          </Card>
        )}

        {canViewAdminClaimStats(user?.role) && (
          <Card className="admin-dashboard-chart-card p-5 md:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('admin.claimsByStatus')}</h3>
                <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{t('admin.claimsByStatusHint')}</p>
              </div>
              <Link href="/admin/claims" className="admin-dashboard-chart-link">
                {t('admin.viewAllClaims')}
              </Link>
            </div>
            {claimStatusRows.length > 0 ? (
              <ReportBarChart rows={claimStatusRows} />
            ) : (
              <p className="admin-dashboard-empty">{t('admin.noChartData')}</p>
            )}
          </Card>
        )}
      </section>
    </AdminPageBody>
  );
}
