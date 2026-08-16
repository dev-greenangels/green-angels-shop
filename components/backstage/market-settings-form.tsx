'use client'

import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { CurrencyInfo } from '@/lib/commerce/types'
import { LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n/locales'
import type { CountrySiteProfile, MarketSettings } from '@/lib/settings/market'
import {
  DEFAULT_COUNTRY_SITES,
  DEFAULT_DELIVERY_COUNTRY_CATALOG,
  DEFAULT_DOMAIN_DELIVERY_COUNTRIES,
} from '@/lib/settings/market'

type MarketSettingsFormProps = {
  market: MarketSettings
  currencies: CurrencyInfo[]
  currenciesLoading?: boolean
  onChange: (market: MarketSettings) => void
  onSave: () => void
  saving: boolean
  isDirty?: boolean
}

function currencyLabel(row: CurrencyInfo) {
  return `${row.code} — ${row.symbol} (${row.name || row.code})`
}

const COUNTRY_LABELS: Record<CountrySiteProfile['code'], string> = {
  sk: 'Словаччина (.sk)',
  hu: 'Угорщина (.hu)',
  at: 'Австрія (.at)',
}

const DELIVERY_COUNTRY_LABELS: Record<string, string> = {
  sk: 'Словаччина',
  hu: 'Угорщина',
  at: 'Австрія',
  cz: 'Чехія',
  de: 'Німеччина',
}

function deliveryCountryLabel(code: string) {
  return DELIVERY_COUNTRY_LABELS[code] ?? code.toUpperCase()
}

function ensureDeliveryCatalog(market: MarketSettings) {
  if (market.deliveryCountryCatalog.length > 0) {
    return market.deliveryCountryCatalog
  }
  return DEFAULT_DELIVERY_COUNTRY_CATALOG.map((c) => ({
    ...c,
    reducedRates: c.reducedRates.map((r) => ({
      ...r,
      cnPrefixes: [...r.cnPrefixes],
    })),
  }))
}

export function MarketSettingsForm({
  market,
  currencies,
  currenciesLoading = false,
  onChange,
  onSave,
  saving,
  isDirty = false,
}: MarketSettingsFormProps) {
  const patch = (partial: Partial<MarketSettings>) => onChange({ ...market, ...partial })
  const activeCurrencies = currencies.filter((c) => c.isActive)
  const currencyValue =
    activeCurrencies.some((c) => c.code === market.defaultCurrency)
      ? market.defaultCurrency
      : (activeCurrencies[0]?.code ?? market.defaultCurrency)

  const patchCountrySite = (code: CountrySiteProfile['code'], partial: Partial<CountrySiteProfile>) => {
    const next = market.countrySites.map((site) =>
      site.code === code ? { ...site, ...partial } : site,
    )
    patch({ countrySites: next })
  }

  const toggleCountryLocale = (code: CountrySiteProfile['code'], locale: AppLocale, checked: boolean) => {
    const site = market.countrySites.find((s) => s.code === code)
    if (!site) return
    let availableLocales = checked
      ? [...site.availableLocales, locale]
      : site.availableLocales.filter((l) => l !== locale)
    if (availableLocales.length === 0) availableLocales = [site.defaultLocale]
    const defaultLocale = availableLocales.includes(site.defaultLocale)
      ? site.defaultLocale
      : availableLocales[0]!
    patchCountrySite(code, { availableLocales, defaultLocale })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Регіон розгортання</CardTitle>
          <CardDescription>
            Один регіон на інстанс. Не використовуйте перемикач ринку в реальному часі — для іншого
            ринку розгортається окрема інстанція з власною базою даних.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Регіон</Label>
            <Select
              value={market.region}
              onValueChange={(value) => {
                const region = value as MarketSettings['region']
                if (region === 'sk') {
                  patch({
                    region,
                    countrySites:
                      market.countrySites.length > 0
                        ? market.countrySites
                        : DEFAULT_COUNTRY_SITES.map((s) => ({ ...s })),
                    deliveryCountryCatalog:
                      market.deliveryCountryCatalog.length > 0
                        ? market.deliveryCountryCatalog
                        : DEFAULT_DELIVERY_COUNTRY_CATALOG.map((c) => ({
                            ...c,
                            reducedRates: c.reducedRates.map((r) => ({
                              ...r,
                              cnPrefixes: [...r.cnPrefixes],
                            })),
                          })),
                    domainDeliveryCountries: {
                      sk: [...(market.domainDeliveryCountries.sk.length
                        ? market.domainDeliveryCountries.sk
                        : DEFAULT_DOMAIN_DELIVERY_COUNTRIES.sk)],
                      hu: [...(market.domainDeliveryCountries.hu.length
                        ? market.domainDeliveryCountries.hu
                        : DEFAULT_DOMAIN_DELIVERY_COUNTRIES.hu)],
                      at: [...(market.domainDeliveryCountries.at.length
                        ? market.domainDeliveryCountries.at
                        : DEFAULT_DOMAIN_DELIVERY_COUNTRIES.at)],
                    },
                    defaultCurrency:
                      market.defaultCurrency === 'UAH' ? 'EUR' : market.defaultCurrency,
                    otpEmailLogin: true,
                    otpEmailCheckout: true,
                    otpEmailReview: true,
                    otpEmailProfile: true,
                    otpSmsLogin: false,
                    otpSmsCheckout: false,
                    otpSmsReview: false,
                    otpSmsProfile: true,
                    priceBasis: 'inc_vat',
                    storefrontPrimaryPrice: 'inc_vat',
                    storefrontShowExVatSecondary: true,
                    authPhonePolicy: 'intl',
                    deliveryPhonePolicy: 'intl',
                    phonePolicy: 'intl',
                  })
                  return
                }
                patch({
                  region,
                  countrySites: [],
                  deliveryCountryCatalog: [],
                  domainDeliveryCountries: { sk: [], hu: [], at: [] },
                  priceBasis: 'inc_vat',
                  storefrontPrimaryPrice: 'inc_vat',
                  storefrontShowExVatSecondary: false,
                  authPhonePolicy: 'intl',
                  deliveryPhonePolicy: 'ua_e164',
                  phonePolicy: 'intl',
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ua">Україна</SelectItem>
                <SelectItem value="sk">Словаччина</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Валюта за замовчуванням</Label>
            <Select
              value={currencyValue}
              disabled={currenciesLoading || activeCurrencies.length === 0}
              onValueChange={(value) => patch({ defaultCurrency: value })}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={currenciesLoading ? 'Завантаження…' : 'Оберіть валюту'}
                />
              </SelectTrigger>
              <SelectContent>
                {activeCurrencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {currencyLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              З довідника валют. Збереження оновлює валюту каталогу та замовлень.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Телефон: login / реєстрація / профіль</Label>
            <Select
              value={market.authPhonePolicy}
              onValueChange={(value) =>
                patch({
                  authPhonePolicy: value as MarketSettings['authPhonePolicy'],
                  phonePolicy: value as MarketSettings['authPhonePolicy'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intl">Міжнародний (за замовчуванням)</SelectItem>
                <SelectItem value="ua_e164">UA (+380) — лише для UA-інстансу</SelectItem>
                <SelectItem value="sk_e164">SK (+421)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              UA зазвичай intl (іноземці можуть реєструватись). За потреби можна обмежити до +380.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Телефон: доставка (отримувач / НП)</Label>
            <Select
              value={market.deliveryPhonePolicy}
              onValueChange={(value) =>
                patch({
                  deliveryPhonePolicy: value as MarketSettings['deliveryPhonePolicy'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ua_e164">UA (+380)</SelectItem>
                <SelectItem value="intl">Міжнародний</SelectItem>
                <SelectItem value="sk_e164">SK (+421)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              UA: ua_e164 для перевізника. SK/EU: intl без привʼязки до однієї країни.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Версія тексту згоди на обробку даних</Label>
            <Input
              value={market.privacyConsentVersion}
              maxLength={20}
              onChange={(e) => patch({ privacyConsentVersion: e.target.value })}
              placeholder="1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Базис цін і вітрина</CardTitle>
          <CardDescription>
            SK (ABRA): у каталозі зберігається продажна ціна <strong>з DPH</strong> — базис «З ПДВ».
            На вітрині основна цифра = ця сума; другу ціну без DPH можна показати дрібніше. UA зазвичай
            теж «З ПДВ». Не ставте SK на «Без ПДВ», якщо в ABRA вже ціна including VAT — буде
            подвійне нарахування.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Базис цін у каталозі (БД / Абра)</Label>
            <Select
              value={market.priceBasis}
              onValueChange={(value) =>
                patch({ priceBasis: value as MarketSettings['priceBasis'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inc_vat">З ПДВ (inc VAT) — SK Flexi / типово</SelectItem>
                <SelectItem value="ex_vat">Без ПДВ (ex VAT) — лише якщо в БД net</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Checkout: «З ПДВ» — витягує суму податку з ціни; «Без ПДВ» — додає податок зверху.
              Прапорець у вкладці «Кошик» синхронізується з цим полем.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Основна ціна на вітрині</Label>
            <Select
              value={market.storefrontPrimaryPrice}
              onValueChange={(value) =>
                patch({
                  storefrontPrimaryPrice: value as MarketSettings['storefrontPrimaryPrice'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inc_vat">З ПДВ (рекомендовано для B2C)</SelectItem>
                <SelectItem value="ex_vat">Без ПДВ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Показувати другу ціну без ПДВ</p>
              <p className="text-xs text-muted-foreground">
                Під основною ціною на картці товару / каталозі (напр. «bez DPH: …»)
              </p>
            </div>
            <Switch
              checked={market.storefrontShowExVatSecondary}
              onCheckedChange={(checked) =>
                patch({ storefrontShowExVatSecondary: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {market.region === 'sk' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Чекліст SK deploy</CardTitle>
              <CardDescription>
                Операційні кроки перед продакшеном (не код — налаштування в бекофісі / ABRA).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Market: EUR, auth/delivery phone intl, email OTP; базис цін «З ПДВ» (Flexi Selling price
                  including VAT) + на вітрині основна «З ПДВ» / secondary «Без ПДВ».
                </li>
                <li>
                  Cart/checkout: увімкнути Packeta box/courier, GLS, pickup; Stripe; packaging +
                  delivery видимі; carrier_rates + тарифи ваги.
                </li>
                <li>
                  Flexi: Premium, склад, středisko SITE, typ OBP / FAKTURA, статус schvaleno,
                  авторезервація в ABRA.
                </li>
                <li>
                  Packeta API key + sender; GLS MyGLS credentials у backstage.
                </li>
                <li>
                  Календар відправок: увімкнути, ліміт/день, відкриті дні тижня, свята.
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Домени вітрини</CardTitle>
              <CardDescription>
                Профілі green-angels.sk / .hu / .at: мови та валюта домену. Хости задаються в env
                через GA_COUNTRY_HOSTS. Куди можна доставляти — у блоці «Куди доставляємо» нижче.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {market.countrySites.map((site) => (
                <div
                  key={site.code}
                  className="space-y-4 rounded-lg border border-border/60 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium">{COUNTRY_LABELS[site.code]}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Увімкнено</span>
                      <Switch
                        checked={site.enabled}
                        onCheckedChange={(checked) =>
                          patchCountrySite(site.code, { enabled: checked })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Мова за замовчуванням</Label>
                      <Select
                        value={site.defaultLocale}
                        onValueChange={(value) =>
                          patchCountrySite(site.code, {
                            defaultLocale: value as AppLocale,
                            availableLocales: site.availableLocales.includes(value as AppLocale)
                              ? site.availableLocales
                              : [...site.availableLocales, value as AppLocale],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_LOCALES.map((locale) => (
                            <SelectItem key={locale} value={locale}>
                              {LOCALE_LABELS[locale]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Валюта домену</Label>
                      <Select
                        value={site.currency}
                        onValueChange={(value) =>
                          patchCountrySite(site.code, {
                            currency: value as CountrySiteProfile['currency'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="HUF">HUF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Мови в свічері</Label>
                    <div className="flex flex-wrap gap-3">
                      {SUPPORTED_LOCALES.map((locale) => (
                        <label key={locale} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={site.availableLocales.includes(locale)}
                            onChange={(e) =>
                              toggleCountryLocale(site.code, locale, e.target.checked)
                            }
                          />
                          {LOCALE_LABELS[locale]}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Податки SK (DPH / OSS)</CardTitle>
              <CardDescription>
                Одна точка правди для чекауту: довідник «Куди доставляємо» + CN товару. Нижче —
                fallback SK і тогл OSS. Актуальні ставки з ЄС також у{' '}
                <a href="/backstage/tedb" className="font-medium text-primary underline-offset-4 hover:underline">
                  TEDB / ставки ПДВ
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Курс EUR → HUF (домен .hu)</Label>
                <Input
                  type="number"
                  min={0.0001}
                  step={0.01}
                  value={market.eurToHufRate}
                  onChange={(e) => patch({ eurToHufRate: Number(e.target.value) || 400 })}
                />
                <p className="text-xs text-muted-foreground">
                  1 EUR = {market.eurToHufRate || 0} HUF
                </p>
              </div>
              <div className="space-y-2">
                <Label>Fallback ПДВ продавця (SK), %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={market.sellerTaxRatePercent}
                  onChange={(e) =>
                    patch({ sellerTaxRatePercent: Number(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Якщо в довіднику немає ставки для країни — береться це значення. Зазвичай =
                  стандарт SK у довіднику.
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">
                    OSS: ПДВ країни доставки (після €10 000)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Вимкнено — B2C завжди за ставкою SK з довідника (і CN). Увімкнено — ставка країни
                    доставки з довідника. Поликова ціна (gross) не змінюється.
                  </p>
                </div>
                <Switch
                  checked={market.applyDestinationVatB2c}
                  onCheckedChange={(checked) => patch({ applyDestinationVatB2c: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Куди доставляємо</CardTitle>
              <CardDescription>
                Спільний довідник країн і ставок + які країни доступні з кожного домену (напр. .sk →
                SK+CZ, .at → AT+DE). Без окремих доменів для CZ/DE.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {ensureDeliveryCatalog(market).map((entry) => (
                <div
                  key={entry.code}
                  className="space-y-3 rounded-lg border border-border/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {deliveryCountryLabel(entry.code)}{' '}
                      <span className="text-muted-foreground">({entry.code.toUpperCase()})</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">У довіднику</span>
                      <Switch
                        checked={entry.enabled}
                        onCheckedChange={(checked) => {
                          const catalog = ensureDeliveryCatalog(market)
                          patch({
                            deliveryCountryCatalog: catalog.map((c) =>
                              c.code === entry.code ? { ...c, enabled: checked } : c,
                            ),
                          })
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Стандартна ставка %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={entry.standardRatePercent}
                        onChange={(e) => {
                          const catalog = ensureDeliveryCatalog(market)
                          const nextRate = Number(e.target.value) || 0
                          const siteCodes = new Set(['sk', 'hu', 'at'])
                          patch({
                            deliveryCountryCatalog: catalog.map((c) =>
                              c.code === entry.code
                                ? { ...c, standardRatePercent: nextRate }
                                : c,
                            ),
                            // Keep legacy domain field aligned (hidden in UI, still in JSON).
                            countrySites: siteCodes.has(entry.code)
                              ? market.countrySites.map((s) =>
                                  s.code === entry.code
                                    ? { ...s, taxRatePercent: nextRate }
                                    : s,
                                )
                              : market.countrySites,
                          })
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Пільгові (рослини / CN)</Label>
                      {entry.reducedRates.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Немає</p>
                      ) : (
                        entry.reducedRates.map((r, idx) => (
                          <div key={r.code} className="flex flex-wrap items-end gap-2">
                            <div className="min-w-[5rem] space-y-1">
                              <span className="text-xs text-muted-foreground">{r.code}</span>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={r.percent}
                                onChange={(e) => {
                                  const catalog = ensureDeliveryCatalog(market)
                                  patch({
                                    deliveryCountryCatalog: catalog.map((c) => {
                                      if (c.code !== entry.code) return c
                                      const reducedRates = c.reducedRates.map((rr, i) =>
                                        i === idx
                                          ? { ...rr, percent: Number(e.target.value) || 0 }
                                          : rr,
                                      )
                                      return { ...c, reducedRates }
                                    }),
                                  })
                                }}
                              />
                            </div>
                            <p className="pb-2 text-xs text-muted-foreground">
                              % · CN {r.cnPrefixes.join(', ') || '—'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="space-y-4 border-t border-border/60 pt-4">
                <p className="text-sm font-medium">Дозволено з домену</p>
                {(['sk', 'hu', 'at'] as const).map((site) => {
                  const selected =
                    market.domainDeliveryCountries[site]?.length
                      ? market.domainDeliveryCountries[site]
                      : DEFAULT_DOMAIN_DELIVERY_COUNTRIES[site]
                  const catalog = ensureDeliveryCatalog(market)
                  return (
                    <div key={site} className="space-y-2">
                      <Label>{COUNTRY_LABELS[site]}</Label>
                      <div className="flex flex-wrap gap-3">
                        {catalog.map((c) => (
                          <label key={c.code} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              disabled={!c.enabled}
                              checked={selected.includes(c.code)}
                              onChange={(e) => {
                                const cur = new Set(selected)
                                if (e.target.checked) cur.add(c.code)
                                else cur.delete(c.code)
                                patch({
                                  domainDeliveryCountries: {
                                    ...market.domainDeliveryCountries,
                                    [site]: [...cur],
                                  },
                                })
                              }}
                            />
                            {deliveryCountryLabel(c.code)}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Inventory authority</CardTitle>
          <CardDescription>
            Who owns stock for this deploy. Does not change checkout/Flexi wiring until ERP sync
            batches. EXTERNAL ≠ ERP must be online right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Inventory authority</Label>
            <Select
              value={market.inventoryMode}
              onValueChange={(value) => {
                const next = value as MarketSettings['inventoryMode']
                if (next === market.inventoryMode) return
                const confirmed = window.confirm(
                  next === 'external'
                    ? 'Switch to EXTERNAL? ERP becomes the inventory authority; the website keeps the latest synced stock and will sync orders when ERP batches are enabled. Current checkout/Flexi behavior is unchanged until those batches land.'
                    : 'Switch to LOCAL? The website manages stock independently (ProductVariant.stock + REL-002). Confirm only if this deploy should not treat ERP as authority.',
                )
                if (!confirmed) return
                patch({ inventoryMode: next })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">LOCAL — Website manages stock independently</SelectItem>
                <SelectItem value="external">
                  EXTERNAL — ERP is the inventory authority; website synchronizes stock and orders
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Per-deploy setting (`commerce.market`). Not a runtime UA/SK switcher. Provider (Flexi /
            ABRA / 1C) is separate from this mode.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Чекаут і відгуки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Режим гостьового оформлення</Label>
            <Select
              value={market.guestCheckoutMode}
              onValueChange={(value) =>
                patch({ guestCheckoutMode: value as MarketSettings['guestCheckoutMode'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Лише для зареєстрованих</SelectItem>
                <SelectItem value="soft">
                  Гість з розпізнаванням акаунта (опційний вхід; без автозлиття)
                </SelectItem>
                <SelectItem value="true_guest">
                  Повний гість (без розпізнавання акаунта; вхід лише через OTP/Google)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {market.guestCheckoutMode === 'soft' || market.guestCheckoutMode === 'true_guest' ? (
            <p className="text-xs text-muted-foreground">
              SEC-007: гостьове оформлення створює замовлення без User, доки клієнт явно не увійде
              (Email OTP / Phone OTP / Google). «soft» — опційне розпізнавання акаунта на чекауті;
              «true_guest» — без підказок про акаунт.
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Email у чекауті обов&apos;язковий</p>
              <p className="text-xs text-muted-foreground">
                Визначає, чи потрібно покупцю вказувати email для оформлення замовлення.
              </p>
            </div>
            <Switch
              checked={market.checkoutEmailRequired}
              onCheckedChange={(checked) => patch({ checkoutEmailRequired: checked })}
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Дозволити гостьові відгуки</p>
              <p className="text-xs text-muted-foreground">Без входу в акаунт</p>
            </div>
            <Switch
              checked={market.allowGuestReviews}
              onCheckedChange={(checked) => patch({ allowGuestReviews: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OTP (SMS / Email)</CardTitle>
          <CardDescription>
            Login, checkout and profile contact verification are independent. For Slovakia, SMS login
            and checkout are typically off while profile phone verification can stay on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              {
                surface: 'Логін / реєстрація',
                smsKey: 'otpSmsLogin',
                emailKey: 'otpEmailLogin',
              },
              {
                surface: 'Чекаут',
                smsKey: 'otpSmsCheckout',
                emailKey: 'otpEmailCheckout',
              },
              {
                surface: 'Профіль (додати / змінити контакт)',
                smsKey: 'otpSmsProfile',
                emailKey: 'otpEmailProfile',
              },
              {
                surface: 'Залишити відгук',
                smsKey: 'otpSmsReview',
                emailKey: 'otpEmailReview',
              },
            ] as const
          ).map((row) => (
            <div
              key={row.smsKey}
              className="grid gap-3 rounded-lg border border-border/60 px-4 py-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
            >
              <p className="text-sm font-medium">{row.surface}</p>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs text-muted-foreground">SMS</span>
                <Switch
                  checked={market[row.smsKey]}
                  onCheckedChange={(checked) => patch({ [row.smsKey]: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs text-muted-foreground">Email</span>
                <Switch
                  checked={market[row.emailKey]}
                  onCheckedChange={(checked) => patch({ [row.emailKey]: checked })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Згода при авторизації</CardTitle>
          <CardDescription>
            Текст під формою входу. Плейсхолдери: {'{terms}'}, {'{privacy}'}, {'{cookies}'} —
            стануть посиланнями на відповідні сторінки.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={market.authConsentText}
            onChange={(e) => patch({ authConsentText: e.target.value })}
            rows={4}
            className="min-h-[96px]"
          />
        </CardContent>
      </Card>

      <FormSaveBar onSave={onSave} saving={saving} isDirty={isDirty} sticky />
    </div>
  )
}
