import type { AdminNavGroup } from './admin-nav';
import type { UserRole } from './auth';

/** Nav groups hidden from USER — ROOT and ADMIN always have access. */
export const USER_RESTRICTED_NAV_GROUP_KEYS = ['organization', 'service'] as const;

const USER_RESTRICTED_PATH_PREFIXES = [
  '/admin/dealers',
  '/admin/users',
  '/admin/job-cards',
  '/admin/claims',
  '/admin/problem-types',
  '/admin/types',
];

function isStaffRole(role: UserRole | string | null | undefined): role is 'ROOT' | 'ADMIN' | 'USER' {
  return role === 'ROOT' || role === 'ADMIN' || role === 'USER';
}

export function isUserRestrictedNavGroup(groupKey: string): boolean {
  return (USER_RESTRICTED_NAV_GROUP_KEYS as readonly string[]).includes(groupKey);
}

export function canAccessAdminNavGroup(role: UserRole | string | null | undefined, groupKey: string): boolean {
  if (!isStaffRole(role)) return false;
  if (role === 'ROOT' || role === 'ADMIN') return true;
  return !isUserRestrictedNavGroup(groupKey);
}

export function filterAdminNavGroups(
  role: UserRole | string | null | undefined,
  groups: AdminNavGroup[],
): AdminNavGroup[] {
  return groups.filter((group) => canAccessAdminNavGroup(role, group.key));
}

export function canAccessAdminPath(role: UserRole | string | null | undefined, path: string): boolean {
  if (!isStaffRole(role)) return false;
  if (role === 'ROOT' || role === 'ADMIN') return true;
  return !USER_RESTRICTED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function canViewAdminOrganizationStats(role: UserRole | string | null | undefined): boolean {
  return role === 'ROOT' || role === 'ADMIN';
}

export function canViewAdminOrderStats(role: UserRole | string | null | undefined): boolean {
  return isStaffRole(role);
}

export function canViewAdminServiceStats(role: UserRole | string | null | undefined): boolean {
  return role === 'ROOT' || role === 'ADMIN';
}
