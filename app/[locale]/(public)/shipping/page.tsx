import { Clock, CreditCard, MapPin, Package, ShieldCheck, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
  getStoreSettings,
  isStoreContactUnavailable,
} from '@/lib/settings/fetch'
import { resolveStoreForCountrySite } from '@/lib/settings/store-contact-country'
import {
  findStoreSchedule,
  formatScheduleEntries,
  formatStoreAddress,
  getStoreSchedules,
  hasStoreContactInfo,
  resolveStoreMapsHref,
} from '@/lib/settings/store-helpers'
import { cn } from '@/lib/utils'

type DeliveryGroup = 'nova-poshta' | 'packeta' | 'gls' | 'pickup'

function deliveryGroups(
  enabled: CheckoutDeliveryMethodSlug[],
): DeliveryGroup[] {
  const set = new Set(enabled)
  const groups: DeliveryGroup[] = []
  if (set.has('nova-poshta-branch') || set.has('nova-poshta-address')) {
    groups.push('nova-poshta')
  }
  if (set.has('packeta-box') || set.has('packeta-courier')) {
    groups.push('packeta')
  }
  if (set.has('gls-courier')) {
    groups.push('gls')
  }
  if (set.has('pickup')) {
    groups.push('pickup')
  }
  return groups
}

export default async function ShippingPage() {
  const tFooter = await getTranslations('footer')
  const t = await getTranslations('shippingPage')
  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(fetched)
  const isSk = market.region === 'sk'
  const cart = getCartCheckoutSettings(fetched)
  const store = resolveStoreForCountrySite(
    getStoreSettings(fetched),
    market,
    countryCode,
  )
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const address = formatStoreAddress(store)
  const mapsUrl = resolveStoreMapsHref(store)
  const pickupSchedule =
    findStoreSchedule(store, 'садов', 'центр') ?? getStoreSchedules(store)[0]

  const groups = deliveryGroups(cart.enabledDeliveryMethods)
  const payments = cart.enabledPaymentMethods

  const packingItems = t.raw('packingItems') as string[]

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tFooter(isSk ? 'shippingSk' : 'shipping'))}
            />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {t('title')}
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="mx-auto max-w-4xl">
            <section className="mb-16">
              <h2 className="mb-8 font-serif text-2xl font-semibold text-foreground">
                {t('deliveryTitle')}
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {groups.map((group) => {
                  if (group === 'pickup') {
                    return (
                      <Card key={group} className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                              <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            {t('methods.pickup.title')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-muted-foreground">
                          <p>{t('methods.pickup.description')}</p>
                          <div className="grid gap-4 pt-2 sm:grid-cols-2">
                            {contactsUnavailable ? (
                              <ServiceUnavailableNotice
                                compact
                                title={t('pickupUnavailableTitle')}
                                message={SERVICE_UNAVAILABLE_MESSAGE}
                                className="sm:col-span-2"
                              />
                            ) : (
                              <>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {t('addressLabel')}:
                                  </p>
                                  {mapsUrl ? (
                                    <a
                                      href={mapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline-offset-4 transition-colors hover:text-primary hover:underline"
                                    >
                                      {address}
                                    </a>
                                  ) : (
                                    <p>{address}</p>
                                  )}
                                </div>
                                {pickupSchedule ? (
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {pickupSchedule.title}:
                                    </p>
                                    <div className="mt-1 space-y-0.5">
                                      {formatScheduleEntries(pickupSchedule).map((line) => (
                                        <p key={line}>{line}</p>
                                      ))}
                                    </div>
                                    {pickupSchedule.note?.trim() ? (
                                      <p className="mt-2 text-sm">{pickupSchedule.note}</p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  const icon =
                    group === 'nova-poshta' || group === 'packeta' || group === 'gls' ? (
                      <Truck className="h-6 w-6 text-primary" />
                    ) : null

                  return (
                    <Card key={group}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            {icon}
                          </div>
                          {t(`methods.${group}.title`)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-muted-foreground">
                        <p>{t(`methods.${group}.description`)}</p>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {t(`methods.${group}.eta`)}
                          </li>
                          <li className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            {t(`methods.${group}.tracking`)}
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>

            {groups.length ? (
              <section className="mb-16">
                <h2 className="mb-8 font-serif text-2xl font-semibold text-foreground">
                  {t('costsTitle')}
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-4 text-left font-semibold">
                          {t('costsOrderCol')}
                        </th>
                        <th className="px-4 py-4 text-left font-semibold">
                          {t('costsPriceCol')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {groups.map((group) => (
                        <tr key={group} className="border-b border-border">
                          <td className="px-4 py-4">{t(`methods.${group}.title`)}</td>
                          <td className="px-4 py-4">
                            {group === 'pickup'
                              ? t('costsFreePickup')
                              : t('costsCarrierTariff')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {payments.length ? (
              <section className="mb-16">
                <h2 className="mb-8 font-serif text-2xl font-semibold text-foreground">
                  {t('paymentTitle')}
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {payments.map((method) => {
                    const icon =
                      method === 'card-online' ? (
                        <CreditCard className="mb-4 h-8 w-8 text-primary" />
                      ) : (
                        <ShieldCheck className="mb-4 h-8 w-8 text-primary" />
                      )
                    const description =
                      method === 'dobierka'
                        ? t('payments.dobierka.description')
                        : isSk
                          ? t(`payments.${method}.descriptionSk` as 'payments.card-online.descriptionSk')
                          : t(`payments.${method}.descriptionUa` as 'payments.card-online.descriptionUa')
                    return (
                      <div key={method} className="rounded-xl bg-secondary/30 p-6">
                        {icon}
                        <h3 className="mb-2 font-semibold">
                          {t(`payments.${method}.title`)}
                        </h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-primary/5 p-8">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-foreground">
                {t('packingTitle')}
              </h2>
              <p className="mb-6 text-muted-foreground">{t('packingIntro')}</p>
              <ul className="grid gap-4 text-muted-foreground sm:grid-cols-2">
                {packingItems.map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                      <span className="text-xs font-bold text-primary">{index + 1}</span>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
