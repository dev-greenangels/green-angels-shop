'use client'

import type { PublicSession } from '@/lib/auth/types'
import type { CountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import { DEFAULT_CATALOG_SETTINGS, DEFAULT_LOCALIZATION_SETTINGS, UNAVAILABLE_STORE_SETTINGS } from '@/lib/settings/defaults'
import type { CatalogPageSettings, LocalizationSettings, NavigationSettings, StoreContactSettings } from '@/lib/settings/types'
import { DEFAULT_NAVIGATION_SETTINGS } from '@/lib/settings/navigation'
import type { PublicCommerceSettings } from '@/lib/commerce/types'
import { DEFAULT_COMMERCE_SETTINGS } from '@/lib/commerce/defaults'

import { CanonicalOriginProvider } from './canonical-origin-provider'
import { CartProvider } from './cart-provider'
import { CommerceProvider } from './commerce-provider'
import { CountrySiteProvider } from './country-site-provider'
import { FavoritesProvider } from './favorites-provider'
import { SessionProvider } from './session-provider'
import { CatalogSettingsProvider } from './catalog-settings-provider'
import { CatalogPathsProvider } from './catalog-paths-provider'
import { LocalizationSettingsProvider } from './localization-settings-provider'
import { NavigationSettingsProvider } from './navigation-settings-provider'
import { StoreSettingsProvider } from './store-settings-provider'
import { VatDisplayProvider } from './vat-display-provider'
import type { VatDisplayPolicy } from '@/lib/pricing/vat-price'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/market'

const DEFAULT_VAT_DISPLAY_POLICY: VatDisplayPolicy = {
  priceBasis: DEFAULT_MARKET_SETTINGS.priceBasis,
  storefrontPrimaryPrice: DEFAULT_MARKET_SETTINGS.storefrontPrimaryPrice,
  storefrontShowExVatSecondary: DEFAULT_MARKET_SETTINGS.storefrontShowExVatSecondary,
  taxRatePercent: 0,
}

export function AppProviders({
  children,
  initialSession,
  initialStoreSettings = UNAVAILABLE_STORE_SETTINGS,
  storeUnavailable = false,
  initialCatalogSettings = DEFAULT_CATALOG_SETTINGS,
  initialLocalizationSettings = DEFAULT_LOCALIZATION_SETTINGS,
  initialNavigationSettings = DEFAULT_NAVIGATION_SETTINGS,
  initialCommerceSettings = DEFAULT_COMMERCE_SETTINGS,
  initialCountryOverlay = null,
  initialVatDisplayPolicy = DEFAULT_VAT_DISPLAY_POLICY,
  catalogRootSlug = null,
  canonicalOrigin = '',
}: {
  children: React.ReactNode
  initialSession: PublicSession | null
  initialStoreSettings?: StoreContactSettings
  storeUnavailable?: boolean
  initialCatalogSettings?: CatalogPageSettings
  initialLocalizationSettings?: LocalizationSettings
  initialNavigationSettings?: NavigationSettings
  initialCommerceSettings?: PublicCommerceSettings
  initialCountryOverlay?: CountrySiteOverlay | null
  initialVatDisplayPolicy?: VatDisplayPolicy
  catalogRootSlug?: string | null
  canonicalOrigin?: string
}) {
  return (
    <CanonicalOriginProvider value={canonicalOrigin}>
    <CommerceProvider value={initialCommerceSettings}>
    <CountrySiteProvider value={initialCountryOverlay}>
    <VatDisplayProvider value={initialVatDisplayPolicy}>
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
    </VatDisplayProvider>
    </CountrySiteProvider>
    </CommerceProvider>
    </CanonicalOriginProvider>
  )
}
