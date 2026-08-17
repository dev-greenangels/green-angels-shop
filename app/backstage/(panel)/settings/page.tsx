'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { CartCheckoutSettingsForm } from '@/components/backstage/cart-checkout-settings-form'
import { CatalogSettingsForm } from '@/components/backstage/catalog-settings-form'
import { NovaPoshtaSettingsForm } from '@/components/backstage/nova-poshta-settings-form'
import { FlexiSettingsForm } from '@/components/backstage/flexi-settings-form'
import { RecentlyViewedSettingsForm } from '@/components/backstage/recently-viewed-settings-form'
import { HomeSectionOrderControls } from '@/components/backstage/home-section-order-controls'
import { MarketSettingsForm } from '@/components/backstage/market-settings-form'
import { clearRecentlyViewedSettingsCache } from '@/components/product/recently-viewed-section'
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
  updateBackstageHomeSettings,
  updateBackstageMarketSettings,
  updateBackstageRecentlyViewedSettings,
  updateBackstageStoreSettings,
  updateBackstagePrestaImportSettings,
} from '@/lib/backstage/settings'
import { fetchCurrencies } from '@/lib/backstage/reference-data'
import type { CurrencyInfo } from '@/lib/commerce/types'
import {
  DEFAULT_CART_CHECKOUT_SETTINGS,
  DEFAULT_CATALOG_SETTINGS,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_MARKET_SETTINGS,
  DEFAULT_RECENTLY_VIEWED_SETTINGS,
} from '@/lib/settings/defaults'
import { normalizeCartCheckoutSettings } from '@/lib/settings/cart-checkout.normalize'
import { normalizeCatalogPageSettings } from '@/lib/settings/catalog.normalize'
import { normalizeHomeSettings } from '@/lib/settings/home.normalize'
import { normalizeMarketSettings } from '@/lib/settings/market'
import { normalizeStoreContactSettings } from '@/lib/settings/store-contact.normalize'
import {
  DEFAULT_PRESTA_IMPORT_SETTINGS,
  normalizePrestaImportSettings,
  type PrestaImportSettings,
} from '@/lib/settings/presta-import'
import type {
  CartCheckoutSettings,
  CatalogPageSettings,
  HomeGalleryImage,
  HomeHighlight,
  HomePageSettings,
  HomeStat,
  MarketSettings,
  RecentlyViewedSettings,
  StoreContactSettings,
} from '@/lib/settings/types'

function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function listToLines(items: string[]): string {
  return items.join('\n')
}

function stableJson(value: unknown): string {
  return JSON.stringify(value)
}

