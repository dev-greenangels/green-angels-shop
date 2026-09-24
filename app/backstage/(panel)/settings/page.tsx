'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import {
  useBackstageContentLocale,
  useContentLocaleSwitchSave,
} from '@/components/backstage/backstage-content-locale'
import { CartCheckoutSettingsForm } from '@/components/backstage/cart-checkout-settings-form'
import { CatalogSettingsForm } from '@/components/backstage/catalog-settings-form'
import { NovaPoshtaSettingsForm } from '@/components/backstage/nova-poshta-settings-form'
import { PacketaSettingsForm } from '@/components/backstage/packeta-settings-form'
import { GlsSettingsForm } from '@/components/backstage/gls-settings-form'
import { FlexiSettingsForm } from '@/components/backstage/flexi-settings-form'
import { RecentlyViewedSettingsForm } from '@/components/backstage/recently-viewed-settings-form'
import { MarketSettingsForm } from '@/components/backstage/market-settings-form'
import { clearRecentlyViewedSettingsCache } from '@/components/product/recently-viewed-section'
import { WithdrawalSettingsForm } from '@/components/backstage/withdrawal-settings-form'
import { StoreContactSettingsForm } from '@/components/backstage/store-contact-settings-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchBackstageSettings,
  updateBackstageCartCheckoutSettings,
  updateBackstageCatalogSettings,
  updateBackstageMarketSettings,
  updateBackstageMediaWatermarkSettings,
  updateBackstageRecentlyViewedSettings,
  updateBackstageStoreSettings,
  updateBackstageWithdrawalSettings,
  updateBackstagePrestaImportSettings,
} from '@/lib/backstage/settings'
import { fetchCurrencies } from '@/lib/backstage/reference-data'
import type { CurrencyInfo } from '@/lib/commerce/types'
import { buildCartOwnedCheckoutPatch } from '@/lib/backstage/cart-checkout-ownership'
import {
  DEFAULT_CART_CHECKOUT_SETTINGS,
  DEFAULT_CATALOG_SETTINGS,
  DEFAULT_MARKET_SETTINGS,
  DEFAULT_MEDIA_WATERMARK_SETTINGS,
  DEFAULT_RECENTLY_VIEWED_SETTINGS,
} from '@/lib/settings/defaults'
import { normalizeCartCheckoutSettings } from '@/lib/settings/cart-checkout.normalize'
import { normalizeCatalogPageSettings } from '@/lib/settings/catalog.normalize'
import { normalizeMarketSettings } from '@/lib/settings/market'
import { normalizeMediaWatermarkSettings } from '@/lib/settings/media-watermark.normalize'
import { normalizeStoreContactSettings } from '@/lib/settings/store-contact.normalize'
import {
  applyStoreContactCmsCopy,
  commitStoreCmsForLocale,
  getStoreContactCmsForEdit,
} from '@/lib/settings/store-contact-cms'
import type { AppLocale } from '@/lib/i18n/locales'
import {
  DEFAULT_PRESTA_IMPORT_SETTINGS,
  normalizePrestaImportSettings,
  type PrestaImportSettings,
} from '@/lib/settings/presta-import'
import type {
  CartCheckoutSettings,
  CatalogPageSettings,
  MarketSettings,
  MediaWatermarkSettings,
  RecentlyViewedSettings,
  StoreContactSettings,
} from '@/lib/settings/types'
import type { WithdrawalSettings } from '@/lib/settings/withdrawal'

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

