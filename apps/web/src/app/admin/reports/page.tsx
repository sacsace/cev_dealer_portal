'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import {
  dealersApi,
  reportsApi,
  type ClaimAnalysisReport,
  type Dealer,
  type OrderAnalysisReport,
  type ReportFilters,
  type ReportSummary,
} from '@/lib/api';
import { Button, Card, DataTable, PageTitle, Select, StatusBadge } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { ReportBarChart } from '@/components/admin/report-bar-chart';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

type ReportTab = 'overview' | 'orders' | 'claims';

function defaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function AdminReportsPage() {
  const { t } = useI18n();
  const initialRange = useMemo(() => defaultDateRange(), []);
  const [tab, setTab] = useState<ReportTab>('overview');
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [dealerId, setDealerId] = useState('');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filters, setFilters] = useState<ReportFilters>(initialRange);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [orderAnalysis, setOrderAnalysis] = useState<OrderAnalysisReport | null>(null);
  const [claimAnalysis, setClaimAnalysis] = useState<ClaimAnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    dealersApi.list({ limit: '200' }).then((res) => setDealers(res.data)).catch(() => setDealers([]));
  }, []);

  const load = useCallback(async (nextFilters: ReportFilters) => {
    setLoading(true);
    setActionError('');
    try {
      const [summaryRes, ordersRes, claimsRes] = await Promise.all([
        reportsApi.summary(nextFilters),
        reportsApi.orderAnalysis(nextFilters),
        reportsApi.claimAnalysis(nextFilters),
      ]);
      setSummary(summaryRes);
      setOrderAnalysis(ordersRes);
      setClaimAnalysis(claimsRes);
    } catch (err) {
      setSummary(null);
      setOrderAnalysis(null);
      setClaimAnalysis(null);
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  function applyFilters() {
    setFilters({
      from: from || undefined,
      to: to || undefined,
      dealerId: dealerId || undefined,
    });
  }

  async function handleExport(type: 'summary' | 'orders' | 'claims') {
    setExporting(true);
    setActionError('');
    try {
      await reportsApi.exportExcel(type, filters);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.reportExportFailed'));
    } finally {
      setExporting(false);
    }
  }

  const tabs: Array<{ key: ReportTab; label: string }> = [
    { key: 'overview', label: t('admin.reportTabOverview') },
    { key: 'orders', label: t('admin.reportTabOrders') },
    { key: 'claims', label: t('admin.reportTabClaims') },
  ];

  const overviewCards = summary
    ? [
        { label: t('admin.totalDealers'), value: summary.totalDealers },
        { label: t('admin.totalOrders'), value: summary.totalOrders },
        { label: t('admin.reportTotalAmount'), value: formatCurrency(summary.orderTotalAmount) },
        { label: t('admin.totalJobCards'), value: summary.totalJobCards },
        { label: t('admin.totalClaims'), value: summary.totalClaims },
        { label: t('admin.reportTotalClaimAmount'), value: formatCurrency(summary.claimTotalAmount) },
        { label: t('admin.totalParts'), value: summary.totalParts },
        { label: t('admin.lowStock'), value: summary.lowStockParts },
      ]
    : [];

  const exportLabel =
    tab === 'overview'
      ? t('admin.reportExportSummary')
      : tab === 'orders'
        ? t('admin.reportExportOrders')
        : t('admin.reportExportClaims');

  const exportType = tab === 'overview' ? 'summary' : tab;

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.reports')} subtitle={t('admin.reportsSubtitle')} />
        <Button
          variant="outline"
          disabled={exporting || loading}
          onClick={() => handleExport(exportType)}
          className="inline-flex items-center gap-2"
        >
          <Download className="h-4 w-4" strokeWidth={1.75} />
          {exporting ? t('common.loading') : exportLabel}
        </Button>
      </div>

      <Card className="mb-6 !p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              {t('admin.reportDateFrom')}
            </span>
            <input type="date" className="apple-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]">
              {t('admin.reportDateTo')}
            </span>
            <input type="date" className="apple-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <Select
            label={t('admin.reportDealer')}
            value={dealerId}
            onChange={(e) => setDealerId(e.target.value)}
          >
            <option value="">{t('admin.reportAllDealers')}</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.dealerName} ({dealer.dealerCode})
              </option>
            ))}
          </Select>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-2">
            <Button onClick={applyFilters} disabled={loading}>
              {t('admin.reportApplyFilter')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => {
                setFrom('');
                setTo('');
                setDealerId('');
                setFilters({});
              }}
            >
              {t('common.clear')}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={[
              'rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors',
              tab === item.key
                ? 'bg-white text-[var(--accent)] shadow-[inset_0_-2px_0_var(--cev-blue)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{actionError}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : !summary ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.noRecords')}</p>
      ) : tab === 'overview' ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((item) => (
              <Card key={item.label} className="!p-5">
                <div className="text-sm text-[var(--text-secondary)]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</div>
              </Card>
            ))}
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} />
                {t('admin.ordersByStatus')}
              </h2>
              <DataTable
                columns={[t('orders.status'), t('admin.count')]}
                rows={Object.entries(summary.ordersByStatus).map(([status, count]) => [
                  <StatusBadge key={status} status={status} />,
                  count,
                ])}
              />
            </section>
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} />
                {t('admin.claimsByStatus')}
              </h2>
              <DataTable
                columns={[t('orders.status'), t('admin.count')]}
                rows={Object.entries(summary.claimsByStatus).map(([status, count]) => [
                  <StatusBadge key={status} status={status} />,
                  count,
                ])}
              />
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {t('admin.lowStockList')}
            </h2>
            <DataTable
              columns={[t('parts.partNo'), t('parts.partName'), t('parts.stock'), t('parts.price')]}
              rows={summary.lowStockList.map((part) => [
                part.partNumber,
                part.partName,
                part.stockQuantity,
                formatCurrency(part.dealerPrice),
              ])}
            />
          </section>
        </>
      ) : tab === 'orders' && orderAnalysis ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: t('admin.totalOrders'), value: orderAnalysis.summary.totalCount },
              { label: t('admin.reportTotalAmount'), value: formatCurrency(orderAnalysis.summary.totalAmount) },
              { label: t('admin.reportAvgOrderValue'), value: formatCurrency(orderAnalysis.summary.averageOrderValue) },
              { label: t('admin.reportPendingOrders'), value: orderAnalysis.summary.pendingCount },
              { label: t('status.APPROVED'), value: orderAnalysis.summary.approvedCount },
            ].map((item) => (
              <Card key={item.label} className="!p-5">
                <div className="text-sm text-[var(--text-secondary)]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</div>
              </Card>
            ))}
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <Card className="!p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{t('admin.ordersByStatus')}</h3>
              <ReportBarChart rows={orderAnalysis.byStatus} />
            </Card>
            <Card className="!p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{t('admin.reportOrdersByMonth')}</h3>
              <ReportBarChart rows={orderAnalysis.byMonth} />
            </Card>
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {t('admin.reportOrdersByDealer')}
              </h2>
              <DataTable
                columns={[t('admin.reportDealer'), t('admin.count'), t('admin.reportAmount')]}
                rows={orderAnalysis.byDealer.map((row) => [row.label, row.count, formatCurrency(row.amount)])}
              />
            </section>
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {t('admin.reportTopParts')}
              </h2>
              <DataTable
                columns={[t('parts.partNo'), t('parts.partName'), t('admin.reportQuantity'), t('admin.reportAmount')]}
                rows={orderAnalysis.topParts.map((row) => [
                  row.key,
                  row.label,
                  row.quantity,
                  formatCurrency(row.amount),
                ])}
              />
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {t('admin.reportRecentOrders')}
            </h2>
            <DataTable
              columns={[
                t('orders.orderNo'),
                t('admin.reportDealer'),
                t('orders.status'),
                t('admin.reportAmount'),
                t('orders.date'),
              ]}
              rows={orderAnalysis.recentOrders.map((row) => [
                row.orderNo,
                `${row.dealerName} (${row.dealerCode})`,
                <StatusBadge key={`${row.orderNo}-status`} status={row.status} />,
                formatCurrency(row.grandTotal),
                formatDate(row.createdAt),
              ])}
            />
          </section>
        </>
      ) : tab === 'claims' && claimAnalysis ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: t('admin.totalClaims'), value: claimAnalysis.summary.totalCount },
              { label: t('admin.reportTotalClaimAmount'), value: formatCurrency(claimAnalysis.summary.totalAmount) },
              { label: t('admin.reportApprovedAmount'), value: formatCurrency(claimAnalysis.summary.approvedAmount) },
              { label: t('admin.reportPendingClaims'), value: claimAnalysis.summary.pendingCount },
              { label: t('admin.reportAvgClaimAmount'), value: formatCurrency(claimAnalysis.summary.averageClaimAmount) },
            ].map((item) => (
              <Card key={item.label} className="!p-5">
                <div className="text-sm text-[var(--text-secondary)]">{item.label}</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</div>
              </Card>
            ))}
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <Card className="!p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{t('admin.claimsByStatus')}</h3>
              <ReportBarChart rows={claimAnalysis.byStatus} />
            </Card>
            <Card className="!p-5">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">{t('admin.reportClaimsByMonth')}</h3>
              <ReportBarChart rows={claimAnalysis.byMonth} />
            </Card>
          </div>

          <div className="mb-8 grid gap-6 xl:grid-cols-2">
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {t('admin.reportClaimsByDealer')}
              </h2>
              <DataTable
                columns={[t('admin.reportDealer'), t('admin.count'), t('admin.reportAmount')]}
                rows={claimAnalysis.byDealer.map((row) => [row.label, row.count, formatCurrency(row.amount)])}
              />
            </section>
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {t('admin.reportClaimsByReason')}
              </h2>
              <DataTable
                columns={[t('admin.reportReason'), t('admin.count'), t('admin.reportAmount')]}
                rows={claimAnalysis.byReason.map((row) => [row.label, row.count, formatCurrency(row.amount)])}
              />
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {t('admin.reportRecentClaims')}
            </h2>
            <DataTable
              columns={[
                t('claims.claimNo'),
                t('admin.reportDealer'),
                t('orders.status'),
                t('admin.reportAmount'),
                t('admin.reportReason'),
                t('orders.date'),
              ]}
              rows={claimAnalysis.recentClaims.map((row) => [
                row.warrantyClaimNo,
                `${row.dealerName} (${row.dealerCode})`,
                <StatusBadge key={`${row.warrantyClaimNo}-status`} status={row.status} />,
                formatCurrency(row.claimAmount),
                row.reasonForClaim ?? '—',
                formatDate(row.createdAt),
              ])}
            />
          </section>
        </>
      ) : null}
    </AdminPageBody>
  );
}
