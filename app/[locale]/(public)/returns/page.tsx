import { getTranslations, setRequestLocale } from 'next-intl/server'

import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { LegalSellerDetails } from '@/components/legal/legal-seller-details'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
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
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

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
  const fallbackSeller = sellerFromBankDetails(
    resolveCheckoutBankDetails(getCartCheckoutSettings(settings), store),
  )
  const document = await fetchCurrentLegalDocument('RETURNS', locale)
  const contactEmail = getSupportEmail(store) || 'info@example.com'

  return (
    <main className={cn(siteContentShellClassName, 'py-12 md:py-16')}>
      <h1 className="font-serif text-3xl font-bold md:text-4xl">{document?.title ?? t('title')}</h1>
      {document ? (
        <div className="mt-6 max-w-3xl prose prose-green">
          <LegalRevisionBody
            document={document}
            locale={locale}
            versionLabel={tLegal('revisionLine', { version: document.version })}
            fallbackSeller={fallbackSeller}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 max-w-3xl">
            <LegalSellerDetails seller={fallbackSeller} />
          </div>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t('intro')}</p>
          <section className="mt-10 space-y-4">
            <h2 className="font-serif text-2xl font-semibold">{t('policyTitle')}</h2>
            <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {t('policyBody')}
            </p>
          </section>
        </>
      )}

      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl font-semibold">{t('formTitle')}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{t('formHint')}</p>
        <div className="max-w-xl space-y-2 rounded-lg border border-dashed border-border p-6 text-sm">
          <p>{t('formFields')}</p>
          <p className="text-muted-foreground">{t('formSendTo', { email: contactEmail })}</p>
        </div>
        <p className="text-sm">
          <Link href="/shipping" className="text-primary underline underline-offset-2">
            {t('shippingLink')}
          </Link>
        </p>
      </section>
    </main>
  )
}
