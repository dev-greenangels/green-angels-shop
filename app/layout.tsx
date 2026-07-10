import type { Metadata } from 'next'
import { Cormorant_Garamond, Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'

import { AppProviders } from '@/components/providers/app-providers'
import { Toaster } from '@/components/ui/sonner'
import { getSession } from '@/lib/auth/get-session'
import { fetchPublicSiteSettings, getCatalogPageSettings, getLocalizationSettings, getNavigationSettings, getStoreSettings } from '@/lib/settings/fetch'
import { fetchCommerceSettings } from '@/lib/commerce/fetch'
import { fetchCatalogRootSlug } from '@/lib/catalog/paths'

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

  return {
    title: t('title'),
    description: t('description'),
    keywords,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  setRequestLocale(locale)
  const session = await getSession()
  const siteSettings = await fetchPublicSiteSettings()
  const commerceSettings = await fetchCommerceSettings(locale)
  const storeSettings = getStoreSettings(siteSettings)
  const catalogSettings = getCatalogPageSettings(siteSettings)
  const localizationSettings = getLocalizationSettings(siteSettings)
  const navigationSettings = getNavigationSettings(siteSettings)
  const catalogRootSlug = await fetchCatalogRootSlug(locale)

  return (
    <html lang={locale} className={`${sourceSans.variable} ${cormorant.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AppProviders
          initialSession={session}
          initialStoreSettings={storeSettings}
          storeUnavailable={siteSettings.storeUnavailable}
          initialCatalogSettings={catalogSettings}
          initialLocalizationSettings={localizationSettings}
          initialNavigationSettings={navigationSettings}
          initialCommerceSettings={commerceSettings}
          catalogRootSlug={catalogRootSlug}
        >
          {children}
        </AppProviders>
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
