import { getApiUrl } from '@/lib/env';
import { notifyCartUpdated } from '@/lib/cart-events';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  mobile?: string | null;
  role: 'ROOT' | 'ADMIN' | 'USER' | 'DEALER';
  dealer?: {
    id: string;
    dealerName: string;
    dealerCode: string;
    email: string;
    mobile?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    contactPerson?: string | null;
    gstNumber?: string | null;
  } | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { accessToken: string };
  localStorage.setItem('accessToken', data.accessToken);
  return true;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });

  if (
    res.status === 401 &&
    !retried &&
    path !== '/auth/login' &&
    path !== '/auth/refresh'
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  return res.json();
}

export async function apiUpload<T>(
  path: string,
  file: File,
  retried = false,
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${getApiUrl()}${path}`, { method: 'POST', headers, body: formData });

  if (res.status === 401 && !retried && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiUpload<T>(path, file, true);
    }
    clearSession();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Upload failed');
  }

  return res.json();
}

export function resolveFileUrl(fileUrl: string): string {
  const apiUrl = getApiUrl();
  const origin = apiUrl.replace(/\/api\/?$/, '');
  return `${origin}/api${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;
}

export const authApi = {
  login: (loginId: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password }),
    }),
  refresh: (refreshToken: string) =>
    fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  me: () => apiFetch<ApiUser>('/auth/me'),
  updateProfile: (data: { name?: string; email?: string; mobile?: string }) =>
    apiFetch<ApiUser>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  updateDealerProfile: (data: {
    dealerName?: string;
    email?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    contactPerson?: string;
  }) => apiFetch<ApiUser>('/auth/dealer', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const partsApi = {
  search: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch<{ data: Part[]; meta: PaginationMeta }>(`/parts?${query}`);
  },
  get: (id: string) => apiFetch<Part>(`/parts/${id}`),
  create: (data: CreatePartPayload) =>
    apiFetch<Part>('/parts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdatePartPayload) =>
    apiFetch<Part>(`/parts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<{ message: string }>(`/parts/${id}`, { method: 'DELETE' }),
  uploadImage: (id: string, file: File) =>
    apiUpload<PartImage>(`/parts/${id}/images`, file),
  removeImage: (id: string, imageId: string) =>
    apiFetch<{ message: string }>(`/parts/${id}/images/${imageId}`, { method: 'DELETE' }),
  downloadBulkTemplate: async () => {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/parts/bulk-template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message ?? 'Download failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cev-part-bulk-template.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  },
  bulkImport: (file: File) => apiUpload<PartBulkImportResult>('/parts/bulk', file),
};

export const dealersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: Dealer[]; meta: PaginationMeta }>(`/dealers${query}`);
  },
  nextCode: () => apiFetch<{ dealerCode: string }>('/dealers/next-code'),
  get: (id: string) => apiFetch<Dealer>(`/dealers/${id}`),
  create: (data: CreateDealerPayload) =>
    apiFetch<Dealer>('/dealers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateDealerPayload) =>
    apiFetch<Dealer>(`/dealers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<{ message: string }>(`/dealers/${id}`, { method: 'DELETE' }),
  downloadBulkTemplate: async () => {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/dealers/bulk-template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message ?? 'Download failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'cev-dealer-bulk-template.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  },
  bulkImport: (file: File) => apiUpload<DealerBulkImportResult>('/dealers/bulk', file),
};

export const usersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: StaffUser[]; meta: PaginationMeta }>(`/users${query}`);
  },
  get: (id: string) => apiFetch<StaffUser>(`/users/${id}`),
  create: (data: CreateStaffUserPayload) =>
    apiFetch<StaffUser>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateStaffUserPayload) =>
    apiFetch<StaffUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  get: async () => {
    const cart = await apiFetch<CartResponse>('/cart');
    notifyCartUpdated(cart.itemCount);
    return cart;
  },
  addItem: async (partId: string, quantity: number) => {
    const cart = await apiFetch<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ partId, quantity }),
    });
    notifyCartUpdated(cart.itemCount);
    return cart;
  },
  updateItem: async (id: string, quantity: number) => {
    const cart = await apiFetch<CartResponse>(`/cart/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    notifyCartUpdated(cart.itemCount);
    return cart;
  },
  removeItem: async (id: string) => {
    const cart = await apiFetch<CartResponse>(`/cart/items/${id}`, { method: 'DELETE' });
    notifyCartUpdated(cart.itemCount);
    return cart;
  },
};

export const ordersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: Order[]; meta: PaginationMeta }>(`/orders${query}`);
  },
  get: (id: string) => apiFetch<Order>(`/orders/${id}`),
  create: (data: Record<string, string | number>) =>
    apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  downloadProformaInvoice: async (id: string) => {
    const token = getToken();
    const res = await fetch(`${getApiUrl()}/orders/${id}/proforma-invoice`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message ?? 'Download failed');
    }

    const blob = await res.blob();
    const invoiceNo =
      res.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] ??
      `proforma-${id}.pdf`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = invoiceNo.endsWith('.pdf') ? invoiceNo : `${invoiceNo}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  approve: (id: string) => apiFetch<Order>(`/orders/${id}/approve`, { method: 'PUT' }),
  reject: (id: string, reason?: string) =>
    apiFetch<Order>(`/orders/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason: reason ?? 'Rejected by admin' }),
    }),
  updateShipment: (
    id: string,
    data: {
      deliveryStatus: string;
      courierName?: string;
      trackingNo?: string;
      note?: string;
    },
  ) =>
    apiFetch<Order>(`/orders/${id}/shipment`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) => apiFetch<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),
};

export const jobCardsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: JobCard[]; meta: PaginationMeta }>(`/job-cards${query}`);
  },
  get: (id: string) => apiFetch<JobCard>(`/job-cards/${id}`),
  lookupByVin: (vin: string) =>
    apiFetch<{ carModelId: string | null; carModelName: string | null }>(
      `/job-cards/lookup/by-vin/${encodeURIComponent(vin)}`,
    ),
  create: (data: Record<string, unknown>) =>
    apiFetch<JobCard>('/job-cards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<JobCard>(`/job-cards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  review: (id: string, data: { status: string; observation?: string; rectification?: string }) =>
    apiFetch<JobCard>(`/job-cards/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  markReceived: (id: string) =>
    apiFetch<JobCard>(`/job-cards/${id}/receive`, { method: 'PUT', body: JSON.stringify({}) }),
  uploadFile: (id: string, file: File) =>
    apiUpload<JobCardFile>(`/job-cards/${id}/files`, file),
  removeFile: (id: string, fileId: string) =>
    apiFetch<{ message: string }>(`/job-cards/${id}/files/${fileId}`, { method: 'DELETE' }),
  remove: (id: string) =>
    apiFetch<{ message: string }>(`/job-cards/${id}`, { method: 'DELETE' }),
};

export const warrantyClaimsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: WarrantyClaim[]; meta: PaginationMeta }>(
      `/warranty-claims${query}`,
    );
  },
  get: (id: string) => apiFetch<WarrantyClaim>(`/warranty-claims/${id}`),
  create: (data: Record<string, unknown>) =>
    apiFetch<WarrantyClaim>('/warranty-claims', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Record<string, unknown>) =>
    apiFetch<WarrantyClaim>(`/warranty-claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<{ message: string }>(`/warranty-claims/${id}`, { method: 'DELETE' }),
  submit: (id: string) =>
    apiFetch<WarrantyClaim>(`/warranty-claims/${id}/submit`, { method: 'PUT' }),
  approve: (id: string) =>
    apiFetch<WarrantyClaim>(`/warranty-claims/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({}),
    }),
  reject: (id: string, reason?: string) =>
    apiFetch<WarrantyClaim>(`/warranty-claims/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectReason: reason ?? 'Rejected by admin' }),
    }),
};

