import type { BackstageUserRole } from '@/lib/backstage/users'

export const USER_ROLE_LABELS: Record<BackstageUserRole, string> = {
  GUEST: 'Гість',
  USER: 'Покупець',
  WHOLESALER: 'Оптовик',
  ADMIN: 'Адміністратор',
  MANAGER: 'Менеджер',
}

export const CUSTOMER_ROLE_LABELS: Record<'USER' | 'WHOLESALER', string> = {
  USER: 'Роздріб',
  WHOLESALER: 'Гурт',
}

export const STAFF_ROLE_OPTIONS = [
  { value: 'MANAGER' as const, label: USER_ROLE_LABELS.MANAGER },
  { value: 'ADMIN' as const, label: USER_ROLE_LABELS.ADMIN },
]

export const CUSTOMER_ROLE_OPTIONS = [
  { value: 'USER' as const, label: CUSTOMER_ROLE_LABELS.USER },
  { value: 'WHOLESALER' as const, label: CUSTOMER_ROLE_LABELS.WHOLESALER },
]

export function isStaffRole(role: BackstageUserRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER'
}

export function customerRoleLabel(role: BackstageUserRole): string {
  if (role === 'USER' || role === 'WHOLESALER') return CUSTOMER_ROLE_LABELS[role]
  return USER_ROLE_LABELS[role] ?? role
}
