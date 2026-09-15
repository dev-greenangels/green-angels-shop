import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { LegalTemplateNotice } from '@/components/legal/legal-template-notice'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import { buildTermsMetadata } from '@/lib/legal/metadata'
import {
  legalPageTitleClassName,
  legalProseClassName,
} from '@/lib/legal/storefront-typography'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
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
  return buildTermsMetadata(locale)
}

export default async function TermsPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const tLegal = await getTranslations('legalPages')
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(fetched)
  const store = resolveStoreForCountrySite(
    getStoreSettings(fetched, { locale }),
    market,
    countryCode,
  )
  const cart = getCartCheckoutSettings(fetched)
  const bank = resolveCheckoutBankDetails(cart, store)
  const legalDocument = await fetchCurrentLegalDocument('TERMS', locale, countryCode)
  const fallbackSeller = sellerFromBankDetails(bank)
  const supportEmail = resolvePublicSupportEmail({
    store,
    market,
    countrySiteCode: countryCode,
  })

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('terms'))}
            />
            <h1 className={legalPageTitleClassName}>
              {legalDocument?.title ?? tLegal('termsUnavailableTitle')}
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className={legalProseClassName}>
            <div className="mb-6">
              <LegalPageLinks current="terms" />
            </div>

            {legalDocument ? (
              <>
                <p className="mb-8 text-lg text-muted-foreground">
                  {tLegal('revisionLine', { version: legalDocument.version })}
                </p>
                <LegalRevisionBody
                  document={legalDocument}
                  locale={locale}
                  versionLabel=""
                  fallbackSeller={fallbackSeller}
                  supportEmail={supportEmail}
                />
              </>
            ) : (
              <div className="space-y-4">
                <LegalTemplateNotice />
                <p className="text-muted-foreground">{tLegal('termsUnavailableBody')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
