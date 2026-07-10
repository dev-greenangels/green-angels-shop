import { cache } from 'react'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import {
  DEFAULT_CART_CHECKOUT_SETTINGS,
  DEFAULT_CATALOG_SETTINGS,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_LOCALIZATION_SETTINGS,
  DEFAULT_NAVIGATION_SETTINGS,
  DEFAULT_RECENTLY_VIEWED_SETTINGS,
  DEFAULT_STORE_SETTINGS,
  UNAVAILABLE_STORE_SETTINGS,
} from '@/lib/settings/defaults'
import { normalizeCatalogPageSettings } from '@/lib/settings/catalog.normalize'
import { normalizeCartCheckoutSettings } from '@/lib/settings/cart-checkout.normalize'
import { normalizeHomeSettings } from '@/lib/settings/home.normalize'
import { normalizeLocalizationSettings } from '@/lib/settings/localization.normalize'
import { normalizeStoreContactSettings } from '@/lib/settings/store-contact.normalize'
import { normalizeNavigationSettings } from '@/lib/settings/navigation.normalize'
import type {
  CartCheckoutSettings,
  CatalogPageSettings,
  HomePageSettings,
  LocalizationSettings,
  NavigationSettings,
  PublicSiteSettings,
  RecentlyViewedSettings,
  StoreContactSettings,
} from '@/lib/settings/types'

export type FetchedPublicSiteSettings = {
  settings: PublicSiteSettings
  storeUnavailable: boolean
}

const UNAVAILABLE_STORE_WITH_FLAG = {
  ...UNAVAILABLE_STORE_SETTINGS,
  suppressDefaults: true,
} as const

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

function unavailableSettingsFallback(): FetchedPublicSiteSettings {
  return {
    settings: {
      store: normalizeStoreContactSettings(UNAVAILABLE_STORE_WITH_FLAG),
      home: DEFAULT_HOME_SETTINGS,
      cart: DEFAULT_CART_CHECKOUT_SETTINGS,
      catalog: DEFAULT_CATALOG_SETTINGS,
      recentlyViewed: DEFAULT_RECENTLY_VIEWED_SETTINGS,
      localization: DEFAULT_LOCALIZATION_SETTINGS,
      navigation: DEFAULT_NAVIGATION_SETTINGS,
    },
    storeUnavailable: true,
  }
}

async function fetchPublicSiteSettingsUncached(): Promise<FetchedPublicSiteSettings> {
  try {
    const res = await fetch(`${getBackendApiUrl()}/settings/public`, { cache: 'no-store' })
    if (!res.ok) throw new Error(await parseError(res))
    const settings = (await res.json()) as PublicSiteSettings
    return { settings, storeUnavailable: false }
  } catch {
    return unavailableSettingsFallback()
  }
}

/** Deduped per request — layout, metadata, page, footer share one backend call. */
export const fetchPublicSiteSettings = cache(fetchPublicSiteSettingsUncached)

export async function fetchPublicSiteSettingsFromApiRoute(): Promise<FetchedPublicSiteSettings> {
  try {
    const res = await fetch('/api/catalog/settings', { cache: 'no-store' })
    if (!res.ok) throw new Error(await parseError(res))
    const settings = (await res.json()) as PublicSiteSettings
    return { settings, storeUnavailable: false }
  } catch {
    return unavailableSettingsFallback()
  }
}

export function getStoreSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
  options?: { storeUnavailable?: boolean },
): StoreContactSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  const storeUnavailable =
    options?.storeUnavailable ?? ('storeUnavailable' in fetched ? fetched.storeUnavailable : false)

  if (storeUnavailable) {
    return normalizeStoreContactSettings(UNAVAILABLE_STORE_WITH_FLAG)
  }

  return normalizeStoreContactSettings(settings.store ?? DEFAULT_STORE_SETTINGS)
}

export function getHomeSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
): HomePageSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  return normalizeHomeSettings(settings.home)
}

export function getCartCheckoutSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
): CartCheckoutSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  return normalizeCartCheckoutSettings(settings.cart ?? DEFAULT_CART_CHECKOUT_SETTINGS)
}

export function getCatalogPageSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
): CatalogPageSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  const catalog = settings.catalog ?? DEFAULT_CATALOG_SETTINGS
  return normalizeCatalogPageSettings(catalog)
}

export function getRecentlyViewedSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
): RecentlyViewedSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  return settings.recentlyViewed ?? DEFAULT_RECENTLY_VIEWED_SETTINGS
}

export function getLocalizationSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
): LocalizationSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  return normalizeLocalizationSettings(settings.localization ?? DEFAULT_LOCALIZATION_SETTINGS)
}

export function getNavigationSettings(
  fetched: FetchedPublicSiteSettings | PublicSiteSettings,
): NavigationSettings {
  const settings = 'settings' in fetched ? fetched.settings : fetched
  return normalizeNavigationSettings(settings.navigation ?? DEFAULT_NAVIGATION_SETTINGS)
}

export function isStoreContactUnavailable(
  fetched: FetchedPublicSiteSettings | { storeUnavailable?: boolean },
): boolean {
  return Boolean('storeUnavailable' in fetched && fetched.storeUnavailable)
}
