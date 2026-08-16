import { Suspense } from 'react'
import { getLocale, getTranslations } from 'next-intl/server'

import { Footer } from '@/components/footer'
import { OrganizationJsonLdScripts } from '@/components/seo/json-ld-script'
import { resolvePublicOriginFromRequest } from '@/lib/seo/request-context'
import {
  fetchPublicSiteSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'

function FooterFallback() {
  // Без aria-hidden — атрибути мають збігатися з реальним <Footer>, інакше hydration mismatch.
  return <footer className="bg-footer-gradient text-primary-foreground" />
}

async function SiteJsonLd() {
  const locale = await getLocale()
  const origin = await resolvePublicOriginFromRequest()
  if (!origin) return null
  const t = await getTranslations({ locale, namespace: 'common' })
  const fetched = await fetchPublicSiteSettings()
  return (
    <OrganizationJsonLdScripts
      origin={origin}
      name={t('brand')}
      store={getStoreSettings(fetched)}
      marketRegion={getMarketSettings(fetched).region}
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
