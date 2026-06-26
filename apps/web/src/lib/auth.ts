import type { ApiUser } from './api';

export type UserRole = ApiUser['role'];

export const OPERATOR_ROLES: UserRole[] = ['ROOT', 'ADMIN', 'USER'];

export function isOperator(role?: string | null): role is UserRole {
  return !!role && OPERATOR_ROLES.includes(role as UserRole);
}

export function isDealer(role?: string | null): boolean {
  return role === 'DEALER';
}

export function getRoleHome(role?: string | null): string {
  if (isOperator(role)) return '/admin';
  if (isDealer(role)) return '/dealer';
  return '/login';
}

export function canAccessDealer(role?: string | null): boolean {
  return isDealer(role);
}

export function canAccessAdmin(role?: string | null): boolean {
  return isOperator(role);
}
