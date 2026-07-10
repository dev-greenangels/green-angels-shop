import { stripLocalePrefix } from '@/lib/locale-path'

/** Запобігає відкритому редіректу після логіну. Повертає path без locale (для next-intl router / Link). */
export function safeAuthRedirect(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return '/'

  const queryIndex = path.indexOf('?')
  const pathname = queryIndex === -1 ? path : path.slice(0, queryIndex)
  const search = queryIndex === -1 ? '' : path.slice(queryIndex)
  const internal = stripLocalePrefix(pathname)

  if (internal.startsWith('/auth')) return '/'
  if (internal.startsWith('/backstage') || internal.startsWith('/admin')) return '/'

  return `${internal || '/'}${search}`
}
