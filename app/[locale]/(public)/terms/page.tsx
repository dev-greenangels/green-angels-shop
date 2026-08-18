import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { LegalPageLinks } from '@/components/legal/legal-page-links'
import { LegalRevisionBody } from '@/components/legal/legal-revision-body'
import { Link } from '@/i18n/navigation'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { getLocale, getTranslations } from 'next-intl/server'
import { LegalSellerDetails } from '@/components/legal/legal-seller-details'
import { fetchCurrentLegalDocument, sellerFromBankDetails } from '@/lib/legal/documents'
import { resolveCheckoutBankDetails } from '@/lib/settings/company-bank-details'
import { fetchPublicSiteSettings, getCartCheckoutSettings, getStoreSettings, isStoreContactUnavailable } from '@/lib/settings/fetch'
import {
  formatStoreAddress,
  getStoreEmails,
  getStoreMapsUrl,
  getStorePhones,
  hasStoreContactInfo,
} from '@/lib/settings/store-helpers'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import { SERVICE_UNAVAILABLE_MESSAGE } from '@/lib/api/fetch-result'

export default async function TermsPage() {
  const locale = await getLocale()
  const tNav = await getTranslations('nav')
  const tLegal = await getTranslations('legalPages')
  const fetched = await fetchPublicSiteSettings()
  const store = getStoreSettings(fetched)
  const cart = getCartCheckoutSettings(fetched)
  const bank = resolveCheckoutBankDetails(cart, store)
  const legalDocument = await fetchCurrentLegalDocument('TERMS', locale)
  const fallbackSeller = sellerFromBankDetails(bank)
  const sellerName =
    legalDocument?.seller?.organizationName || fallbackSeller?.organizationName || ''
  const contactsUnavailable = isStoreContactUnavailable(fetched) || !hasStoreContactInfo(store)
  const address = formatStoreAddress(store)
  const mapsUrl = getStoreMapsUrl(store)
  const phones = getStorePhones(store)
  const emails = getStoreEmails(store)
  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        {/* Header */}
        <div className="bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={staticPageBreadcrumbs(tNav('terms'))}
            />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              {legalDocument?.title ?? 'Умови використання'}
            </h1>
          </div>
        </div>

        <div className={cn(siteContentShellClassName, 'py-12')}>
          <div className="max-w-3xl mx-auto prose prose-green">
            <div className="mb-6">
              <LegalPageLinks current="terms" />
            </div>

            <p className="text-muted-foreground text-lg mb-8">
              {legalDocument
                ? tLegal('revisionLine', { version: legalDocument.version })
                : 'Останнє оновлення: 1 лютого 2024 року'}
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
            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                1. Загальні положення
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Ці Умови використання регулюють відносини між{' '}
                  {sellerName || 'продавцем'} (далі - &quot;Продавець&quot;) та покупцями товарів
                  через інтернет-магазин (далі - &quot;Сайт&quot;).
                </p>
                <p>
                  Оформлюючи замовлення на Сайті, ви підтверджуєте свою згоду з цими 
                  Умовами використання та зобов&apos;язуєтесь їх дотримуватись.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                2. Оформлення замовлення
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Замовлення оформлюються через Сайт, по телефону або електронною поштою.
                </p>
                <p>
                  Після оформлення замовлення на вказану вами електронну адресу надходить 
                  підтвердження з деталями замовлення.
                </p>
                <p>
                  Продавець залишає за собою право відмовити у виконанні замовлення у 
                  випадку відсутності товару на складі або неможливості зв&apos;язатися з покупцем.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                3. Ціни та оплата
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Всі ціни на Сайті вказані в українських гривнях та включають ПДВ.
                </p>
                <p>
                  Продавець залишає за собою право змінювати ціни без попередження. 
                  Ціна замовлення фіксується на момент його оформлення.
                </p>
                <p>
                  Способи оплати: картою онлайн, накладний платіж, безготівковий розрахунок.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                4. Доставка
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Доставка здійснюється по всій території України службою Нова Пошта або самовивозом.
                </p>
                <p>
                  Терміни доставки залежать від обраного способу та регіону і зазвичай становлять 1-7 робочих днів.
                </p>
                <p>
                  Вартість доставки розраховується відповідно до тарифів перевізника 
                  та залежить від ваги та габаритів замовлення.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                5. Повернення та обмін
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Покупець має право повернути або обміняти товар належної якості протягом 
                  14 днів з моменту отримання, якщо товар не був у використанні та збережено 
                  його товарний вигляд.
                </p>
                <p>
                  Для рослин діють особливі умови повернення: повернення приймається тільки 
                  у випадку пошкодження при транспортуванні або невідповідності сорту. 
                  Претензії приймаються протягом 24 годин з моменту отримання з наданням фото.
                </p>
                <p>
                  Вартість зворотної доставки оплачується покупцем, крім випадків повернення 
                  товару неналежної якості.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                6. Гарантії
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Продавець гарантує якість посадкового матеріалу на момент продажу.
                </p>
                <p>
                  Гарантія не поширюється на випадки пошкодження рослин внаслідок неправильного 
                  догляду, несприятливих погодних умов або механічних пошкоджень після отримання.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                7. Конфіденційність
              </h2>
              <div className="text-muted-foreground space-y-4">
                <p>
                  Ми поважаємо вашу конфіденційність та захищаємо ваші персональні дані 
                  відповідно до Закону України &quot;Про захист персональних даних&quot;.
                </p>
                <p>
                  Ваші дані використовуються виключно для обробки замовлень та комунікації 
                  з вами і не передаються третім особам без вашої згоди.
                </p>
              </div>
            </section>
              </>
            )}

            <section className="mb-8">
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">
                8. Контактна інформація
              </h2>
              <div className="text-muted-foreground space-y-2">
                {sellerName ? (
                  <p><strong className="text-foreground">{sellerName}</strong></p>
                ) : null}
                {contactsUnavailable ? (
                  <ServiceUnavailableNotice
                    compact
                    title="Контактна інформація тимчасово недоступна"
                    message={SERVICE_UNAVAILABLE_MESSAGE}
                    className="text-left"
                  />
                ) : (
                  <>
                    <p>
                      Адреса:{' '}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {address}
                      </a>
                    </p>
                    {phones.map((item) => (
                      <p key={item.phone}>
                        Телефон ({item.label}): {item.phone}
                      </p>
                    ))}
                    {emails.map((item) => (
                      <p key={item.email}>
                        Email ({item.label}): {item.email}
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
