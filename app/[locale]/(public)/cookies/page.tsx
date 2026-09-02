import { getLocale, getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { CookiePreferencesManager } from '@/components/legal/cookie-preferences-manager'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalPageSections, type LegalPageSection } from '@/components/legal/legal-page-sections'
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { LegalTemplateNotice } from '@/components/legal/legal-template-notice'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { LegalSellerDetails } from '@/components/legal/legal-seller-details'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import { legalPageTitleClassName, legalProseClassName } from '@/lib/legal/storefront-typography'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getStoreSettings,
} from '@/lib/settings/fetch'
import { getSupportEmail } from '@/lib/settings/store-helpers'
import { cn } from '@/lib/utils'

export default async function CookiesPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const t = await getTranslations('cookiesPage')
  const tLegal = await getTranslations('legalPages')
  const sections = t.raw('sections') as LegalPageSection[]
  const siteSettings = await fetchPublicSiteSettings()
  const store = getStoreSettings(siteSettings)
  const fallbackSeller = sellerFromBankDetails(
    resolveCheckoutBankDetails(getCartCheckoutSettings(siteSettings), store),
  )
  const supportEmail = getSupportEmail(store)
  const document = await fetchCurrentLegalDocument('COOKIES', locale)
  const title = document?.title ?? t('title')

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs className="mb-4" items={staticPageBreadcrumbs(tNav('cookies'))} />
            <h1 className={legalPageTitleClassName}>{title}</h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="max-w-3xl mx-auto space-y-6">
            {!document ? <LegalTemplateNotice /> : null}
            <LegalPageLinks current="cookies" />

            <div className={legalProseClassName}>
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
                <>
                  <p className="text-muted-foreground text-lg">{t('intro')}</p>
                  <LegalSellerDetails seller={fallbackSeller} identityKind="controller" />
                  <LegalPageSections sections={sections} supportEmail={supportEmail} />
                </>
              )}
            </div>

            <CookiePreferencesManager locale={locale} />
          </div>
        </div>
      </main>
    </>
  )
}
