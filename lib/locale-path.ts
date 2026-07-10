import { defaultLocale, locales, type AppLocale } from '@/i18n/routing'

export function localePath(path: string, locale: AppLocale = defaultLocale): string {
  if (!path || path.startsWith('http://') || path.startsWith('https://')) return path

  const hashIndex = path.indexOf('#')
  const queryIndex = path.indexOf('?')
  const endIndex =
    hashIndex === -1
      ? queryIndex === -1
        ? path.length
        : queryIndex
      : queryIndex === -1
        ? hashIndex
        : Math.min(hashIndex, queryIndex)

  const pathname = path.slice(0, endIndex) || '/'
  const suffix = path.slice(endIndex)
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`

  if (normalized === `/${locale}` || normalized.startsWith(`/${locale}/`)) {
    return path
  }

  if (normalized === '/') {
    return `/${locale}${suffix}`
  }

  return `/${locale}${normalized}${suffix}`
}

export function stripLocalePrefix(pathname: string): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || '/'
    }
  }
  return pathname
}
