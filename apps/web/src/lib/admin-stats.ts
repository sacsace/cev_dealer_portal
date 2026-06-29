import {
  dealersApi,
  jobCardsApi,
  ordersApi,
  partsApi,
  warrantyClaimsApi,
  type ApiUser,
} from '@/lib/api';
import {
  canViewAdminCatalogStats,
  canViewAdminClaimStats,
  canViewAdminJobCardStats,
  canViewAdminOrderStats,
  canViewAdminOrganizationStats,
} from '@/lib/admin-access';

export interface AdminStats {
  totalDealers: number;
  todayOrders: number;
  pendingOrders: number;
  pendingJobCards: number;
  pendingClaims: number;
  lowStockParts: number;
}

export interface AdminDashboardCharts {
  ordersByStatus: Array<{ label: string; count: number }>;
  claimsByStatus: Array<{ label: string; count: number }>;
  ordersLast7Days: Array<{ label: string; count: number }>;
}

export interface AdminDashboardData {
  stats: AdminStats;
  charts: AdminDashboardCharts;
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function buildLast7DaysTrend(orders: Array<{ createdAt: string }>) {
  const buckets: Array<{ label: string; dateKey: string; count: number }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      dateKey: d.toISOString().slice(0, 10),
      count: 0,
    });
  }

  for (const order of orders) {
    const key = order.createdAt.slice(0, 10);
    const bucket = buckets.find((b) => b.dateKey === key);
    if (bucket) bucket.count += 1;
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

function toStatusRows(record: Record<string, number>) {
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

export async function fetchAdminDashboardData(role?: ApiUser['role'] | null): Promise<AdminDashboardData> {
  const includeOrganization = canViewAdminOrganizationStats(role);
  const includeOrders = canViewAdminOrderStats(role);
  const includeJobCards = canViewAdminJobCardStats(role);
  const includeClaims = canViewAdminClaimStats(role);
  const includeCatalog = canViewAdminCatalogStats(role);

  const [
    dealers,
    ordersRes,
    pendingOrders,
    pendingJobCards,
    pendingClaims,
    lowStock,
    serviceClaimsRes,
  ] = await Promise.all([
    includeOrganization ? dealersApi.list({ limit: '1' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
    includeOrders ? ordersApi.list({ limit: '500' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
    includeOrders ? ordersApi.list({ status: 'SUBMITTED', limit: '1' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
    includeJobCards ? jobCardsApi.list({ limit: '100' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
    includeClaims ? warrantyClaimsApi.list({ limit: '100' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
    includeCatalog ? partsApi.search({ stockStatus: 'out_of_stock', limit: '1' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
    includeClaims ? warrantyClaimsApi.list({ limit: '500' }) : Promise.resolve({ data: [], meta: { total: 0 } }),
  ]);

  const todayOrders = ordersRes.data.filter((o) => isToday(o.createdAt)).length;
  const pendingJobCardCount = pendingJobCards.data.filter((j) =>
    ['CREATED', 'SUBMITTED', 'UNDER_REVIEW'].includes(j.status),
  ).length;
  const pendingClaimCount = pendingClaims.data.filter((c) =>
    ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status),
  ).length;

  const ordersByStatus = ordersRes.data.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const claimsByStatus = serviceClaimsRes.data.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    stats: {
      totalDealers: dealers.meta.total,
      todayOrders,
      pendingOrders: pendingOrders.meta.total,
      pendingJobCards: pendingJobCardCount,
      pendingClaims: pendingClaimCount,
      lowStockParts: lowStock.meta.total,
    },
    charts: {
      ordersByStatus: toStatusRows(ordersByStatus),
      claimsByStatus: toStatusRows(claimsByStatus),
      ordersLast7Days: includeOrders ? buildLast7DaysTrend(ordersRes.data) : buildLast7DaysTrend([]),
    },
  };
}