export default function SettingsPage() {
  const tSettings = useTranslations('pages.settings')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const [loading, setLoading] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [savingCart, setSavingCart] = useState(false)
  const [savingCatalog, setSavingCatalog] = useState(false)
  const [savingRecentlyViewed, setSavingRecentlyViewed] = useState(false)
  const [savingPrestaImport, setSavingPrestaImport] = useState(false)
  const [savingMarket, setSavingMarket] = useState(false)
  const [savingWithdrawal, setSavingWithdrawal] = useState(false)
  const [store, setStore] = useState<StoreContactSettings | null>(null)
  const [cart, setCart] = useState<CartCheckoutSettings | null>(null)
  const [catalog, setCatalog] = useState<CatalogPageSettings | null>(null)
  const [mediaWatermark, setMediaWatermark] = useState<MediaWatermarkSettings | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedSettings | null>(null)
  const [prestaImport, setPrestaImport] = useState<PrestaImportSettings | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [withdrawal, setWithdrawal] = useState<WithdrawalSettings | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(true)
  const [baselineStore, setBaselineStore] = useState<string | null>(null)
  const [baselineCart, setBaselineCart] = useState<string | null>(null)
  const [baselineCatalog, setBaselineCatalog] = useState<string | null>(null)
  const [baselineMediaWatermark, setBaselineMediaWatermark] = useState<string | null>(null)
  const [baselineRecentlyViewed, setBaselineRecentlyViewed] = useState<string | null>(null)
  const [baselinePrestaImport, setBaselinePrestaImport] = useState<string | null>(null)
  const [baselineMarket, setBaselineMarket] = useState<string | null>(null)
  const [baselineWithdrawal, setBaselineWithdrawal] = useState<string | null>(null)
  const [activeStoreLocale, setActiveStoreLocale] = useState<AppLocale | null>(null)

  const storeDirty = useMemo(
    () => Boolean(store && baselineStore && stableJson(store) !== baselineStore),
    [store, baselineStore],
  )
  const cartDirty = useMemo(
    () => Boolean(cart && baselineCart && stableJson(cart) !== baselineCart),
    [cart, baselineCart],
  )
  const catalogDirty = useMemo(
    () => Boolean(catalog && baselineCatalog && stableJson(catalog) !== baselineCatalog),
    [catalog, baselineCatalog],
  )
  const mediaWatermarkDirty = useMemo(
    () =>
      Boolean(
        mediaWatermark &&
          baselineMediaWatermark &&
          stableJson(mediaWatermark) !== baselineMediaWatermark,
      ),
    [mediaWatermark, baselineMediaWatermark],
  )
  const recentlyViewedDirty = useMemo(
    () =>
      Boolean(
        recentlyViewed &&
          baselineRecentlyViewed &&
          stableJson(recentlyViewed) !== baselineRecentlyViewed,
      ),
    [recentlyViewed, baselineRecentlyViewed],
  )
  const prestaImportDirty = useMemo(
    () =>
      Boolean(
        prestaImport && baselinePrestaImport && stableJson(prestaImport) !== baselinePrestaImport,
      ),
    [prestaImport, baselinePrestaImport],
  )
  const marketDirty = useMemo(
    () => Boolean(market && baselineMarket && stableJson(market) !== baselineMarket),
    [market, baselineMarket],
  )
  const withdrawalDirty = useMemo(
    () => Boolean(withdrawal && baselineWithdrawal && stableJson(withdrawal) !== baselineWithdrawal),
    [withdrawal, baselineWithdrawal],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setCurrenciesLoading(true)
    try {
      const [data, currenciesData] = await Promise.all([
        fetchBackstageSettings(),
        fetchCurrencies().catch(() => [] as CurrencyInfo[]),
      ])
      const nextMarket = normalizeMarketSettings(data.market ?? DEFAULT_MARKET_SETTINGS)
      const nextStore = normalizeStoreContactSettings(data.store, nextMarket.region)
      const nextCart = normalizeCartCheckoutSettings(data.cart ?? DEFAULT_CART_CHECKOUT_SETTINGS)
      const nextCatalog = normalizeCatalogPageSettings(data.catalog ?? DEFAULT_CATALOG_SETTINGS)
      const nextMediaWatermark = normalizeMediaWatermarkSettings(
        data.mediaWatermark ?? DEFAULT_MEDIA_WATERMARK_SETTINGS,
      )
      const nextRecently = data.recentlyViewed ?? DEFAULT_RECENTLY_VIEWED_SETTINGS
      const nextPresta = normalizePrestaImportSettings(
        data.prestaImport ?? DEFAULT_PRESTA_IMPORT_SETTINGS,
      )
      const nextWithdrawal = data.withdrawalFull ?? null
      setStore(nextStore)
      setCart(nextCart)
      setCatalog(nextCatalog)
      setMediaWatermark(nextMediaWatermark)
      setRecentlyViewed(nextRecently)
      setPrestaImport(nextPresta)
      setMarket(nextMarket)
      setWithdrawal(nextWithdrawal)
      setCurrencies(currenciesData)
      setBaselineStore(stableJson(nextStore))
      setBaselineCart(stableJson(nextCart))
      setBaselineCatalog(stableJson(nextCatalog))
      setBaselineMediaWatermark(stableJson(nextMediaWatermark))
      setBaselineRecentlyViewed(stableJson(nextRecently))
      setBaselinePrestaImport(stableJson(nextPresta))
      setBaselineMarket(stableJson(nextMarket))
      setBaselineWithdrawal(nextWithdrawal ? stableJson(nextWithdrawal) : null)
      setActiveStoreLocale(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити налаштування.')
      setStore(null)
      setCart(null)
      setCatalog(null)
      setMediaWatermark(null)
      setRecentlyViewed(null)
      setPrestaImport(null)
      setMarket(null)
      setWithdrawal(null)
    } finally {
      setLoading(false)
      setCurrenciesLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!store || !contentLocaleReady) return
    if (activeStoreLocale === contentLocale) return
    const copy = getStoreContactCmsForEdit(store, contentLocale, market?.region ?? 'ua')
    const next = applyStoreContactCmsCopy(store, copy)
    setStore(next)
    setBaselineStore(stableJson(next))
    setActiveStoreLocale(contentLocale)
  }, [contentLocale, contentLocaleReady, store, activeStoreLocale, market?.region])

  const saveStore = async () => {
    if (!store) return
    setSavingStore(true)
    try {
      const payload = commitStoreCmsForLocale(store, contentLocale)
      const updated = normalizeStoreContactSettings(
        await updateBackstageStoreSettings(payload),
        market?.region ?? 'ua',
      )
      const forEdit = applyStoreContactCmsCopy(
        updated,
        getStoreContactCmsForEdit(updated, contentLocale, market?.region ?? 'ua'),
      )
      setStore(forEdit)
      setBaselineStore(stableJson(forEdit))
      setActiveStoreLocale(contentLocale)
      toast.success('Контакти магазину збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
      throw err
    } finally {
      setSavingStore(false)
    }
  }

  useContentLocaleSwitchSave(() => saveStore(), { when: () => storeDirty })

  const saveCart = async () => {
    if (!cart) return
    setSavingCart(true)
    try {
      // Cart-owned fields only — never re-send Packeta/GLS carrierConfigs, rates, or surcharges
      // (stale Cart tab must not overwrite a newer Packeta/GLS save).
      const updated = await updateBackstageCartCheckoutSettings(
        buildCartOwnedCheckoutPatch(cart),
      )
      setCart(updated)
      setBaselineCart(stableJson(updated))
      toast.success('Налаштування кошика збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingCart(false)
    }
  }

  const saveCatalog = async () => {
    if (!catalog || !mediaWatermark || (!catalogDirty && !mediaWatermarkDirty)) return
    setSavingCatalog(true)
    let saveFailed = false

    if (catalogDirty) {
      try {
        const updated = await updateBackstageCatalogSettings(catalog)
        const next = normalizeCatalogPageSettings(updated)
        setCatalog(next)
        setBaselineCatalog(stableJson(next))
      } catch {
        saveFailed = true
      }
    }

    if (mediaWatermarkDirty) {
      try {
        const updated = await updateBackstageMediaWatermarkSettings(mediaWatermark)
        const next = normalizeMediaWatermarkSettings(updated)
        setMediaWatermark(next)
        setBaselineMediaWatermark(stableJson(next))
      } catch {
        saveFailed = true
      }
    }

    if (saveFailed) toast.error(tSettings('catalogSaveError'))
    else toast.success(tSettings('catalogSaveSuccess'))
    setSavingCatalog(false)
  }

  const saveRecentlyViewed = async () => {
    if (!recentlyViewed) return
    setSavingRecentlyViewed(true)
    try {
      const updated = await updateBackstageRecentlyViewedSettings(recentlyViewed)
      setRecentlyViewed(updated)
      setBaselineRecentlyViewed(stableJson(updated))
      clearRecentlyViewedSettingsCache()
      toast.success('Налаштування «Останні переглянуті» збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingRecentlyViewed(false)
    }
  }



  const savePrestaImport = async () => {
    if (!prestaImport) return
    setSavingPrestaImport(true)
    try {
      const updated = await updateBackstagePrestaImportSettings(prestaImport)
      const next = normalizePrestaImportSettings(updated)
      setPrestaImport(next)
      setBaselinePrestaImport(stableJson(next))
      toast.success('URL шаблони імпорту збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingPrestaImport(false)
    }
  }

  const saveWithdrawal = async () => {
    if (!withdrawal) return
    setSavingWithdrawal(true)
    try {
      const updated = await updateBackstageWithdrawalSettings(withdrawal)
      setWithdrawal(updated)
      setBaselineWithdrawal(stableJson(updated))
      toast.success(tSettings('withdrawal.saveSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tSettings('withdrawal.saveError'))
    } finally {
      setSavingWithdrawal(false)
    }
  }

  const saveMarket = async () => {
    if (!market) return
    setSavingMarket(true)
    try {
      const updated = await updateBackstageMarketSettings(market)
      const next = normalizeMarketSettings(updated)
      setMarket(next)
      setBaselineMarket(stableJson(next))
      // Backend also writes cart.taxIncluded from priceBasis — keep local cart UI in sync
      // without an extra GET.
      const taxIncluded = next.priceBasis === 'inc_vat'
      setCart((prev) => {
        if (!prev || prev.taxIncluded === taxIncluded) return prev
        return { ...prev, taxIncluded }
      })
      setBaselineCart((baseline) => {
        if (!baseline) return baseline
        try {
          const parsed = JSON.parse(baseline) as CartCheckoutSettings
          if (parsed.taxIncluded === taxIncluded) return baseline
          return stableJson({ ...parsed, taxIncluded })
        } catch {
          return baseline
        }
      })
      toast.success('Налаштування ринку збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingMarket(false)
    }
  }


  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  if (!store || !cart) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">Не вдалося завантажити налаштування.</p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Спробувати знову
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    )
  }

  const marketRegion = market?.region ?? 'ua'

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground md:text-3xl">Налаштування</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Контакти магазину та контент сторінок сайту
          </p>
        </div>

        <Tabs defaultValue="store">
          <TabsList className="flex h-auto flex-wrap gap-1">
            <TabsTrigger value="store">Магазин</TabsTrigger>
            <TabsTrigger value="catalog">Каталог</TabsTrigger>
            <TabsTrigger value="recently-viewed">Останні переглянуті</TabsTrigger>
            <TabsTrigger value="cart">Кошик</TabsTrigger>
            <TabsTrigger value="market">Ринок</TabsTrigger>
            {marketRegion === 'ua' ? (
              <TabsTrigger value="nova-poshta">Нова Пошта</TabsTrigger>
            ) : null}
            {marketRegion === 'sk' ? (
              <>
                <TabsTrigger value="packeta">Packeta</TabsTrigger>
                <TabsTrigger value="gls">GLS</TabsTrigger>
              </>
            ) : null}
            <TabsTrigger value="flexi">ABRA Flexi</TabsTrigger>
            <TabsTrigger value="presta-import">Імпорт Presta</TabsTrigger>
            <TabsTrigger value="withdrawal">{tSettings('withdrawal.tab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="mt-6 space-y-6">
            {store && contentLocaleReady ? (
              <StoreContactSettingsForm
                store={store}
                contentLocale={contentLocale}
                onChange={(next) => setStore(commitStoreCmsForLocale(next, contentLocale))}
                onSave={() => void saveStore()}
                saving={savingStore}
                isDirty={storeDirty}
                marketRegion={market?.region ?? 'ua'}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="catalog" className="mt-6 space-y-6">
            {catalog && mediaWatermark ? (
              <CatalogSettingsForm
                catalog={catalog}
                mediaWatermark={mediaWatermark}
                onChange={setCatalog}
                onWatermarkChange={setMediaWatermark}
                onSave={() => void saveCatalog()}
                saving={savingCatalog}
                isDirty={catalogDirty || mediaWatermarkDirty}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="recently-viewed" className="mt-6 space-y-6">
            {recentlyViewed ? (
              <RecentlyViewedSettingsForm
                settings={recentlyViewed}
                onChange={setRecentlyViewed}
                onSave={() => void saveRecentlyViewed()}
                saving={savingRecentlyViewed}
                isDirty={recentlyViewedDirty}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="cart" className="mt-6 space-y-6">
            {cart ? (
              <CartCheckoutSettingsForm
                cart={cart}
                marketRegion={market?.region ?? 'ua'}
                marketPriceBasis={market?.priceBasis ?? 'inc_vat'}
                onChange={setCart}
                onSave={() => void saveCart()}
                saving={savingCart}
                isDirty={cartDirty}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="market" className="mt-6 space-y-6">
            {market ? (
              <MarketSettingsForm
                market={market}
                currencies={currencies}
                currenciesLoading={currenciesLoading}
                onChange={setMarket}
                onSave={() => void saveMarket()}
                saving={savingMarket}
                isDirty={marketDirty}
              />
            ) : null}
          </TabsContent>

          {marketRegion === 'ua' ? (
            <TabsContent value="nova-poshta" className="mt-6 space-y-6">
              <NovaPoshtaSettingsForm />
            </TabsContent>
          ) : null}

          {marketRegion === 'sk' ? (
            <>
              <TabsContent value="packeta" className="mt-6 space-y-6">
                <PacketaSettingsForm />
              </TabsContent>
              <TabsContent value="gls" className="mt-6 space-y-6">
                <GlsSettingsForm />
              </TabsContent>
            </>
          ) : null}

          <TabsContent value="flexi" className="mt-6 space-y-6">
            <FlexiSettingsForm />
          </TabsContent>

          <TabsContent value="presta-import" className="mt-6 space-y-6">
            {prestaImport ? (
              <Card>
                <CardHeader>
                  <CardTitle>URL шаблони зображень PrestaShop</CardTitle>
                  <CardDescription>
                    Використовуються під час імпорту зображень товарів, обкладинок блогу та фото
                    відгуків. Плейсхолдери: {'{id_image}'}, {'{link_rewrite}'}, {'{id_comment}'},{' '}
                    {'{id_blog}'}, {'{id}'}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="presta-product-image-url">Фото товарів</Label>
                    <Input
                      id="presta-product-image-url"
                      value={prestaImport.productImageUrlTemplate}
                      onChange={(e) =>
                        setPrestaImport({
                          ...prestaImport,
                          productImageUrlTemplate: e.target.value,
                        })
                      }
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Приклад:{' '}
                      {DEFAULT_PRESTA_IMPORT_SETTINGS.productImageUrlTemplate}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presta-blog-image-url">Обкладинки блогу</Label>
                    <Input
                      id="presta-blog-image-url"
                      value={prestaImport.blogImageUrlTemplate}
                      onChange={(e) =>
                        setPrestaImport({
                          ...prestaImport,
                          blogImageUrlTemplate: e.target.value,
                        })
                      }
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Плейсхолдери: {'{id_blog}'}, {'{id_image}'} (або {'{id}'}). Приклад:{' '}
                      {DEFAULT_PRESTA_IMPORT_SETTINGS.blogImageUrlTemplate}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presta-review-image-url">Фото відгуків</Label>
                    <Input
                      id="presta-review-image-url"
                      value={prestaImport.reviewImageUrlTemplate}
                      onChange={(e) =>
                        setPrestaImport({
                          ...prestaImport,
                          reviewImageUrlTemplate: e.target.value,
                        })
                      }
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Плейсхолдери: {'{id_comment}'}, {'{id_image}'}. Приклад:{' '}
                      {DEFAULT_PRESTA_IMPORT_SETTINGS.reviewImageUrlTemplate}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => void savePrestaImport()}
                    disabled={savingPrestaImport || !prestaImportDirty}
                  >
                    {savingPrestaImport ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Зберегти шаблони
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="withdrawal" className="mt-6 space-y-6">
            {withdrawal ? (
              <WithdrawalSettingsForm
                settings={withdrawal}
                onChange={setWithdrawal}
                onSave={() => void saveWithdrawal()}
                saving={savingWithdrawal}
                isDirty={withdrawalDirty}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
