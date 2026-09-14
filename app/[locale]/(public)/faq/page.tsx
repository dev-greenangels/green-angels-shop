import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { StoreContactCta } from '@/components/store/store-contact-cta'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { buildFaqCategories } from '@/lib/faq/content'
import { isStorefrontFaqEnabled } from '@/lib/faq/visibility'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import {
  fetchPublicSiteSettings,
  getLocalizationSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import { hasStoreContactInfo } from '@/lib/settings/store-helpers'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'

export async function generateMetadata(): Promise<Metadata> {
  const fetched = await fetchPublicSiteSettings()
  const localization = getLocalizationSettings(fetched)
  if (!isStorefrontFaqEnabled(localization)) {
    return { robots: { index: false, follow: false } }
  }
  return {}
}

export default async function FAQPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const t = await getTranslations('faq')
  const tErrors = await getTranslations('errors')
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const localization = getLocalizationSettings(fetched)
  if (!isStorefrontFaqEnabled(localization)) {
    notFound()
  }

  const market = getMarketSettings(fetched)
  const store = resolveStoreForCountrySite(
    getStoreSettings(fetched, { locale }),
    market,
    countryCode,
  )
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const faqCategories = buildFaqCategories(store, {
    locale,
    marketRegion: market.region,
  })

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('faq'))}
            />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {t('title')}
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="max-w-3xl mx-auto space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <div key={category.title}>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, itemIndex) => (
                    <AccordionItem key={item.question} value={`${categoryIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-16 p-8 bg-secondary/50 rounded-2xl text-center">
            <h3 className="font-serif text-xl font-semibold mb-4">{t('ctaTitle')}</h3>
            <p className="text-muted-foreground mb-6">{t('ctaBody')}</p>
            {contactsUnavailable ? (
              <ServiceUnavailableNotice
                compact
                title={t('contactsUnavailable')}
                message={tErrors('serviceUnavailable')}
                className="mx-auto max-w-md"
              />
            ) : (
              <StoreContactCta store={store} />
            )}
          </div>
        </div>
      </main>
    </>
  )
}
