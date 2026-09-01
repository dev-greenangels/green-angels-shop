import { getLocale, getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalPageSections, type LegalPageSection } from '@/components/legal/legal-page-sections'
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { LegalTemplateNotice } from '@/components/legal/legal-template-notice'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { LegalSellerDetails } from '@/components/legal/legal-seller-details'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
  getStoreSettings,
} from '@/lib/settings/fetch'
import { cn } from '@/lib/utils'

export default async function PrivacyPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const t = await getTranslations('privacyPage')
  const tLegal = await getTranslations('legalPages')
  const sections = t.raw('sections') as LegalPageSection[]
  const siteSettings = await fetchPublicSiteSettings()
  const market = getMarketSettings(siteSettings)
  const fallbackSeller = sellerFromBankDetails(
    resolveCheckoutBankDetails(getCartCheckoutSettings(siteSettings), getStoreSettings(siteSettings)),
  )
  const document = await fetchCurrentLegalDocument('PRIVACY', locale)
  const title = document?.title ?? t('title')

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs className="mb-4" items={staticPageBreadcrumbs(tNav('privacy'))} />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="max-w-3xl mx-auto prose prose-green space-y-6">
            {!document ? <LegalTemplateNotice /> : null}
            <LegalPageLinks current="privacy" />

            {document ? (
              <LegalRevisionBody
                document={document}
                locale={locale}
                versionLabel={tLegal('revisionLine', { version: document.version })}
                fallbackSeller={fallbackSeller}
              />
            ) : (
              <>
                <p className="text-muted-foreground text-lg">
                  {t('consentVersion', { version: market.privacyConsentVersion })}
                </p>
                <LegalSellerDetails seller={fallbackSeller} />
                <p className="text-muted-foreground">{t('intro')}</p>
                <LegalPageSections sections={sections} />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
