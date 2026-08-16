import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { StoreAddressLink } from '@/components/store/store-address-link'
import { StoreContactsDisplay } from '@/components/store/store-contacts-display'
import { StoreLocationMap } from '@/components/store/store-location-map'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getTranslations } from 'next-intl/server'
import {
  fetchPublicSiteSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { hasStoreContactInfo } from '@/lib/settings/store-helpers'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

export const metadata = {
  title: 'Контакти · Зелені Янголи',
  description: 'Адреса, телефони, email та графік роботи розсадника «Зелені Янголи».',
}

export default async function ContactsPage() {
  const tNav = await getTranslations('nav')
  const fetched = await fetchPublicSiteSettings()
  const store = getStoreSettings(fetched)
  const market = getMarketSettings(fetched)
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)

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
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Контакти</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Звʼяжіться з нами зручним способом або відвідайте садовий центр за графіком роботи.
            </p>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="mx-auto max-w-4xl space-y-8">
            {contactsUnavailable ? (
              <ServiceUnavailableNotice
                title="Контакти тимчасово недоступні"
                message={SERVICE_UNAVAILABLE_MESSAGE}
                className="mx-auto max-w-lg"
              />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">Розсадник «Зелені Янголи»</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StoreContactsDisplay
                      store={store}
                      grouped
                      columnsOnDesktop
                      showAddress={false}
                      showSocialLinks
                      marketRegion={market.region}
                      scheduleSectionTitle="Графік роботи"
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <StoreAddressLink store={store} />
                  <StoreLocationMap store={store} />
                </div>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Питання щодо доставки та оплати — на сторінці{' '}
              <Link href="/shipping" className="text-primary underline-offset-4 hover:underline">
                Доставка та оплата
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
