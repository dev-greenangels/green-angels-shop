import type { Metadata } from 'next'
import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'

import { AppProviders } from '@/components/providers/app-providers'
import { AppToasters } from '@/components/ui/sonner'
import { getSession } from '@/lib/auth/get-session'
import { applyCountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import {
  applyCommerceCurrencyOverlay,
  applyLocalizationOverlay,
} from '@/lib/country-sites/currency'
import { isCountrySiteCode, GA_COUNTRY_HEADER } from '@/lib/country-sites/types'
import { fetchPublicSiteSettings, getCartCheckoutSettings, getCatalogPageSettings, getLocalizationSettings, getMarketSettings, getNavigationSettings, getStoreSettings } from '@/lib/settings/fetch'
import { resolvePublicOrigin } from '@/lib/seo/public-origin'
import { resolvePublicOriginFromRequest } from '@/lib/seo/request-context'
import { isIndexingAllowed, previewRobotsDirective } from '@/lib/seo/indexing-policy'
import { fetchCommerceSettings } from '@/lib/commerce/fetch'
import { fetchCatalogRootSlug } from '@/lib/catalog/paths'
import { getCookieConsent } from '@/lib/legal/cookie-consent.server'
import { buildVatDisplayPolicy } from '@/lib/pricing/vat-price'

import './globals.css'

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-source',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const keywords = t('keywords')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const origin = await resolvePublicOriginFromRequest()

  return {
    title: t('title'),
    description: t('description'),
    keywords,
    robots: isIndexingAllowed({ origin }) ? undefined : previewRobotsDirective(),
    ...(origin ? { metadataBase: new URL(origin) } : {}),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  setRequestLocale(locale)
  const [session, siteSettings, commerceSettings, catalogRootSlug, cookieConsent, headerStore] =
    await Promise.all([
      getSession(),
      fetchPublicSiteSettings(),
      fetchCommerceSettings(locale),
      fetchCatalogRootSlug(locale),
      getCookieConsent(),
      headers(),
    ])
  const storeSettings = getStoreSettings(siteSettings)
  const catalogSettings = getCatalogPageSettings(siteSettings)
  const localizationSettings = getLocalizationSettings(siteSettings)
  const navigationSettings = getNavigationSettings(siteSettings)
  const marketSettings = getMarketSettings(siteSettings)
  const cartCheckoutSettings = getCartCheckoutSettings(siteSettings)
  const analyticsAllowed = process.env.NODE_ENV === 'production' && cookieConsent?.analytics === true
  const countryHeader = headerStore.get(GA_COUNTRY_HEADER)
  const countryCode = countryHeader && isCountrySiteCode(countryHeader) ? countryHeader : null
  const canonicalOrigin = resolvePublicOrigin({
    requestHost:
      headerStore.get('x-forwarded-host')?.split(',')[0]?.trim() || headerStore.get('host'),
    requestProto: headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim(),
  }).origin
  const countryOverlay = applyCountrySiteOverlay(marketSettings, countryCode)
  const vatDisplayPolicy = buildVatDisplayPolicy(
    marketSettings,
    countryCode,
    cartCheckoutSettings.taxRatePercent,
  )

  const effectiveLocalization = applyLocalizationOverlay(localizationSettings, countryOverlay)
  const effectiveCommerce = applyCommerceCurrencyOverlay(commerceSettings, countryOverlay)

  return (
    <html lang={locale} className={`${sourceSans.variable} ${cormorant.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AppProviders
          initialSession={session}
          initialStoreSettings={storeSettings}
          storeUnavailable={siteSettings.storeUnavailable}
          initialCatalogSettings={catalogSettings}
          initialLocalizationSettings={effectiveLocalization}
          initialNavigationSettings={navigationSettings}
          initialCommerceSettings={effectiveCommerce}
          initialCountryOverlay={countryOverlay}
          initialVatDisplayPolicy={vatDisplayPolicy}
          catalogRootSlug={catalogRootSlug}
          canonicalOrigin={canonicalOrigin}
        >
          {children}
        </AppProviders>
        <AppToasters />
        {analyticsAllowed && <Analytics />}
      </body>
    </html>
  )
}
