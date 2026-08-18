import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'

import { AppProviders } from '@/components/providers/app-providers'
import { AppToasters } from '@/components/ui/sonner'
import { getSession } from '@/lib/auth/get-session'
import { getMarketBranding } from '@/lib/branding/market-branding'
import { applyCountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import {
  applyCommerceCurrencyOverlay,
  applyLocalizationOverlay,
} from '@/lib/country-sites/currency'
import { isCountrySiteCode, GA_COUNTRY_HEADER } from '@/lib/country-sites/types'
import { fetchPublicSiteSettings, getCartCheckoutSettings, getCatalogPageSettings, getLocalizationSettings, getMarketSettings, getNavigationSettings, getStoreSettings } from '@/lib/settings/fetch'
import { resolvePublicOrigin } from '@/lib/seo/public-origin'
import { resolveSeoRequestContext } from '@/lib/seo/request-context'
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

export const viewport: Viewport = {
  themeColor: '#4c9d1a',
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const [t, seoContext] = await Promise.all([
    getTranslations({ locale, namespace: 'metadata' }),
    resolveSeoRequestContext(locale),
  ])
  const keywords = t('keywords')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  const origin = seoContext.origin
  const branding = getMarketBranding(seoContext.marketRegion)
  const title = t('title')
  const description = t('description')
  const siteName = branding.applicationName
  const socialImage = {
    url: branding.socialImage,
    width: 1200,
    height: 630,
    alt: title,
  }

  return {
    title,
    description,
    keywords,
    applicationName: siteName,
    manifest: branding.manifest,
    icons: {
      icon: [
        { url: branding.favicon, type: 'image/x-icon' },
        { url: branding.icon, type: 'image/png', sizes: '512x512' },
      ],
      apple: [{ url: branding.appleIcon, type: 'image/png', sizes: '180x180' }],
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: 'default',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      siteName,
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [branding.socialImage],
    },
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
          initialMarketRegion={marketSettings.region}
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
