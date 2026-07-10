'use client'

import type { PublicSession } from '@/lib/auth/types'
import { DEFAULT_CATALOG_SETTINGS, DEFAULT_LOCALIZATION_SETTINGS, UNAVAILABLE_STORE_SETTINGS } from '@/lib/settings/defaults'
import type { CatalogPageSettings, LocalizationSettings, NavigationSettings, StoreContactSettings } from '@/lib/settings/types'
import { DEFAULT_NAVIGATION_SETTINGS } from '@/lib/settings/navigation'
import type { PublicCommerceSettings } from '@/lib/commerce/types'
import { DEFAULT_COMMERCE_SETTINGS } from '@/lib/commerce/defaults'

import { CartProvider } from './cart-provider'
import { CommerceProvider } from './commerce-provider'
import { FavoritesProvider } from './favorites-provider'
import { SessionProvider } from './session-provider'
import { CatalogSettingsProvider } from './catalog-settings-provider'
import { CatalogPathsProvider } from './catalog-paths-provider'
import { LocalizationSettingsProvider } from './localization-settings-provider'
import { NavigationSettingsProvider } from './navigation-settings-provider'
import { StoreSettingsProvider } from './store-settings-provider'

export function AppProviders({
  children,
  initialSession,
  initialStoreSettings = UNAVAILABLE_STORE_SETTINGS,
  storeUnavailable = false,
  initialCatalogSettings = DEFAULT_CATALOG_SETTINGS,
  initialLocalizationSettings = DEFAULT_LOCALIZATION_SETTINGS,
  initialNavigationSettings = DEFAULT_NAVIGATION_SETTINGS,
  initialCommerceSettings = DEFAULT_COMMERCE_SETTINGS,
  catalogRootSlug = null,
}: {
  children: React.ReactNode
  initialSession: PublicSession | null
  initialStoreSettings?: StoreContactSettings
  storeUnavailable?: boolean
  initialCatalogSettings?: CatalogPageSettings
  initialLocalizationSettings?: LocalizationSettings
  initialNavigationSettings?: NavigationSettings
  initialCommerceSettings?: PublicCommerceSettings
  catalogRootSlug?: string | null
}) {
  return (
    <CommerceProvider value={initialCommerceSettings}>
    <LocalizationSettingsProvider value={initialLocalizationSettings}>
      <NavigationSettingsProvider navigation={initialNavigationSettings}>
      <StoreSettingsProvider store={initialStoreSettings} unavailable={storeUnavailable}>
        <CatalogPathsProvider catalogRootSlug={catalogRootSlug}>
        <CatalogSettingsProvider catalog={initialCatalogSettings}>
          <SessionProvider initialSession={initialSession}>
            <CartProvider>
              <FavoritesProvider>{children}</FavoritesProvider>
            </CartProvider>
          </SessionProvider>
        </CatalogSettingsProvider>
        </CatalogPathsProvider>
      </StoreSettingsProvider>
      </NavigationSettingsProvider>
    </LocalizationSettingsProvider>
    </CommerceProvider>
  )
}
