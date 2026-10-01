'use client'

import { useParams } from 'next/navigation'

import { isAppLocale, type AppLocale } from '@/i18n/routing'

/**
 * Actual storefront route locale from `app/[locale]/…`.
 * Safe outside NextIntlClientProvider (root AppProviders / CartProvider).
 * Returns null on backstage and other non-locale routes — do not invent.
 */
export function useRouteAppLocale(): AppLocale | null {
  const params = useParams()
  const raw = params?.locale
  if (typeof raw === 'string' && isAppLocale(raw)) {
    return raw
  }
  return null
}
