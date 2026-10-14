/**
 * Mirrors backend permission registry keys used by Backoffice UI / BFF.
 * Keep in sync with green-angels-backend/src/auth/permissions/permission.registry.ts
 */

export type StaffPermission =
  | 'backoffice.access'
  | 'plantstock.access'
  | 'catalog.view'
  | 'catalog.edit'
  | 'catalog.import'
  | 'photos.view'
  | 'photos.manage'
  | 'orders.view'
  | 'orders.manage'
  | 'orders.dictionaries'
  | 'dispatch.calendar'
  | 'contract.withdrawals'
  | 'customers.view'
  | 'customers.edit'
  | 'carts.view'
  | 'wholesale.inquiries'
  | 'stock.notifications'
  | 'promotions.manage'
  | 'referrals.manage'
  | 'marketing.subscribers'
  | 'reviews.manage'
  | 'google.merchant'
  | 'content.blog'
  | 'content.pages'
  | 'legal.manage'
  | 'site.localization'
  | 'site.navigation'
  | 'site.redirects'
  | 'site.reference'
  | 'supplier.invoices'
  | 'tedb.manage'
  | 'jobs.view'
  | 'settings.view'
  | 'settings.manage'
  | 'flexi.view'
  | 'flexi.manage'
  | 'flexi.admin'
  | 'staff.manage'
  | 'plantstock.settings'
  | 'plantstock.catalog.sync'
  | 'reservations.view'

/** Path prefix → any of these permissions grants nav/page access. */
export const BACKSTAGE_PATH_PERMISSIONS: Array<{
  prefix: string
  anyOf: StaffPermission[]
}> = [
  { prefix: '/backstage/categories', anyOf: ['catalog.view', 'catalog.edit'] },
  { prefix: '/backstage/attributes', anyOf: ['catalog.view', 'catalog.edit'] },
  { prefix: '/backstage/characteristics', anyOf: ['catalog.view', 'catalog.edit'] },
  { prefix: '/backstage/products', anyOf: ['catalog.view', 'catalog.edit'] },
  { prefix: '/backstage/import', anyOf: ['catalog.import'] },
  { prefix: '/backstage/photos', anyOf: ['photos.view', 'photos.manage'] },
  { prefix: '/backstage/orders', anyOf: ['orders.view', 'orders.manage'] },
  { prefix: '/backstage/carts', anyOf: ['carts.view'] },
  { prefix: '/backstage/users', anyOf: ['customers.view', 'customers.edit', 'staff.manage'] },
  { prefix: '/backstage/promotions', anyOf: ['promotions.manage'] },
  { prefix: '/backstage/referrals', anyOf: ['referrals.manage'] },
  { prefix: '/backstage/marketing-subscribers', anyOf: ['marketing.subscribers'] },
  { prefix: '/backstage/reviews', anyOf: ['reviews.manage'] },
  { prefix: '/backstage/wholesale-inquiries', anyOf: ['wholesale.inquiries'] },
  { prefix: '/backstage/stock-notifications', anyOf: ['stock.notifications'] },
  { prefix: '/backstage/blog', anyOf: ['content.blog'] },
  { prefix: '/backstage/home', anyOf: ['content.pages'] },
  { prefix: '/backstage/about', anyOf: ['content.pages'] },
  { prefix: '/backstage/wholesale', anyOf: ['content.pages'] },
  { prefix: '/backstage/legal', anyOf: ['legal.manage'] },
  { prefix: '/backstage/supplier-invoices', anyOf: ['supplier.invoices'] },
  { prefix: '/backstage/order-dictionaries', anyOf: ['orders.dictionaries'] },
  { prefix: '/backstage/dispatch-calendar', anyOf: ['dispatch.calendar', 'settings.manage'] },
  { prefix: '/backstage/contract-withdrawals', anyOf: ['contract.withdrawals'] },
  { prefix: '/backstage/localization', anyOf: ['site.localization', 'settings.manage'] },
  { prefix: '/backstage/navigation', anyOf: ['site.navigation', 'settings.manage'] },
  { prefix: '/backstage/redirects', anyOf: ['site.redirects'] },
  { prefix: '/backstage/reference-data', anyOf: ['site.reference'] },
  { prefix: '/backstage/tedb', anyOf: ['tedb.manage'] },
  { prefix: '/backstage/jobs', anyOf: ['jobs.view'] },
  { prefix: '/backstage/google-merchant', anyOf: ['google.merchant'] },
  { prefix: '/backstage/settings', anyOf: ['settings.view', 'settings.manage'] },
]

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  staffRole: string | undefined,
  required: StaffPermission[],
): boolean {
  if (staffRole === 'ADMIN') return true
  if (!permissions?.length || required.length === 0) return false
  const set = new Set(permissions)
  return required.some((p) => set.has(p))
}

export function canAccessBackstagePath(
  pathname: string,
  permissions: readonly string[] | undefined,
  staffRole: string | undefined,
): boolean {
  if (staffRole === 'ADMIN') return true
  if (pathname === '/backstage' || pathname === '/backstage/') {
    return hasAnyPermission(permissions, staffRole, ['backoffice.access'])
  }
  const match = BACKSTAGE_PATH_PERMISSIONS.find(
    (row) => pathname === row.prefix || pathname.startsWith(`${row.prefix}/`),
  )
  if (!match) {
    return hasAnyPermission(permissions, staffRole, ['backoffice.access'])
  }
  return hasAnyPermission(permissions, staffRole, match.anyOf)
}
