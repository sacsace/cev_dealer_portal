import {
  dealersApi,
  jobCardsApi,
  ordersApi,
  partsApi,
  warrantyClaimsApi,
} from '@/lib/api';

export interface AdminStats {
  totalDealers: number;
  todayOrders: number;
  pendingOrders: number;
  pendingJobCards: number;
  pendingClaims: number;
  lowStockParts: number;
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

export async function fetchAdminStats(): Promise<AdminStats> {
  const [
    dealers,
    todayOrdersRes,
    pendingOrders,
    pendingJobCards,
    pendingClaims,
    lowStock,
  ] = await Promise.all([
    dealersApi.list({ limit: '1' }),
    ordersApi.list({ limit: '100' }),
    ordersApi.list({ status: 'SUBMITTED', limit: '1' }),
    jobCardsApi.list({ limit: '100' }),
    warrantyClaimsApi.list({ limit: '100' }),
    partsApi.search({ stockStatus: 'out_of_stock', limit: '1' }),
  ]);

  const todayOrders = todayOrdersRes.data.filter((o) => isToday(o.createdAt)).length;
  const pendingJobCardCount = pendingJobCards.data.filter((j) =>
    ['SUBMITTED', 'UNDER_REVIEW'].includes(j.status),
  ).length;
  const pendingClaimCount = pendingClaims.data.filter((c) =>
    ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status),
  ).length;

  return {
    totalDealers: dealers.meta.total,
    todayOrders,
    pendingOrders: pendingOrders.meta.total,
    pendingJobCards: pendingJobCardCount,
    pendingClaims: pendingClaimCount,
    lowStockParts: lowStock.meta.total,
  };
}

export async function fetchReportSummary() {
  const [dealers, orders, jobCards, claims, parts, lowStock] = await Promise.all([
    dealersApi.list({ limit: '1' }),
    ordersApi.list({ limit: '500' }),
    jobCardsApi.list({ limit: '500' }),
    warrantyClaimsApi.list({ limit: '500' }),
    partsApi.search({ limit: '1' }),
    partsApi.search({ stockStatus: 'out_of_stock', limit: '500' }),
  ]);

  const ordersByStatus = orders.data.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const claimsByStatus = claims.data.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalDealers: dealers.meta.total,
    totalOrders: orders.meta.total,
    totalJobCards: jobCards.meta.total,
    totalClaims: claims.meta.total,
    totalParts: parts.meta.total,
    lowStockParts: lowStock.meta.total,
    ordersByStatus,
    claimsByStatus,
    lowStockList: lowStock.data,
  };
}
