import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { LegalTemplateNotice } from '@/components/legal/legal-template-notice'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import { buildPrivacyMetadata } from '@/lib/legal/metadata'
import { legalPageTitleClassName, legalProseClassName } from '@/lib/legal/storefront-typography'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
  getStoreSettings,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import { resolvePublicSupportEmail } from '@/lib/settings/public-support-email'
import { cn } from '@/lib/utils'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPrivacyMetadata(locale)
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const tLegal = await getTranslations('legalPages')
  const [siteSettings, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(siteSettings)
  const store = resolveStoreForCountrySite(
    getStoreSettings(siteSettings, { locale }),
    market,
    countryCode,
  )
  const fallbackSeller = sellerFromBankDetails(
    resolveCheckoutBankDetails(getCartCheckoutSettings(siteSettings), store),
  )
  const supportEmail = resolvePublicSupportEmail({
    store,
    market,
    countrySiteCode: countryCode,
  })
  const document = await fetchCurrentLegalDocument('PRIVACY', locale, countryCode)

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs className="mb-4" items={staticPageBreadcrumbs(tNav('privacy'))} />
            <h1 className={legalPageTitleClassName}>
              {document?.title ?? tLegal('privacyUnavailableTitle')}
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className={cn(legalProseClassName, 'space-y-6')}>
            <LegalPageLinks current="privacy" />

            {document ? (
              <LegalRevisionBody
                document={document}
                locale={locale}
                versionLabel={tLegal('revisionLine', { version: document.version })}
                fallbackSeller={fallbackSeller}
                supportEmail={supportEmail}
                sellerIdentityKind="controller"
              />
            ) : (
              <div className="space-y-4">
                <LegalTemplateNotice />
                <p className="text-muted-foreground">{tLegal('privacyUnavailableBody')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