export const lookupApi = {
  categories: () => apiFetch<Category[]>('/lookup/categories'),
  models: () => apiFetch<VehicleModel[]>('/lookup/models'),
  problemTypes: () => apiFetch<ProblemType[]>('/lookup/problem-types'),
  jobCardTypes: () => apiFetch<JobCardType[]>('/lookup/job-card-types'),
  fitments: () => apiFetch<Fitment[]>('/lookup/fitments'),
};

function createManageCrudApi<T, CreatePayload, UpdatePayload = Partial<CreatePayload>>(basePath: string) {
  return {
    list: (params?: Record<string, string>) => {
      const query = params ? `?${new URLSearchParams(params)}` : '';
      return apiFetch<{ data: T[]; meta: PaginationMeta }>(`${basePath}/manage${query}`);
    },
    get: (id: string) => apiFetch<T>(`${basePath}/${id}`),
    create: (data: CreatePayload) =>
      apiFetch<T>(basePath, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdatePayload) =>
      apiFetch<T>(`${basePath}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: string) =>
      apiFetch<{ message: string }>(`${basePath}/${id}`, { method: 'DELETE' }),
  };
}

export const categoriesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    return apiFetch<{ data: Category[]; meta: PaginationMeta }>(`/lookup/categories/manage${query}`);
  },
  get: (id: string) => apiFetch<Category>(`/lookup/categories/${id}`),
  create: (data: { name: string; description?: string; status?: string }) =>
    apiFetch<Category>('/lookup/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; description?: string; status?: string }) =>
    apiFetch<Category>(`/lookup/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    apiFetch<{ message: string }>(`/lookup/categories/${id}`, { method: 'DELETE' }),
};

export const vehicleModelsApi = createManageCrudApi<
  VehicleModel,
  CreateVehicleModelPayload,
  UpdateVehicleModelPayload
>('/lookup/models');

export const problemTypesApi = createManageCrudApi<
  ProblemType,
  CreateProblemTypePayload,
  UpdateProblemTypePayload
>('/lookup/problem-types');

export const jobCardTypesApi = createManageCrudApi<
  JobCardType,
  CreateJobCardTypePayload,
  UpdateJobCardTypePayload
>('/lookup/job-card-types');

export const fitmentsApi = createManageCrudApi<
  Fitment,
  CreateFitmentPayload,
  UpdateFitmentPayload
>('/lookup/fitments');

export interface ReportFilters {
  from?: string;
  to?: string;
  dealerId?: string;
}

export interface ReportCountAmountRow {
  key: string;
  label: string;
  count: number;
  amount: number;
}

export interface ReportSummary {
  filters: { from: string | null; to: string | null; dealerId: string | null };
  totalDealers: number;
  totalOrders: number;
  totalJobCards: number;
  totalClaims: number;
  totalParts: number;
  lowStockParts: number;
  orderTotalAmount: number;
  claimTotalAmount: number;
  ordersByStatus: Record<string, number>;
  claimsByStatus: Record<string, number>;
  lowStockList: Array<{
    partNumber: string;
    partName: string;
    stockQuantity: number;
    dealerPrice: number;
  }>;
}

export interface OrderAnalysisReport {
  filters: { from: string | null; to: string | null; dealerId: string | null };
  summary: {
    totalCount: number;
    totalAmount: number;
    averageOrderValue: number;
    approvedCount: number;
    pendingCount: number;
  };
  byStatus: ReportCountAmountRow[];
  byDealer: ReportCountAmountRow[];
  byMonth: ReportCountAmountRow[];
  topParts: Array<ReportCountAmountRow & { quantity: number }>;
  recentOrders: Array<{
    orderNo: string;
    dealerCode: string;
    dealerName: string;
    status: string;
    grandTotal: number;
    createdAt: string;
  }>;
}

export interface ClaimAnalysisReport {
  filters: { from: string | null; to: string | null; dealerId: string | null };
  summary: {
    totalCount: number;
    totalAmount: number;
    approvedAmount: number;
    pendingCount: number;
    averageClaimAmount: number;
  };
  byStatus: ReportCountAmountRow[];
  byDealer: ReportCountAmountRow[];
  byMonth: ReportCountAmountRow[];
  byReason: ReportCountAmountRow[];
  recentClaims: Array<{
    warrantyClaimNo: string;
    dealerCode: string;
    dealerName: string;
    status: string;
    claimAmount: number;
    reasonForClaim?: string | null;
    createdAt: string;
  }>;
}

export interface MailSettings {
  enabled: boolean;
  from: string;
  fromName: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPasswordSet: boolean;
}

export type UpdateMailSettingsPayload = Partial<
  MailSettings & { smtpPassword?: string }
>;

export interface TrafficStatsReport {
  filters: { from: string | null; to: string | null };
  summary: {
    totalVisits: number;
    uniquePaths: number;
    productViews: number;
    siteAccess: number;
  };
  byPath: Array<{ path: string; count: number }>;
  byProductPath: Array<{ path: string; count: number }>;
  byAccessPath: Array<{ path: string; count: number }>;
  byRole: Array<{ role: string; count: number }>;
  byDay: Array<{ day: string; count: number }>;
}

export interface ClaimHandlerStatsReport {
  filters: ReportFilters & { dealerId?: string | null };
  summary: {
    handlerCount: number;
    totalHandled: number;
    totalApproved: number;
    totalRejected: number;
  };
  handlers: Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    approved: number;
    rejected: number;
    total: number;
  }>;
}

function buildReportQuery(filters: ReportFilters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.dealerId) params.set('dealerId', filters.dealerId);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const settingsApi = {
  getMail: () => apiFetch<MailSettings>('/settings/mail'),
  updateMail: (data: UpdateMailSettingsPayload) =>
    apiFetch<MailSettings>('/settings/mail', { method: 'PATCH', body: JSON.stringify(data) }),
  testMail: (to: string) =>
    apiFetch<{ message: string }>('/settings/mail/test', {
      method: 'POST',
      body: JSON.stringify({ to }),
    }),
  getTraffic: (filters?: ReportFilters) =>
    apiFetch<TrafficStatsReport>(`/settings/traffic${buildReportQuery(filters)}`),
};

export const analyticsApi = {
  recordVisit: (path: string, referrer?: string) =>
    apiFetch<{ ok: boolean }>('/analytics/visits', {
      method: 'POST',
      body: JSON.stringify({ path, referrer }),
    }),
};

export const reportsApi = {
  summary: (filters?: ReportFilters) =>
    apiFetch<ReportSummary>(`/reports/summary${buildReportQuery(filters)}`),
  orderAnalysis: (filters?: ReportFilters) =>
    apiFetch<OrderAnalysisReport>(`/reports/orders/analysis${buildReportQuery(filters)}`),
  claimAnalysis: (filters?: ReportFilters) =>
    apiFetch<ClaimAnalysisReport>(`/reports/claims/analysis${buildReportQuery(filters)}`),
  claimHandlerStats: (filters?: ReportFilters) =>
    apiFetch<ClaimHandlerStatsReport>(`/reports/claims/handlers${buildReportQuery(filters)}`),
  exportExcel: async (type: 'summary' | 'orders' | 'claims', filters?: ReportFilters) => {
    const params = new URLSearchParams({ type });
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.dealerId) params.set('dealerId', filters.dealerId);

    const token = getToken();
    const res = await fetch(`${getApiUrl()}/reports/export?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message ?? 'Export failed');
    }

    const blob = await res.blob();
    const stamp = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cev-report-${type}-${stamp}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PartImage {
  id: string;
  url: string;
  isPrimary?: boolean;
}

export interface Part {
  id: string;
  partNumber: string;
  partName: string;
  description?: string;
  imageUrl?: string | null;
  dealerPrice: number | string;
  mrp: number | string;
  gstRate: number | string;
  stockQuantity: number;
  minimumOrderQty: number;
  warrantyAvailable: boolean;
  status: string;
  category?: { id: string; name: string };
  categoryId?: string;
  modelMappings?: Array<{ modelId: string; model: { id: string; modelName: string } }>;
  images?: PartImage[];
  createdAt?: string;
}

export interface CartResponse {
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    gstAmount: number;
    totalAmount: number;
    part: Part;
  }>;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
  itemCount: number;
}

export interface Dealer {
  id: string;
  dealerName: string;
  dealerCode: string;
  email: string;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  gstNumber?: string | null;
  contactPerson?: string | null;
  contactUserId?: string | null;
  contactUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  loginId?: string | null;
  status: string;
  createdAt: string;
}

export interface CreateDealerPayload {
  dealerName: string;
  dealerCode?: string;
  email: string;
  password: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  contactPerson?: string;
  contactUserId?: string;
  loginId?: string;
  status?: string;
}

export interface DealerBulkImportResult {
  created: number;
  failed: Array<{ row: number; dealerName?: string; error: string }>;
}

export interface PartBulkImportResult {
  created: number;
  failed: Array<{ row: number; partNumber?: string; error: string }>;
}

export type UpdateDealerPayload = Partial<Omit<CreateDealerPayload, 'dealerCode'>>;

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  loginId?: string | null;
  mobile?: string | null;
  role: 'ROOT' | 'ADMIN' | 'USER';
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'ROOT' | 'ADMIN' | 'USER';
  loginId?: string;
  mobile?: string;
  status?: string;
}

export type UpdateStaffUserPayload = Partial<Omit<CreateStaffUserPayload, 'password'>> & {
  password?: string;
};

export interface OrderItem {
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number | string;
  gstAmount?: number | string;
  totalAmount: number | string;
}

export interface OrderShipment {
  courierName?: string;
  trackingNo?: string;
  deliveryStatus?: string;
  dispatchDate?: string;
  deliveryDate?: string;
}

export interface OrderInvoice {
  id: string;
  invoiceNo: string;
  invoiceUrl?: string;
  invoiceAmount?: number | string;
  createdAt?: string;
}

export interface OrderReviewEntry {
  id: string;
  action: string;
  status?: string | null;
  deliveryStatus?: string | null;
  courierName?: string | null;
  trackingNo?: string | null;
  note?: string | null;
  authorId?: string | null;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: string;
  createdAt: string;
  grandTotal: number | string;
  subtotal?: number | string;
  gstAmount?: number | string;
  freightCharge?: number | string;
  billingAddress?: string;
  shippingAddress?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  items: OrderItem[];
  dealer?: { dealerName: string; dealerCode: string };
  shipment?: OrderShipment;
  invoice?: OrderInvoice | null;
  reviewEntries?: OrderReviewEntry[];
}

export interface JobCardFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt?: string;
}

export interface JobCardReviewEntry {
  id: string;
  status?: string | null;
  observation?: string | null;
  rectification?: string | null;
  authorId?: string | null;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export interface JobCard {
  id: string;
  jobCardNo: string;
  jobCardDate: string;
  carModelId?: string | null;
  carModelName?: string | null;
  carModel?: { id: string; modelName: string; modelCode?: string } | null;
  customerName: string;
  vin: string;
  mobile: string;
  fitment?: string | null;
  gdmsNo?: string | null;
  type?: string | null;
  kilometers?: number | null;
  place?: string | null;
  checkedBy?: string | null;
  typeOfProblem?: string | null;
  jobType?: string | null;
  registrationNumber?: string | null;
  dateOfFitment?: string | null;
  customerAddress?: string | null;
  customerComplaint?: string | null;
  notes?: string | null;
  observation?: string | null;
  rectification?: string | null;
  status: string;
  files?: JobCardFile[];
  reviewEntries?: JobCardReviewEntry[];
  dealer?: { dealerName: string; dealerCode: string };
}

export interface WarrantyClaim {
  id: string;
  warrantyClaimNo: string;
  warrantyClaimDate: string;
  invoiceNo: string;
  jobCardNo?: string | null;
  vin?: string | null;
  carModelName?: string | null;
  partNumber?: string | null;
  partName?: string | null;
  quantity?: number | null;
  claimAmount?: number | string | null;
  reasonForClaim?: string | null;
  problemDescription?: string | null;
  place?: string | null;
  status: string;
  dealer?: { dealerName: string; dealerCode: string };
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePartPayload {
  partNumber: string;
  partName: string;
  categoryId: string;
  description?: string;
  mrp: number;
  dealerPrice: number;
  gstRate?: number;
  stockQuantity?: number;
  minimumOrderQty?: number;
  warrantyAvailable?: boolean;
  status?: string;
  modelIds?: string[];
}

export type UpdatePartPayload = Partial<Omit<CreatePartPayload, 'partNumber'>>;

export interface VehicleModel {
  id: string;
  modelName: string;
  modelCode: string;
  year?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleModelPayload {
  modelName: string;
  modelCode: string;
  year?: string;
  status?: string;
}

export type UpdateVehicleModelPayload = Partial<CreateVehicleModelPayload>;

export interface ProblemType {
  id: string;
  name: string;
  nameEn?: string | null;
  sortOrder: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProblemTypePayload {
  name: string;
  nameEn?: string;
  sortOrder?: number;
  status?: string;
}

export type UpdateProblemTypePayload = Partial<CreateProblemTypePayload>;

export interface JobCardType {
  id: string;
  name: string;
  nameEn?: string | null;
  sortOrder: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobCardTypePayload {
  name: string;
  nameEn?: string;
  sortOrder?: number;
  status?: string;
}

export type UpdateJobCardTypePayload = Partial<CreateJobCardTypePayload>;

export interface Fitment {
  id: string;
  name: string;
  nameEn?: string | null;
  sortOrder: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFitmentPayload {
  name: string;
  nameEn?: string;
  sortOrder?: number;
  status?: string;
}

export type UpdateFitmentPayload = Partial<CreateFitmentPayload>;

export function saveSession(data: LoginResponse) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
}

export function updateSessionUser(user: ApiUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

export async function refreshSession(): Promise<ApiUser | null> {
  if (typeof window === 'undefined') return null;

  if (!getToken() && !getRefreshToken()) {
    clearSession();
    return null;
  }

  try {
    const user = await authApi.me();
    updateSessionUser(user);
    return user;
  } catch {
    const refreshed = await tryRefreshAccessToken();
    if (!refreshed) {
      clearSession();
      return null;
    }

    try {
      const user = await authApi.me();
      updateSessionUser(user);
      return user;
    } catch {
      clearSession();
      return null;
    }
  }
}

export function getSession(): ApiUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as ApiUser;
    if (!user?.role) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export async function logoutSession() {
  try {
    if (getToken()) {
      await authApi.logout();
    }
  } catch {
    // Ignore network/auth errors during logout.
  } finally {
    clearSession();
  }
}
