import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FolderPlus,
  Car,
  Layers,
  AlertCircle,
  Tag,
  ShoppingCart,
  Wrench,
  ShieldCheck,
  BarChart3,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminNavItem = {
  key: string;
  labelKey: string;
  href: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
};

export type AdminNavGroup = {
  key: string;
  labelKey: string;
  items: AdminNavItem[];
};

export const adminDashboardItem: AdminNavItem = {
  key: 'dashboard',
  labelKey: 'admin.dashboard',
  href: '/admin',
  icon: LayoutDashboard,
  match: (p) => p === '/admin',
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    key: 'organization',
    labelKey: 'admin.navOrganization',
    items: [
      {
        key: 'dealers',
        labelKey: 'admin.dealerMgmt',
        href: '/admin/dealers',
        icon: Building2,
        match: (p) => p.startsWith('/admin/dealers'),
      },
      {
        key: 'users',
        labelKey: 'admin.userMgmt',
        href: '/admin/users',
        icon: Users,
        match: (p) => p.startsWith('/admin/users'),
      },
    ],
  },
  {
    key: 'catalog',
    labelKey: 'admin.navCatalog',
    items: [
      {
        key: 'catalog-register',
        labelKey: 'admin.catalogMgmt',
        href: '/admin/catalog',
        icon: FolderPlus,
        match: (p) => p.startsWith('/admin/catalog') || p.startsWith('/admin/parts/catalog'),
      },
      {
        key: 'parts',
        labelKey: 'admin.partsMgmt',
        href: '/admin/parts',
        icon: Package,
        match: (p) => p.startsWith('/admin/parts') && !p.includes('/catalog'),
      },
      {
        key: 'models',
        labelKey: 'admin.modelMgmt',
        href: '/admin/models',
        icon: Car,
        match: (p) => p.startsWith('/admin/models'),
      },
      {
        key: 'fitments',
        labelKey: 'admin.fitmentMgmt',
        href: '/admin/fitments',
        icon: Layers,
        match: (p) => p.startsWith('/admin/fitments'),
      },
    ],
  },
  {
    key: 'orders',
    labelKey: 'admin.navOrders',
    items: [
      {
        key: 'orders',
        labelKey: 'admin.orderMgmt',
        href: '/admin/orders',
        icon: ShoppingCart,
        match: (p) => p.startsWith('/admin/orders'),
      },
    ],
  },
  {
    key: 'service',
    labelKey: 'admin.navService',
    items: [
      {
        key: 'job-cards',
        labelKey: 'admin.jobCardMgmt',
        href: '/admin/job-cards',
        icon: Wrench,
        match: (p) => p.startsWith('/admin/job-cards'),
      },
      {
        key: 'problem-types',
        labelKey: 'admin.problemTypeMgmt',
        href: '/admin/problem-types',
        icon: AlertCircle,
        match: (p) => p.startsWith('/admin/problem-types'),
      },
      {
        key: 'types',
        labelKey: 'admin.jobCardTypeMgmt',
        href: '/admin/types',
        icon: Tag,
        match: (p) => p.startsWith('/admin/types'),
      },
      {
        key: 'claims',
        labelKey: 'admin.claimMgmt',
        href: '/admin/claims',
        icon: ShieldCheck,
        match: (p) => p.startsWith('/admin/claims'),
      },
    ],
  },
  {
    key: 'analytics',
    labelKey: 'admin.navAnalytics',
    items: [
      {
        key: 'reports',
        labelKey: 'admin.reports',
        href: '/admin/reports',
        icon: BarChart3,
        match: (p) => p.startsWith('/admin/reports'),
      },
    ],
  },
  {
    key: 'system',
    labelKey: 'admin.navSystem',
    items: [
      {
        key: 'settings',
        labelKey: 'admin.settings',
        href: '/admin/settings',
        icon: Settings,
        match: (p) => p.startsWith('/admin/settings'),
      },
    ],
  },
];

export function getAllAdminNavItems(): AdminNavItem[] {
  return [adminDashboardItem, ...adminNavGroups.flatMap((g) => g.items)];
}
