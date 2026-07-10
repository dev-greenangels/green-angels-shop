import { stripLocalePrefix } from '@/lib/locale-path'

/** Шляхи, доступні лише після входу в акаунт клієнта. */
export function isCustomerProtectedPath(path: string): boolean {
  const bare = stripLocalePrefix(path)
  return bare === '/account' || bare.startsWith('/account/')
}

/** Куди повернути після виходу: залишитись на публічній сторінці або на головну з захищеної. */
export function resolveLogoutRedirect(fromPath: string | null | undefined): string {
  const bare = fromPath ? stripLocalePrefix(fromPath) : '/'
  if (isCustomerProtectedPath(bare)) return '/'
  return bare || '/'
}

export function buildLogoutHref(fromPath: string): string {
  const redirect = resolveLogoutRedirect(fromPath)
  if (redirect === '/') return '/api/auth/logout'
  return `/api/auth/logout?from=${encodeURIComponent(redirect)}`
}
