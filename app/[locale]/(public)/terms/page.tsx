import { getLocale, getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalPageSections, type LegalPageSection } from '@/components/legal/legal-page-sections'
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { LegalSellerDetails } from '@/components/legal/legal-seller-details'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import {
  formatStoreAddress,
  getStoreEmails,
  getStorePhones,
  hasStoreContactInfo,
  resolveStoreMapsHref,
} from '@/lib/settings/store-helpers'
import { cn } from '@/lib/utils'

function withSellerName(sections: LegalPageSection[], sellerName: string): LegalPageSection[] {
  return sections.map((section) => ({
    ...section,
    body: section.body.map((paragraph) =>
      paragraph.replaceAll('{sellerName}', sellerName),
    ),
  }))
}

export default async function TermsPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const tLegal = await getTranslations('legalPages')
  const tFallback = await getTranslations('termsFallback')
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(fetched)
  const store = resolveStoreForCountrySite(
    getStoreSettings(fetched),
    market,
    countryCode,
  )
  const cart = getCartCheckoutSettings(fetched)
  const bank = resolveCheckoutBankDetails(cart, store)
  const legalDocument = await fetchCurrentLegalDocument('TERMS', locale)
  const fallbackSeller = sellerFromBankDetails(bank)
  const sellerName =
    legalDocument?.seller?.organizationName ||
    fallbackSeller?.organizationName ||
    tFallback('sellerFallback')
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const address = formatStoreAddress(store)
  const mapsUrl = resolveStoreMapsHref(store)
  const phones = getStorePhones(store)
  const emails = getStoreEmails(store)

  const marketKey = market.region === 'sk' ? 'sk' : 'ua'
  const fallbackSections = withSellerName(
    tFallback.raw(`${marketKey}.sections`) as LegalPageSection[],
    sellerName,
  )

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
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {legalDocument?.title ?? tFallback('title')}
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="prose prose-green mx-auto max-w-3xl">
            <div className="mb-6">
              <LegalPageLinks current="terms" />
            </div>

            <p className="mb-8 text-lg text-muted-foreground">
              {legalDocument
                ? tLegal('revisionLine', { version: legalDocument.version })
                : tFallback('updated')}
            </p>

            {legalDocument ? (
              <LegalRevisionBody
                document={legalDocument}
                locale={locale}
                versionLabel=""
                fallbackSeller={fallbackSeller}
              />
            ) : (
              <>
                <LegalSellerDetails seller={fallbackSeller} />
                <LegalPageSections sections={fallbackSections} />
              </>
            )}

            <section className="mb-8">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground">
                {tFallback('contactHeading')}
              </h2>
              <div className="space-y-2 text-muted-foreground">
                {fallbackSeller?.organizationName || legalDocument?.seller?.organizationName ? (
                  <p>
                    <strong className="text-foreground">
                      {legalDocument?.seller?.organizationName ||
                        fallbackSeller?.organizationName}
                    </strong>
                  </p>
                ) : null}
                {contactsUnavailable ? (
                  <ServiceUnavailableNotice
                    compact
                    title={tFallback('contactsUnavailableTitle')}
                    message={SERVICE_UNAVAILABLE_MESSAGE}
                    className="text-left"
                  />
                ) : (
                  <>
                    <p>
                      {tFallback('contactAddress')}:{' '}
                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {address}
                        </a>
                      ) : (
                        address
                      )}
                    </p>
                    {phones.map((item) => (
                      <p key={item.phone}>
                        {tFallback('contactPhone', { label: item.label })}: {item.phone}
                      </p>
                    ))}
                    {emails.map((item) => (
                      <p key={item.email}>
                        {tFallback('contactEmail', { label: item.label })}: {item.email}
                      </p>
                    ))}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
