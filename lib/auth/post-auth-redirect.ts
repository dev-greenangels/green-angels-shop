import type { AppLocale } from '@/i18n/routing'
import { localePath } from '@/lib/locale-path'

/** Full page navigation after login — ensures proxy sees fresh ga-session cookie. */
export function hardRedirectToInternalPath(path: string, locale: AppLocale): void {
  if (typeof window === 'undefined') return
  window.location.assign(localePath(path, locale))
}
