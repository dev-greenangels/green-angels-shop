import type { LocalizationSettings } from '@/lib/i18n/locales'

/**
 * Single source of truth for storefront FAQ visibility.
 * Backoffice toggle: localization.showFaqInFooter
 * (controls footer, nav /faq links, sitemap, and public /faq route).
 */
export function isStorefrontFaqEnabled(
  localization: Pick<LocalizationSettings, 'showFaqInFooter'> | null | undefined,
): boolean {
  return localization?.showFaqInFooter !== false
}

/** True for storefront FAQ paths (with or without locale prefix). */
export function isFaqNavHref(href: string | null | undefined): boolean {
  if (!href) return false
  const path = href.trim().split(/[?#]/)[0]?.toLowerCase() ?? ''
  return (
    path === '/faq' ||
    path.endsWith('/faq') ||
    /^\/(uk|en|sk|hu|de|cs)\/faq$/i.test(path)
  )
}
