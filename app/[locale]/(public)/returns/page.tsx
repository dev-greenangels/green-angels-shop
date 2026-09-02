import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ContractWithdrawalModelForm } from '@/components/legal/contract-withdrawal-model-form'
import { ContractWithdrawalPublicForm } from '@/components/legal/contract-withdrawal-public-form'
import { ReturnsLegalContent } from '@/components/legal/returns-legal-content'
import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { resolveWithdrawalReturnAddressText } from '@/lib/settings/withdrawal-return-address'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import {
  legalPageTitleClassName,
  legalSectionHeadingClassName,
  legalSubsectionHeadingClassName,
} from '@/lib/legal/storefront-typography'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
  getStoreSettings,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import { getSupportEmail } from '@/lib/settings/store-helpers'
import { cn } from '@/lib/utils'

const subsectionClassName =
  'space-y-3 border-t border-border/55 pt-7 first:border-t-0 first:pt-0'

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('returnsPage')
  const tLegal = await getTranslations('legalPages')
  const [settings, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(settings)
  const store = resolveStoreForCountrySite(getStoreSettings(settings), market, countryCode)
  const returnAddress = resolveWithdrawalReturnAddressText(settings, store)
  const fallbackSeller = sellerFromBankDetails(
    resolveCheckoutBankDetails(getCartCheckoutSettings(settings), store),
  )
  const document = await fetchCurrentLegalDocument('RETURNS', locale)
  const contactEmail = getSupportEmail(store) || 'info@green-angels.sk'
  const pageTitle = document?.title ?? t('title')
  const displayReturnAddress = returnAddress || t('section5AddressPending')

  const formsSlot = (
    <>
      <div className="space-y-4">
        <h2 className={legalSectionHeadingClassName}>{t('section2Title')}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('section2Intro')}</p>
        <ContractWithdrawalPublicForm id="withdraw-here" />
      </div>

      <div className={subsectionClassName}>
        <h3 className={legalSubsectionHeadingClassName}>{t('section3Title')}</h3>
        <p className="text-sm text-muted-foreground">{t('section3Intro')}</p>
        <ContractWithdrawalModelForm
          locale={locale}
          seller={fallbackSeller}
          contactEmail={contactEmail}
        />
      </div>
    </>
  )

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="border-b border-border/60 bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(pageTitle)}
            />
            <h1 className={legalPageTitleClassName}>{pageTitle}</h1>
            {document ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {tLegal('revisionLine', { version: document.version })}
                <span aria-hidden className="mx-2">
                  ·
                </span>
                {formatDateTime(document.effectiveAt, locale, 'dateLong')}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">{t('intro')}</p>
            )}
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-10 md:py-12')}>
          {document ? (
            <ReturnsLegalContent
              document={document}
              vars={{
                returnAddress: displayReturnAddress,
                supportEmail: contactEmail,
              }}
              formsSlot={formsSlot}
            />
          ) : (
            <div className="legal-document mx-auto max-w-3xl space-y-8">
              <p className="text-sm text-muted-foreground">{t('intro')}</p>
              <section id="withdrawal" className="rounded-2xl border border-border/70 bg-[rgba(232,240,227,0.35)] p-5 shadow-sm md:p-8">
                {formsSlot}
              </section>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