export default function SettingsPage() {
  const tBanner = useTranslations('contentBanner')
  const [loading, setLoading] = useState(true)
  const [savingStore, setSavingStore] = useState(false)
  const [savingHome, setSavingHome] = useState(false)
  const [savingCart, setSavingCart] = useState(false)
  const [savingCatalog, setSavingCatalog] = useState(false)
  const [savingRecentlyViewed, setSavingRecentlyViewed] = useState(false)
  const [savingPrestaImport, setSavingPrestaImport] = useState(false)
  const [savingMarket, setSavingMarket] = useState(false)
  const [store, setStore] = useState<StoreContactSettings | null>(null)
  const [home, setHome] = useState<HomePageSettings | null>(null)
  const [cart, setCart] = useState<CartCheckoutSettings | null>(null)
  const [catalog, setCatalog] = useState<CatalogPageSettings | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedSettings | null>(null)
  const [prestaImport, setPrestaImport] = useState<PrestaImportSettings | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([])
  const [currenciesLoading, setCurrenciesLoading] = useState(true)
  const [baselineStore, setBaselineStore] = useState<string | null>(null)
  const [baselineHome, setBaselineHome] = useState<string | null>(null)
  const [baselineCart, setBaselineCart] = useState<string | null>(null)
  const [baselineCatalog, setBaselineCatalog] = useState<string | null>(null)
  const [baselineRecentlyViewed, setBaselineRecentlyViewed] = useState<string | null>(null)
  const [baselinePrestaImport, setBaselinePrestaImport] = useState<string | null>(null)
  const [baselineMarket, setBaselineMarket] = useState<string | null>(null)

  const storeDirty = useMemo(
    () => Boolean(store && baselineStore && stableJson(store) !== baselineStore),
    [store, baselineStore],
  )
  const homeDirty = useMemo(
    () => Boolean(home && baselineHome && stableJson(home) !== baselineHome),
    [home, baselineHome],
  )
  const cartDirty = useMemo(
    () => Boolean(cart && baselineCart && stableJson(cart) !== baselineCart),
    [cart, baselineCart],
  )
  const catalogDirty = useMemo(
    () => Boolean(catalog && baselineCatalog && stableJson(catalog) !== baselineCatalog),
    [catalog, baselineCatalog],
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

  const load = useCallback(async () => {
    setLoading(true)
    setCurrenciesLoading(true)
    try {
      const [data, currenciesData] = await Promise.all([
        fetchBackstageSettings(),
        fetchCurrencies().catch(() => [] as CurrencyInfo[]),
      ])
      const nextStore = normalizeStoreContactSettings(data.store)
      const nextHome = normalizeHomeSettings(data.home)
      const nextCart = normalizeCartCheckoutSettings(data.cart ?? DEFAULT_CART_CHECKOUT_SETTINGS)
      const nextCatalog = normalizeCatalogPageSettings(data.catalog ?? DEFAULT_CATALOG_SETTINGS)
      const nextRecently = data.recentlyViewed ?? DEFAULT_RECENTLY_VIEWED_SETTINGS
      const nextPresta = normalizePrestaImportSettings(
        data.prestaImport ?? DEFAULT_PRESTA_IMPORT_SETTINGS,
      )
      const nextMarket = normalizeMarketSettings(data.market ?? DEFAULT_MARKET_SETTINGS)
      setStore(nextStore)
      setHome(nextHome)
      setCart(nextCart)
      setCatalog(nextCatalog)
      setRecentlyViewed(nextRecently)
      setPrestaImport(nextPresta)
      setMarket(nextMarket)
      setCurrencies(currenciesData)
      setBaselineStore(stableJson(nextStore))
      setBaselineHome(stableJson(nextHome))
      setBaselineCart(stableJson(nextCart))
      setBaselineCatalog(stableJson(nextCatalog))
      setBaselineRecentlyViewed(stableJson(nextRecently))
      setBaselinePrestaImport(stableJson(nextPresta))
      setBaselineMarket(stableJson(nextMarket))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити налаштування.')
      setStore(null)
      setHome(null)
      setCart(null)
      setCatalog(null)
      setRecentlyViewed(null)
      setPrestaImport(null)
      setMarket(null)
    } finally {
      setLoading(false)
      setCurrenciesLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveStore = async () => {
    if (!store) return
    setSavingStore(true)
    try {
      const updated = await updateBackstageStoreSettings(store)
      setStore(updated)
      setBaselineStore(stableJson(updated))
      toast.success('Контакти магазину збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingStore(false)
    }
  }

  const saveCart = async () => {
    if (!cart) return
    setSavingCart(true)
    try {
      const updated = await updateBackstageCartCheckoutSettings(cart)
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
    if (!catalog) return
    setSavingCatalog(true)
    try {
      const updated = await updateBackstageCatalogSettings(catalog)
      const next = normalizeCatalogPageSettings(updated)
      setCatalog(next)
      setBaselineCatalog(stableJson(next))
      toast.success('Налаштування каталогу збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingCatalog(false)
    }
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

  const saveHome = async () => {
    if (!home) return
    setSavingHome(true)
    try {
      const updated = await updateBackstageHomeSettings(home)
      setHome(updated)
      setBaselineHome(stableJson(updated))
      toast.success('Налаштування головної збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSavingHome(false)
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

  const updateHeroHighlight = (index: number, patch: Partial<HomeHighlight>) => {
    if (!home) return
    const highlights = home.hero.highlights.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    setHome({ ...home, hero: { ...home.hero, highlights } })
  }

  const updateStat = (index: number, patch: Partial<HomeStat>) => {
    if (!home) return
    const stats = home.whyUs.stats.map((item, i) => (i === index ? { ...item, ...patch } : item))
    setHome({ ...home, whyUs: { ...home.whyUs, stats } })
  }

  const updateGalleryImage = (index: number, patch: Partial<HomeGalleryImage>) => {
    if (!home) return
    const images = home.nurseryGallery.images.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    )
    setHome({ ...home, nurseryGallery: { ...home.nurseryGallery, images } })
  }

  const addGalleryImage = () => {
    if (!home) return
    setHome({
      ...home,
      nurseryGallery: {
        ...home.nurseryGallery,
        images: [...home.nurseryGallery.images, { url: '', caption: '' }],
      },
    })
  }

  const removeGalleryImage = (index: number) => {
    if (!home) return
    setHome({
      ...home,
      nurseryGallery: {
        ...home.nurseryGallery,
        images: home.nurseryGallery.images.filter((_, i) => i !== index),
      },
    })
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

  if (!store || !home || !cart) {
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
          <TabsList>
            <TabsTrigger value="store">Магазин</TabsTrigger>
            <TabsTrigger value="home">Головна сторінка</TabsTrigger>
            <TabsTrigger value="catalog">Каталог</TabsTrigger>
            <TabsTrigger value="recently-viewed">Останні переглянуті</TabsTrigger>
            <TabsTrigger value="cart">Кошик</TabsTrigger>
            <TabsTrigger value="market">Ринок</TabsTrigger>
            <TabsTrigger value="nova-poshta">Нова Пошта</TabsTrigger>
            <TabsTrigger value="flexi">ABRA Flexi</TabsTrigger>
            <TabsTrigger value="presta-import">Імпорт Presta</TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="mt-6 space-y-6">
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {tBanner('cmsNotTranslated')}
            </p>
            {store ? (
              <StoreContactSettingsForm
                store={store}
                onChange={setStore}
                onSave={() => void saveStore()}
                saving={savingStore}
                isDirty={storeDirty}
                marketRegion={market?.region ?? 'ua'}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="catalog" className="mt-6 space-y-6">
            {catalog ? (
              <CatalogSettingsForm
                catalog={catalog}
                onChange={setCatalog}
                onSave={() => void saveCatalog()}
                saving={savingCatalog}
                isDirty={catalogDirty}
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

          <TabsContent value="nova-poshta" className="mt-6 space-y-6">
            <NovaPoshtaSettingsForm />
          </TabsContent>

          <TabsContent value="flexi" className="mt-6 space-y-6">
            <FlexiSettingsForm />
          </TabsContent>

          <TabsContent value="home" className="mt-6 space-y-6">
            <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {tBanner('cmsNotTranslated')}
            </p>
            <HomeSectionOrderControls
              order={home.sectionOrder}
              hidden={home.sectionHidden}
              onChange={({ sectionOrder, sectionHidden }) =>
                setHome({
                  ...home,
                  sectionOrder,
                  sectionHidden,
                  reviews: { ...home.reviews, enabled: !sectionHidden.includes('reviews') },
                  freshPlantPhotos: {
                    ...home.freshPlantPhotos,
                    enabled: !sectionHidden.includes('freshPlantPhotos'),
                  },
                })
              }
            />

            <Card>
              <CardHeader>
                <CardTitle>Хіро-блок</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Бейдж</Label>
                  <Input
                    value={home.hero.badge}
                    onChange={(e) =>
                      setHome({ ...home, hero: { ...home.hero, badge: e.target.value } })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={home.hero.title}
                      onChange={(e) =>
                        setHome({ ...home, hero: { ...home.hero, title: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Акцент у заголовку</Label>
                    <Input
                      value={home.hero.titleAccent}
                      onChange={(e) =>
                        setHome({ ...home, hero: { ...home.hero, titleAccent: e.target.value } })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={3}
                    value={home.hero.subtitle}
                    onChange={(e) =>
                      setHome({ ...home, hero: { ...home.hero, subtitle: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL зображення</Label>
                  <Input
                    value={home.hero.imageUrl}
                    onChange={(e) =>
                      setHome({ ...home, hero: { ...home.hero, imageUrl: e.target.value } })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Кнопка 1 — текст</Label>
                    <Input
                      value={home.hero.primaryCtaLabel}
                      onChange={(e) =>
                        setHome({ ...home, hero: { ...home.hero, primaryCtaLabel: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кнопка 1 — посилання</Label>
                    <Input
                      value={home.hero.primaryCtaHref}
                      onChange={(e) =>
                        setHome({ ...home, hero: { ...home.hero, primaryCtaHref: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кнопка 2 — текст</Label>
                    <Input
                      value={home.hero.secondaryCtaLabel}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          hero: { ...home.hero, secondaryCtaLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кнопка 2 — посилання</Label>
                    <Input
                      value={home.hero.secondaryCtaHref}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          hero: { ...home.hero, secondaryCtaHref: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Переваги (3 блоки)</Label>
                  {home.hero.highlights.map((item, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                      <Input
                        placeholder="Заголовок"
                        value={item.title}
                        onChange={(e) => updateHeroHighlight(index, { title: e.target.value })}
                      />
                      <Input
                        placeholder="Опис"
                        value={item.description}
                        onChange={(e) => updateHeroHighlight(index, { description: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Категорії на головній</CardTitle>
                <CardDescription>
                  Заголовок і підзаголовок блоку категорій. Категорії показуються в горизонтальному скролі.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Заголовок блоку</Label>
                    <Input
                      value={home.categories.title}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          categories: { ...home.categories, title: e.target.value },
                        })
                      }
                      placeholder="Напр. Каталог"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Максимум категорій (якщо slugs порожні)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={24}
                      value={home.categories.limit}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          categories: {
                            ...home.categories,
                            limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.categories.limit,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок блоку</Label>
                  <Textarea
                    rows={2}
                    value={home.categories.subtitle}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        categories: { ...home.categories, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slugs категорій (по одному в рядку, порядок відображення)</Label>
                  <Textarea
                    rows={4}
                    value={listToLines(home.categories.categorySlugs ?? [])}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        categories: {
                          ...home.categories,
                          categorySlugs: linesToList(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Новинки</CardTitle>
                <CardDescription>
                  Автоматично: товари, що знову зʼявились у наявності після повного відсутності на складі.
                  Slugs додаються вручну на початок списку.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={home.newArrivals.title}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          newArrivals: { ...home.newArrivals, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кількість карток</Label>
                    <Input
                      type="number"
                      min={3}
                      max={12}
                      value={home.newArrivals.limit}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          newArrivals: {
                            ...home.newArrivals,
                            limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.newArrivals.limit,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={2}
                    value={home.newArrivals.subtitle}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        newArrivals: { ...home.newArrivals, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slugs товарів (по одному в рядку, пріоритет)</Label>
                  <Textarea
                    rows={3}
                    value={listToLines(home.newArrivals.productSlugs)}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        newArrivals: {
                          ...home.newArrivals,
                          productSlugs: linesToList(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Популярний вибір</CardTitle>
                <CardDescription>
                  Автоматично: найбільше продано за останні 90 днів (лише в наявності). Slugs — ручний
                  пріоритет.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={home.bestsellers.title}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          bestsellers: { ...home.bestsellers, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кількість карток</Label>
                    <Input
                      type="number"
                      min={3}
                      max={12}
                      value={home.bestsellers.limit}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          bestsellers: {
                            ...home.bestsellers,
                            limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.bestsellers.limit,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={2}
                    value={home.bestsellers.subtitle}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        bestsellers: { ...home.bestsellers, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slugs товарів (по одному в рядку, пріоритет)</Label>
                  <Textarea
                    rows={3}
                    value={listToLines(home.bestsellers.productSlugs)}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        bestsellers: {
                          ...home.bestsellers,
                          productSlugs: linesToList(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Закінчується</CardTitle>
                <CardDescription>
                  Автоматично: в наявності, але залишок не більше порогу (сортування від меншого залишку).
                  Slugs — ручні позиції на початку.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={home.lowStock.title}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          lowStock: { ...home.lowStock, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кількість карток</Label>
                    <Input
                      type="number"
                      min={3}
                      max={12}
                      value={home.lowStock.limit}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          lowStock: {
                            ...home.lowStock,
                            limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.lowStock.limit,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={2}
                    value={home.lowStock.subtitle}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        lowStock: { ...home.lowStock, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Поріг залишку (шт., для авто-відбору)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={500}
                      value={home.lowStock.stockThreshold}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          lowStock: {
                            ...home.lowStock,
                            stockThreshold:
                              Number(e.target.value) || DEFAULT_HOME_SETTINGS.lowStock.stockThreshold,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Slugs товарів (по одному в рядку, пріоритет)</Label>
                  <Textarea
                    rows={3}
                    value={listToLines(home.lowStock.productSlugs)}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        lowStock: {
                          ...home.lowStock,
                          productSlugs: linesToList(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Чому обирають нас</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Заголовок</Label>
                  <Input
                    value={home.whyUs.title}
                    onChange={(e) =>
                      setHome({ ...home, whyUs: { ...home.whyUs, title: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={3}
                    value={home.whyUs.subtitle}
                    onChange={(e) =>
                      setHome({ ...home, whyUs: { ...home.whyUs, subtitle: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Переваги (по одній в рядку)</Label>
                  <Textarea
                    rows={6}
                    value={listToLines(home.whyUs.features)}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        whyUs: { ...home.whyUs, features: linesToList(e.target.value) },
                      })
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Label>Статистика</Label>
                  {home.whyUs.stats.map((stat, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                      <Input
                        placeholder="Значення"
                        value={stat.value}
                        onChange={(e) => updateStat(index, { value: e.target.value })}
                      />
                      <Input
                        placeholder="Підпис"
                        value={stat.label}
                        onChange={(e) => updateStat(index, { label: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Галерея розсадника</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addGalleryImage}>
                  <Plus className="mr-1 h-4 w-4" />
                  Фото
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Заголовок</Label>
                  <Input
                    value={home.nurseryGallery.title}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        nurseryGallery: { ...home.nurseryGallery, title: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={2}
                    value={home.nurseryGallery.subtitle}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        nurseryGallery: { ...home.nurseryGallery, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
                {home.nurseryGallery.images.map((image, index) => (
                  <div key={index} className="flex gap-2 rounded-lg border p-3">
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="URL зображення"
                        value={image.url}
                        onChange={(e) => updateGalleryImage(index, { url: e.target.value })}
                      />
                      <Input
                        placeholder="Підпис"
                        value={image.caption}
                        onChange={(e) => updateGalleryImage(index, { caption: e.target.value })}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeGalleryImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Актуальні фото рослин</CardTitle>
                <CardDescription>
                  Горизонтальна стрічка свіжих фото з розсадника. Дані підтягуються автоматично з
                  каталогу фото.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={home.freshPlantPhotos.title}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          freshPlantPhotos: { ...home.freshPlantPhotos, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кількість фото</Label>
                    <Input
                      type="number"
                      min={3}
                      max={24}
                      value={home.freshPlantPhotos.limit}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          freshPlantPhotos: {
                            ...home.freshPlantPhotos,
                            limit:
                              Number(e.target.value) ||
                              DEFAULT_HOME_SETTINGS.freshPlantPhotos.limit,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={2}
                    value={home.freshPlantPhotos.subtitle}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        freshPlantPhotos: { ...home.freshPlantPhotos, subtitle: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Відгуки</CardTitle>
                <CardDescription>
                  Реальні відгуки клієнтів після модерації. Керування текстами — у розділі «Відгуки».
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Заголовок</Label>
                    <Input
                      value={home.reviews.title}
                      onChange={(e) =>
                        setHome({ ...home, reviews: { ...home.reviews, title: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Кількість відгуків</Label>
                    <Input
                      type="number"
                      min={3}
                      max={20}
                      value={home.reviews.limit}
                      onChange={(e) =>
                        setHome({
                          ...home,
                          reviews: {
                            ...home.reviews,
                            limit: Number(e.target.value) || DEFAULT_HOME_SETTINGS.reviews.limit,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Підзаголовок</Label>
                  <Textarea
                    rows={2}
                    value={home.reviews.subtitle}
                    onChange={(e) =>
                      setHome({ ...home, reviews: { ...home.reviews, subtitle: e.target.value } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviews-sort">Сортування</Label>
                  <select
                    id="reviews-sort"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={home.reviews.sort}
                    onChange={(e) =>
                      setHome({
                        ...home,
                        reviews: {
                          ...home.reviews,
                          sort: e.target.value as HomePageSettings['reviews']['sort'],
                        },
                      })
                    }
                  >
                    <option value="newest">Спочатку нові</option>
                    <option value="oldest">Спочатку старі</option>
                    <option value="rating_desc">Спочатку з найвищою оцінкою</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Button
              type="button"
              onClick={() => void saveHome()}
              disabled={savingHome || !homeDirty}
            >
              {savingHome ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Зберегти головну
            </Button>
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
        </Tabs>
      </div>
    </AdminLayout>
  )
}
