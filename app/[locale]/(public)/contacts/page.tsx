import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { BrandLogo } from '@/components/brand-logo'
import { Navigation } from '@/components/navigation'
import { NewsletterSignupForm } from '@/components/legal/newsletter-signup-form'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { StoreAddressLink } from '@/components/store/store-address-link'
import { StoreContactsDisplay } from '@/components/store/store-contacts-display'
import { StoreLocationMap } from '@/components/store/store-location-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { buildContactsMetadata } from '@/lib/contacts/metadata'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { resolvePublicCompanyName } from '@/lib/settings/company-name'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import {
  fetchPublicSiteSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import { hasStoreContactInfo } from '@/lib/settings/store-helpers'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildContactsMetadata(locale)
}

export default async function ContactsPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('contactsPage')
  const tNav = await getTranslations('nav')
  const tCommon = await getTranslations('common')
  const te = await getTranslations('errors')
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(fetched)
  const store = resolveStoreForCountrySite(getStoreSettings(fetched), market, countryCode)
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const company = resolvePublicCompanyName(store, tCommon('brand'))

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('contacts'))}
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <BrandLogo
                alt={company}
                imgClassName="max-h-16 w-auto max-w-[220px] object-contain"
              />
              <div>
                <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                  {t('title')}
                </h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="mx-auto max-w-4xl space-y-8">
            {contactsUnavailable ? (
              <ServiceUnavailableNotice
                title={t('unavailableTitle')}
                message={te('serviceUnavailable')}
                className="mx-auto max-w-lg"
              />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">
                      {t('nurseryTitle', { company })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StoreContactsDisplay
                      store={store}
                      grouped
                      columnsOnDesktop
                      showAddress={false}
                      showSocialLinks
                      marketRegion={market.region}
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4 rounded-2xl border border-primary/10 bg-[rgba(232,240,227,0.48)] p-4 shadow-sm sm:p-5">
                  <StoreAddressLink store={store} />
                  <StoreLocationMap store={store} />
                </div>
              </>
            )}

            <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-sm sm:p-6">
              <NewsletterSignupForm />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {t.rich('shippingHint', {
                link: (chunks) => (
                  <Link href="/shipping" className="text-primary underline-offset-4 hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
