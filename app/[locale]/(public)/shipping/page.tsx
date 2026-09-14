import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CreditCard, MapPin, Package, ShieldCheck, Truck } from 'lucide-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'
import { formatMoneyAmount } from '@/lib/commerce/format'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import {
  legalPageTitleClassName,
  legalSectionHeadingClassName,
} from '@/lib/legal/storefront-typography'
import { getRequestCountrySiteCode } from '@/lib/country-sites/request-country'
import { resolvePublicSupportEmail } from '@/lib/settings/public-support-email'
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
  formatStoreAddress,
  getStoreSchedules,
  hasStoreContactInfo,
  resolveStoreMapsHref,
} from '@/lib/settings/store-helpers'
import {
  presentScheduleEntries,
  presentScheduleTitle,
} from '@/lib/settings/schedule-presentation'
import { buildShippingMetadata } from '@/lib/shipping/metadata'
import {
  buildShippingPageMethodContext,
  type ShippingDeliveryGroup,
} from '@/lib/shipping/shipping-page-context'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildShippingMetadata(locale)
}

export default async function ShippingPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const tFooter = await getTranslations('footer')
  const t = await getTranslations('shippingPage')
  const tCheckout = await getTranslations('checkout')
  const tContacts = await getTranslations('contactsPage')
  const tNav = await getTranslations('nav')

  const [fetched, countryCode] = await Promise.all([
    fetchPublicSiteSettings(),
    getRequestCountrySiteCode(),
  ])
  const market = getMarketSettings(fetched)
  const isSk = market.region === 'sk'
  const cart = getCartCheckoutSettings(fetched)
  const storeRaw = getStoreSettings(fetched, { locale })
  const store = resolveStoreForCountrySite(storeRaw, market, countryCode)
  const settings = 'settings' in fetched ? fetched.settings : fetched
  const ctx = buildShippingPageMethodContext({
    market,
    cart,
    hostCountry: countryCode,
    dispatchCalendarEnabled: settings.dispatchCalendar?.enabled === true,
  })

  const contactsUnavailable =
    isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const address = formatStoreAddress(store)
  const mapsUrl = resolveStoreMapsHref(store)
  const supportEmail = resolvePublicSupportEmail({
    store: storeRaw,
    market,
    countrySiteCode: countryCode,
  })
  const pickupSchedule =
    findStoreSchedule(store, 'садов', 'центр') ?? getStoreSchedules(store)[0]
  const schedulePresentation = {
    hours: tContacts('hours'),
    contactUs: tContacts('contactUs'),
    closed: tContacts('closed'),
    open: tContacts('open'),
    weekday: {
      mon: tContacts('weekdays.mon'),
      tue: tContacts('weekdays.tue'),
      wed: tContacts('weekdays.wed'),
      thu: tContacts('weekdays.thu'),
      fri: tContacts('weekdays.fri'),
      sat: tContacts('weekdays.sat'),
      sun: tContacts('weekdays.sun'),
    },
    weekdayRange: (from: string, to: string) => tContacts('weekdayRange', { from, to }),
  }

  const currencyInfo = {
    code: ctx.currency,
    symbol: ctx.currency,
    decimals: ctx.currency === 'HUF' ? 0 : 2,
  }
  const codFeeLabel =
    ctx.codFeeAmount != null
      ? formatMoneyAmount(ctx.codFeeAmount, currencyInfo, locale)
      : null

  const showPaymentsSection =
    ctx.showCard || ctx.showBankTransfer || ctx.showCod || ctx.showPayOnPickup

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
            <h1 className={legalPageTitleClassName}>{t('title')}</h1>
            <div className="mt-4 max-w-3xl space-y-3 text-lg text-muted-foreground">
              <p>{t('intro')}</p>
              <p>{t('introExactPrice')}</p>
            </div>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'legal-document py-12')}>
          <div className="mx-auto max-w-4xl space-y-16">
            {ctx.countries.length > 0 ? (
              <section>
                <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                  {t('countriesTitle')}
                </h2>
                <p className="mb-4 text-muted-foreground">{t('countriesIntro')}</p>
                <ul className="list-disc space-y-1 pl-5 text-foreground">
                  {ctx.countries.map((code) => (
                    <li key={code}>{tCheckout(`deliveryCountries.${code}`)}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {ctx.carrierGroups.length > 0 ? (
              <section>
                <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                  {t('deliveryTitle')}
                </h2>
                <p className="mb-4 text-muted-foreground">{t('deliveryIntro')}</p>
                <p className="mb-8 text-muted-foreground">{t('packingNote')}</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {ctx.carrierGroups.map((group) => (
                    <CarrierMethodCard key={group} group={group} t={t} />
                  ))}
                </div>
              </section>
            ) : null}

            {ctx.pickupAvailable ? (
              <section>
                <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                  {t('pickupTitle')}
                </h2>
                <p className="mb-3 text-muted-foreground">{t('pickupBody')}</p>
                <p className="mb-6 text-muted-foreground">{t('pickupAddressNote')}</p>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      {t('pickupTitle')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-muted-foreground">
                    {ctx.deliveryFreeForPickup ? (
                      <p>{t('costsFreePickup')}</p>
                    ) : null}
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
                            {address ? (
                              mapsUrl ? (
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
                              )
                            ) : (
                              <p>{t('pickupAddressFallback')}</p>
                            )}
                          </div>
                          {pickupSchedule ? (
                            <div>
                              <p className="font-medium text-foreground">
                                {presentScheduleTitle(
                                  pickupSchedule.title,
                                  schedulePresentation,
                                )}
                                :
                              </p>
                              <div className="mt-1 space-y-0.5">
                                {presentScheduleEntries(
                                  pickupSchedule.entries,
                                  schedulePresentation,
                                ).map((line) => (
                                  <p key={line}>{line}</p>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </section>
            ) : null}

            <section>
              <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                {t('costsTitle')}
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>{t('costsBody1')}</p>
                <p>{t('costsBody2')}</p>
                <p>{t('costsBody3')}</p>
              </div>
            </section>

            <section>
              <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                {t('deliveryTimeTitle')}
              </h2>
              <p className="text-muted-foreground">{t('deliveryTimeBody')}</p>
            </section>

            {ctx.dispatchCalendarEnabled ? (
              <section>
                <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                  {t('dispatchDateTitle')}
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>{t('dispatchDateBody1')}</p>
                  <p>{t('dispatchDateBody2')}</p>
                </div>
              </section>
            ) : null}

            {showPaymentsSection ? (
              <section>
                <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                  {t('paymentTitle')}
                </h2>
                <p className="mb-6 text-muted-foreground">{t('paymentIntro')}</p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {ctx.showCard ? (
                    <PaymentBlock
                      icon={<CreditCard className="mb-4 h-8 w-8 text-primary" />}
                      title={t('payments.card-online.title')}
                      body={t('payments.card-online.description')}
                    />
                  ) : null}
                  {ctx.showBankTransfer ? (
                    <PaymentBlock
                      icon={<ShieldCheck className="mb-4 h-8 w-8 text-primary" />}
                      title={t('payments.bank-transfer.title')}
                      body={t('payments.bank-transfer.description')}
                    />
                  ) : null}
                  {ctx.showCod ? (
                    <PaymentBlock
                      icon={<ShieldCheck className="mb-4 h-8 w-8 text-primary" />}
                      title={t('payments.dobierka.title')}
                      body={
                        <>
                          <p>{t('payments.dobierka.description')}</p>
                          <p className="mt-2">
                            {codFeeLabel
                              ? t('codFeeFixed', { amount: codFeeLabel })
                              : t('payments.dobierka.feeNote')}
                          </p>
                        </>
                      }
                    />
                  ) : null}
                  {ctx.showPayOnPickup ? (
                    <PaymentBlock
                      icon={<ShieldCheck className="mb-4 h-8 w-8 text-primary" />}
                      title={t('payments.pay-on-pickup.title')}
                      body={t('payments.pay-on-pickup.description')}
                    />
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-primary/5 p-8">
              <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                {t('livePlantsTitle')}
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>{t('livePlantsBody1')}</p>
                <p>{t('livePlantsBody2')}</p>
              </div>
            </section>

            <section>
              <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                {t('damageTitle')}
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>{t('damageBody1')}</p>
                <p>{t('damageBody2')}</p>
                <p>{t('damageBody3')}</p>
              </div>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
                  {tFooter(isSk ? 'termsSk' : 'terms')}
                </Link>
                <Link href="/returns" className="text-primary underline-offset-4 hover:underline">
                  {tFooter(isSk ? 'returnsSk' : 'returns')}
                </Link>
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 p-8">
              <h2 className={cn('mb-4', legalSectionHeadingClassName)}>
                {t('helpTitle')}
              </h2>
              <p className="mb-6 text-muted-foreground">{t('helpBody')}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/contacts">{tNav('contacts')}</Link>
                </Button>
                {supportEmail ? (
                  <Button variant="outline" asChild>
                    <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
                  </Button>
                ) : null}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}

function PaymentBlock({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: ReactNode
}) {
  return (
    <div className="rounded-xl bg-secondary/30 p-6">
      {icon}
      <h3 className="mb-2 font-semibold">{title}</h3>
      <div className="text-sm text-muted-foreground">{body}</div>
    </div>
  )
}

function CarrierMethodCard({
  group,
  t,
}: {
  group: Exclude<ShippingDeliveryGroup, 'pickup'>
  t: {
    (key: `methods.${Exclude<ShippingDeliveryGroup, 'pickup'>}.title`): string
    (key: `methods.${Exclude<ShippingDeliveryGroup, 'pickup'>}.description`): string
    (key: `methods.${Exclude<ShippingDeliveryGroup, 'pickup'>}.tracking`): string
  }
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          {t(`methods.${group}.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-muted-foreground">
        <p>{t(`methods.${group}.description`)}</p>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {t(`methods.${group}.tracking`)}
          </li>
        </ul>
      </CardContent>
    </Card>
  )
}
