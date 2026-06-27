import {
  BarChart3,
  Building2,
  FolderPlus,
  Package,
  ShieldCheck,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { canAccessAdminPath } from '@/lib/admin-access';
import type { UserRole } from '@/lib/auth';

export type AdminQuickAction = {
  key: string;
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const adminQuickActions: AdminQuickAction[] = [
  { key: 'dealer-new', labelKey: 'admin.dealerRegister', href: '/admin/dealers/new', icon: Building2 },
  { key: 'operator', labelKey: 'admin.operatorRegister', href: '/admin/users', icon: Users },
  { key: 'orders', labelKey: 'admin.orderMgmt', href: '/admin/orders', icon: ShoppingCart },
  { key: 'parts-new', labelKey: 'admin.productRegister', href: '/admin/parts/new', icon: Package },
  { key: 'category-new', labelKey: 'admin.catalogRegister', href: '/admin/catalog/new', icon: FolderPlus },
  { key: 'job-cards', labelKey: 'admin.jobCardMgmt', href: '/admin/job-cards', icon: Wrench },
  { key: 'claims', labelKey: 'admin.claimMgmt', href: '/admin/claims', icon: ShieldCheck },
  { key: 'reports', labelKey: 'admin.reports', href: '/admin/reports', icon: BarChart3 },
];

export function filterAdminQuickActions(role: UserRole | string | null | undefined) {
  return adminQuickActions.filter((action) => canAccessAdminPath(role, action.href));
}
