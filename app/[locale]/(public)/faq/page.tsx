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
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import {
  fetchPublicSiteSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import { hasStoreContactInfo } from '@/lib/settings/store-helpers'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { getTranslations } from 'next-intl/server'

export default async function FAQPage() {
  const tNav = await getTranslations('nav')
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const store = resolveStoreForCountrySite(
    getStoreSettings(fetched),
    getMarketSettings(fetched),
    countryCode,
  )
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const faqCategories = buildFaqCategories(store)

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
              Часті питання
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
            <h3 className="font-serif text-xl font-semibold mb-4">Не знайшли відповідь?</h3>
            <p className="text-muted-foreground mb-6">
              Зв&apos;яжіться з нами, і ми з радістю допоможемо
            </p>
            {contactsUnavailable ? (
              <ServiceUnavailableNotice
                compact
                title="Контакти тимчасово недоступні"
                message={SERVICE_UNAVAILABLE_MESSAGE}
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
