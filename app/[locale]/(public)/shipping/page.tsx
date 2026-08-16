import { Truck, Package, CreditCard, MapPin, Clock, ShieldCheck } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { getTranslations } from 'next-intl/server'
import { fetchPublicSiteSettings, getStoreSettings, isStoreContactUnavailable } from '@/lib/settings/fetch'
import {
  findStoreSchedule,
  formatScheduleEntries,
  formatStoreAddress,
  getStoreMapsUrl,
  getStoreSchedules,
  hasStoreContactInfo,
} from '@/lib/settings/store-helpers'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'

export default async function ShippingPage() {
  const tFooter = await getTranslations('footer')
  const fetched = await fetchPublicSiteSettings()
  const store = getStoreSettings(fetched)
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const address = formatStoreAddress(store)
  const mapsUrl = getStoreMapsUrl(store)
  const pickupSchedule =
    findStoreSchedule(store, 'садов', 'центр') ?? getStoreSchedules(store)[0]

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tFooter('shipping'))}
            />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Доставка та оплата
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="max-w-4xl mx-auto">
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">
                Способи доставки
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      Нова Пошта
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-muted-foreground">
                    <p>Доставка у відділення або поштомат по всій Україні.</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Термін: 1-3 дні
                      </li>
                      <li className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Відстеження посилки онлайн
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      Самовивіз
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-muted-foreground">
                    <p>
                      Ви можете забрати замовлення особисто з нашого розсадника.
                    </p>
                    <div className="grid gap-4 pt-2 sm:grid-cols-2">
                      {contactsUnavailable ? (
                        <ServiceUnavailableNotice
                          compact
                          title="Адреса самовивозу тимчасово недоступна"
                          message={SERVICE_UNAVAILABLE_MESSAGE}
                          className="sm:col-span-2"
                        />
                      ) : (
                        <>
                          <div>
                            <p className="font-medium text-foreground">Адреса:</p>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="transition-colors hover:text-primary hover:underline underline-offset-4"
                            >
                              {address}
                            </a>
                          </div>
                          {pickupSchedule ? (
                            <div>
                              <p className="font-medium text-foreground">{pickupSchedule.title}:</p>
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
              </div>
            </section>

            <section className="mb-16">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">
                Вартість доставки
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-semibold">Сума замовлення</th>
                      <th className="text-left py-4 px-4 font-semibold">Вартість доставки</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Нова Пошта</td>
                      <td className="py-4 px-4">За тарифами перевізника</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-4 px-4">Самовивіз</td>
                      <td className="py-4 px-4">Без додаткової плати за доставку</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-16">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-8">
                Способи оплати
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-6 bg-secondary/30 rounded-xl">
                  <CreditCard className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Карткою онлайн</h3>
                  <p className="text-sm text-muted-foreground">
                    Visa, Mastercard, Apple Pay, Google Pay через захищену платіжну систему
                  </p>
                </div>
                <div className="p-6 bg-secondary/30 rounded-xl">
                  <ShieldCheck className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Безготівковий</h3>
                  <p className="text-sm text-muted-foreground">
                    Для юридичних осіб з ПДВ або без
                  </p>
                </div>
              </div>
            </section>

            <section className="p-8 bg-primary/5 rounded-2xl">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Упаковка рослин
              </h2>
              <p className="text-muted-foreground mb-6">
                Ми дбаємо про те, щоб рослини дісталися до вас у найкращому стані:
              </p>
              <ul className="grid sm:grid-cols-2 gap-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <span>Фіксація кореневої системи для запобігання пошкодженню</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">2</span>
                  </div>
                  <span>Захист крони спеціальною сіткою або папером</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">3</span>
                  </div>
                  <span>Використання вологоутримуючих матеріалів</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">4</span>
                  </div>
                  <span>Надійні коробки з маркуванням &quot;Обережно, рослини&quot;</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
