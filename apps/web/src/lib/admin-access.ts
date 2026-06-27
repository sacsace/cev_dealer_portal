import type { AdminNavGroup } from './admin-nav';
import type { UserRole } from './auth';

/** Nav item keys visible to USER (dashboard is always shown separately). */
export const USER_ALLOWED_NAV_ITEM_KEYS = ['orders', 'job-cards', 'reports'] as const;

const USER_ALLOWED_PATH_PREFIXES = [
  '/admin/account',
  '/admin/orders',
  '/admin/job-cards',
  '/admin/reports',
];

function isStaffRole(role: UserRole | string | null | undefined): role is 'ROOT' | 'ADMIN' | 'USER' {
  return role === 'ROOT' || role === 'ADMIN' || role === 'USER';
}

export function canAccessAdminNavItem(
  role: UserRole | string | null | undefined,
  itemKey: string,
): boolean {
  if (!isStaffRole(role)) return false;
  if (role === 'ROOT' || role === 'ADMIN') return true;
  return (USER_ALLOWED_NAV_ITEM_KEYS as readonly string[]).includes(itemKey);
}

export function filterAdminNavGroups(
  role: UserRole | string | null | undefined,
  groups: AdminNavGroup[],
): AdminNavGroup[] {
  if (role === 'ROOT' || role === 'ADMIN') return groups;
  if (role !== 'USER') return [];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessAdminNavItem(role, item.key)),
    }))
    .filter((group) => group.items.length > 0);
}

export function canAccessAdminPath(role: UserRole | string | null | undefined, path: string): boolean {
  if (!isStaffRole(role)) return false;
  if (role === 'ROOT' || role === 'ADMIN') return true;
  if (path === '/admin') return true;
  return USER_ALLOWED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function canViewAdminOrganizationStats(role: UserRole | string | null | undefined): boolean {
  return role === 'ROOT' || role === 'ADMIN';
}

export function canViewAdminOrderStats(role: UserRole | string | null | undefined): boolean {
  return isStaffRole(role);
}

export function canViewAdminJobCardStats(role: UserRole | string | null | undefined): boolean {
  return isStaffRole(role);
}

export function canViewAdminClaimStats(role: UserRole | string | null | undefined): boolean {
  return role === 'ROOT' || role === 'ADMIN';
}

export function canViewAdminCatalogStats(role: UserRole | string | null | undefined): boolean {
  return role === 'ROOT' || role === 'ADMIN';
}

/** @deprecated Use canViewAdminJobCardStats / canViewAdminClaimStats */
export function canViewAdminServiceStats(role: UserRole | string | null | undefined): boolean {
  return canViewAdminJobCardStats(role) || canViewAdminClaimStats(role);
}
