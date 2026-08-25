import { Suspense } from 'react'
import { getLocale, getTranslations } from 'next-intl/server'

import { Footer } from '@/components/footer'
import { OrganizationJsonLdScripts } from '@/components/seo/json-ld-script'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import { resolvePublicOriginFromRequest } from '@/lib/seo/request-context'
import { resolvePublicCompanyName } from '@/lib/settings/company-name'
import {
  fetchPublicSiteSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'

function FooterFallback() {
  // Без aria-hidden — атрибути мають збігатися з реальним <Footer>, інакше hydration mismatch.
  return <footer className="bg-footer-gradient text-primary-foreground" />
}

async function SiteJsonLd() {
  const locale = await getLocale()
  const origin = await resolvePublicOriginFromRequest()
  if (!origin) return null
  const t = await getTranslations({ locale, namespace: 'common' })
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(fetched)
  const store = resolveStoreForCountrySite(getStoreSettings(fetched), market, countryCode)
  const brand = t('brand')
  const company = resolvePublicCompanyName(store, brand)
  return (
    <OrganizationJsonLdScripts
      origin={origin}
      name={company}
      legalName={store.companyDetails.organizationName.trim() || undefined}
      store={store}
      marketRegion={market.region}
      storeUnavailable={isStoreContactUnavailable(fetched)}
      locale={locale}
    />
  )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <Suspense fallback={null}>
        <SiteJsonLd />
      </Suspense>
      <Suspense fallback={<FooterFallback />}>
        <Footer />
      </Suspense>
    </div>
  )
}
