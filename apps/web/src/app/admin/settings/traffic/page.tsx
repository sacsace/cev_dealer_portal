'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { settingsApi, type TrafficStatsReport } from '@/lib/api';
import { Button, Card, Input, KpiCard } from '@/components/ui';
import { AdminActionAlert } from '@/components/admin/admin-list-tools';
import { ReportBarChart } from '@/components/admin/report-bar-chart';
import { useI18n } from '@/components/providers/i18n-provider';

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function PathList({
  rows,
  emptyLabel,
}: {
  rows: Array<{ path: string; count: number }>;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-[13px] text-[var(--text-secondary)]">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2 text-[13px] text-[var(--text-secondary)]">
      {rows.map((row) => (
        <li
          key={row.path}
          className="flex justify-between gap-4 border-b border-[var(--border)] pb-2"
        >
          <span className="truncate text-[var(--text-primary)]">{row.path}</span>
          <span className="shrink-0 font-medium">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminSettingsTrafficPage() {
  const { t } = useI18n();
  const initialRange = useMemo(() => defaultDateRange(), []);

  const [trafficFrom, setTrafficFrom] = useState(initialRange.from);
  const [trafficTo, setTrafficTo] = useState(initialRange.to);
  const [traffic, setTraffic] = useState<TrafficStatsReport | null>(null);
  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [actionError, setActionError] = useState('');

  const loadTraffic = useCallback(async (from: string, to: string) => {
    setLoadingTraffic(true);
    setActionError('');
    try {
      const data = await settingsApi.getTraffic({ from, to });
      setTraffic(data);
    } catch (err) {
      setTraffic(null);
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoadingTraffic(false);
    }
  }, [t]);

  useEffect(() => {
    loadTraffic(initialRange.from, initialRange.to);
  }, [initialRange.from, initialRange.to, loadTraffic]);

  const trafficByDay = (traffic?.byDay ?? []).map((row) => ({
    key: row.day,
    label: row.day,
    count: row.count,
    amount: 0,
  }));

  return (
    <>
      {actionError ? <AdminActionAlert message={actionError} /> : null}

      <Card className="!p-6">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
          {t('admin.settingsTrafficTitle')}
        </h2>
        <p className="mb-5 text-[13px] text-[var(--text-secondary)]">
          {t('admin.settingsTrafficDescription')}
        </p>

        <div className="mb-5 flex flex-wrap items-end gap-3">
          <Input
            label={t('admin.reportDateFrom')}
            type="date"
            value={trafficFrom}
            onChange={(e) => setTrafficFrom(e.target.value)}
          />
          <Input
            label={t('admin.reportDateTo')}
            type="date"
            value={trafficTo}
            onChange={(e) => setTrafficTo(e.target.value)}
          />
          <Button type="button" onClick={() => loadTraffic(trafficFrom, trafficTo)}>
            {t('common.search')}
          </Button>
        </div>

        {loadingTraffic ? (
          <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
        ) : traffic ? (
          <div className="space-y-8">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                {t('admin.settingsInflowSummary')}
              </h3>
              <div className="portal-kpi-grid portal-kpi-grid--4">
                <KpiCard label={t('admin.settingsTotalVisits')} value={traffic.summary.totalVisits} />
                <KpiCard label={t('admin.settingsSiteAccess')} value={traffic.summary.siteAccess} />
                <KpiCard label={t('admin.settingsProductViews')} value={traffic.summary.productViews} />
                <KpiCard label={t('admin.settingsUniquePaths')} value={traffic.summary.uniquePaths} />
              </div>
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                {t('admin.settingsInflowByDay')}
              </h3>
              <p className="mb-3 text-[12px] text-[var(--text-secondary)]">
                {t('admin.settingsInflowByDayHint')}
              </p>
              <ReportBarChart rows={trafficByDay} />
            </section>

            {traffic.byRole.length > 0 ? (
              <section>
                <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                  {t('admin.settingsAccessByRole')}
                </h3>
                <p className="mb-3 text-[12px] text-[var(--text-secondary)]">
                  {t('admin.settingsAccessByRoleHint')}
                </p>
                <ul className="space-y-2 text-[13px] text-[var(--text-secondary)]">
                  {traffic.byRole.map((row) => (
                    <li
                      key={row.role}
                      className="flex justify-between gap-4 border-b border-[var(--border)] pb-2"
                    >
                      <span className="text-[var(--text-primary)]">{row.role || '—'}</span>
                      <span className="shrink-0 font-medium">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                {t('admin.settingsSiteAccessTitle')}
              </h3>
              <p className="mb-3 text-[12px] text-[var(--text-secondary)]">
                {t('admin.settingsSiteAccessDesc')}
              </p>
              <PathList rows={traffic.byAccessPath ?? []} emptyLabel={t('admin.settingsNoTraffic')} />
            </section>

            <section>
              <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                {t('admin.settingsProductViewsTitle')}
              </h3>
              <p className="mb-3 text-[12px] text-[var(--text-secondary)]">
                {t('admin.settingsProductViewsDesc')}
              </p>
              <PathList rows={traffic.byProductPath ?? []} emptyLabel={t('admin.settingsNoProductViews')} />
            </section>
          </div>
        ) : null}
      </Card>
    </>
  );
}
