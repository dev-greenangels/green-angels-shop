'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, Search, ShoppingCart, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { Navigation } from '@/components/navigation'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { CatalogPaginationControls } from '@/components/catalog/catalog-pagination-controls'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import {
  formatAvailableFromDisplay,
  resolveDiscountUnitPrice,
} from '@/lib/backstage/variant-pricing'
import {
  resolveCatalogLandingContent,
  type CategoryTreeNode,
} from '@/lib/catalog/categories'
import { productHref } from '@/lib/catalog/paths'
import { getCartLineQuantity, getMaxAddableQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { formatNumberForLocale } from '@/lib/i18n/intl-locale'
import {
  siteContentShellClassName,
  siteStickyToolbarControlsClusterClassName,
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import { getVariantDisplayStock } from '@/lib/plant-variants'
import {
  getBulkPriceTiers,
  getMinVariantPrice,
  getSingleUnitSaleTier,
  getUnitPriceForQuantity,
} from '@/lib/product-pricing'
import type { CatalogPhotoItem, CatalogPhotosPage } from '@/lib/variant-photos/types'
import type { Plant, PriceTier, ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

type EnrichedPhoto = CatalogPhotoItem & {
  productId: string | null
  productSlug: string | null
  categorySlug: string | null
  productName: string | null
  variantId: string | null
  price: number | null
  stock: number | null
  availableFrom: string | null
  variantLabel: string | null
  quantityPrices: NonNullable<CatalogPhotoItem['quantityPrices']>
}

type EnrichedPhotosPage = {
  items: EnrichedPhoto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

type QuantityPriceRow = NonNullable<CatalogPhotoItem['quantityPrices']>[number]

function getPhotoTakenAt(photo: Pick<CatalogPhotoItem, 'appProperties'>): string | null {
  return photo.appProperties.date?.trim() || null
}

function formatPhotoDate(value: string | null | undefined, locale: string) {
  if (!value?.trim()) return '—'
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function isQuantityPriceActive(row: QuantityPriceRow, now = new Date()) {
  if (row.validFrom) {
    const from = new Date(row.validFrom)
    if (!Number.isNaN(from.getTime()) && now < from) return false
  }
  if (row.validTo) {
    const to = new Date(row.validTo)
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999)
      if (now > to) return false
    }
  }
  return true
}

function mapPhotoPriceTiers(basePrice: number, quantityPrices: QuantityPriceRow[]): PriceTier[] {
  return quantityPrices
    .filter((row) => isQuantityPriceActive(row))
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((row) => ({
      minQuantity: row.minQuantity,
      pricePerUnit: resolveDiscountUnitPrice(
        basePrice,
        row.discountType === 'PERCENT' ? 'percent' : 'fixed_price',
        row.value,
      ),
    }))
    .filter((tier) => tier.pricePerUnit > 0 && tier.pricePerUnit < basePrice)
}

function getPhotoDiscountPercent(variant: ProductVariant | null): number | null {
  if (!variant || variant.basePrice <= 0) return null
  const minPrice = getMinVariantPrice(variant)
  if (minPrice >= variant.basePrice - 0.001) return null
  const percent = Math.round((1 - minPrice / variant.basePrice) * 100)
  return percent > 0 ? percent : null
}

function PhotoDiscountChips({ variant }: { variant: ProductVariant }) {
  const cartT = useTranslations('cart')
  const bulkTiers = getBulkPriceTiers(variant)
  if (!bulkTiers.length) return null

  return (
    <div className="flex flex-wrap gap-1">
      {bulkTiers.map((tier) => (
        <span
          key={tier.minQuantity}
          className="inline-flex max-w-full items-baseline gap-x-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] leading-tight"
        >
          <span className="text-muted-foreground">
            {cartT('fromQty', { count: tier.minQuantity })}
          </span>
          <FormattedPrice
            amount={tier.pricePerUnit}
            className="font-medium tabular-nums text-red-500 dark:text-red-400"
          />
        </span>
      ))}
    </div>
  )
}

function FreshPhotosGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <article
          key={index}
          className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/70"
        >
          <Skeleton className="aspect-[4/5] w-full rounded-none" />
          <div className="flex flex-1 flex-col gap-2 p-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-auto h-8 w-full rounded-md" />
          </div>
        </article>
      ))}
    </div>
  )
}

function FreshPhotosChipsSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="flex min-w-0 items-center overflow-hidden">
        <div className="flex w-0 min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

function toEnrichedPhoto(photo: CatalogPhotoItem): EnrichedPhoto {
  return {
    ...photo,
    productId: photo.productId ?? null,
    productSlug: photo.productSlug ?? null,
    categorySlug: photo.categorySlug ?? null,
    productName: photo.productName ?? null,
    variantId: photo.variantId ?? null,
    price: photo.price ?? null,
    stock: photo.stock ?? null,
    availableFrom: photo.availableFrom ?? null,
    variantLabel: photo.variantLabel ?? null,
    quantityPrices: photo.quantityPrices ?? [],
  }
}

function photoToVariant(photo: EnrichedPhoto): ProductVariant | null {
  if (!photo.variantId) return null
  const basePrice = photo.price ?? 0
  const availableFrom = formatAvailableFromDisplay(photo.availableFrom)
  return {
    id: photo.variantId,
    ean: photo.ean,
    label: photo.variantLabel || photo.appProperties.plantSize || '',
    stock: photo.stock ?? 0,
    basePrice,
    priceTiers: mapPhotoPriceTiers(basePrice, photo.quantityPrices),
    availableFrom,
  }
}

function photoToPlant(photo: EnrichedPhoto): Plant | null {
  if (!photo.productId || !photo.productSlug) return null
  const variant = photoToVariant(photo)
  return {
    id: photo.productId,
    name: photo.productName || photo.appProperties.plantName || 'Товар',
    latinName: '',
    slug: photo.productSlug,
    category: photo.categorySlug || '',
    price: photo.price ?? 0,
    sku: '',
    images: [photo.url],
    description: '',
    shortDescription: '',
    isNew: false,
    stock: photo.stock ?? 0,
    sunRequirement: 'partial',
    soilType: 'any',
    hardinessZone: '—',
    wateringNeeds: 'moderate',
    height: '—',
    createdAt: photo.createdAt,
    variants: variant ? [variant] : [],
  }
}

function photoProductHref(photo: EnrichedPhoto): string | null {
  if (!photo.productSlug || !photo.categorySlug) return null
  return productHref(photo.categorySlug, photo.productSlug)
}

function PhotoTitleLine({ photo }: { photo: EnrichedPhoto }) {
  const name = photo.productName || photo.appProperties.plantName || '—'
  const size = photo.variantLabel || photo.appProperties.plantSize || '—'
  return (
    <p className="text-xs font-medium leading-snug text-foreground">
      {name}
      <span className="font-normal text-muted-foreground"> · {size}</span>
    </p>
  )
}

export function FreshPhotosPageContent() {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tNav = useTranslations('nav')
  const tc = useTranslations('common')
  const tProduct = useTranslations('product')
  const cartT = useTranslations('cart')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const cartItems = useCartItems()
  const { addItem } = useCartActions()

  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
  const searchFromUrl = searchParams.get('q')?.trim() || ''
  const categoryFromUrl = searchParams.get('category')?.trim() || ''
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [data, setData] = useState<EnrichedPhotosPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EnrichedPhoto | null>(null)
  const [qty, setQty] = useState(1)
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const filterCategories = useMemo(
    () => resolveCatalogLandingContent(categoryTree).subcategories,
    [categoryTree],
  )

  useEffect(() => {
    setSearchInput(searchFromUrl)
  }, [searchFromUrl])

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    void fetch(`/api/catalog/categories?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((json: CategoryTreeNode[]) => {
        if (!cancelled) setCategoryTree(Array.isArray(json) ? json : [])
      })
      .catch(() => {
        if (!cancelled) setCategoryTree([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', '24')
    if (searchFromUrl) params.set('search', searchFromUrl)
    if (categoryFromUrl) params.set('category', categoryFromUrl)

    void fetch(`/api/catalog/photos?${params.toString()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: CatalogPhotosPage | null) => {
        if (cancelled || !json) {
          if (!cancelled) setData(null)
          return
        }
        setData({
          ...json,
          items: (json.items ?? []).map(toEnrichedPhoto),
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, searchFromUrl, categoryFromUrl])

  const isInitialLoading = loading && !data
  const isRefreshing = loading && Boolean(data)

  const pushQuery = useCallback(
    (next: { q?: string; category?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      let shouldScrollToTop = false
      if (next.q !== undefined) {
        if (next.q.trim()) params.set('q', next.q.trim())
        else params.delete('q')
        params.delete('page')
        shouldScrollToTop = true
      }
      if (next.category !== undefined) {
        if (next.category.trim()) params.set('category', next.category.trim())
        else params.delete('category')
        params.delete('page')
        shouldScrollToTop = true
      }
      if (next.page !== undefined) {
        if (next.page > 1) params.set('page', String(next.page))
        else params.delete('page')
        shouldScrollToTop = true
      }
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
      if (shouldScrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [pathname, router, searchParams],
  )

  const openPhoto = useCallback((photo: EnrichedPhoto) => {
    setSelected(photo)
    setQty(1)
  }, [])

  const plant = useMemo(() => (selected ? photoToPlant(selected) : null), [selected])
  const variant = useMemo(() => (selected ? photoToVariant(selected) : null), [selected])
  const selectedShipmentDate = selected?.availableFrom
    ? formatAvailableFromDisplay(selected.availableFrom)
    : null
  const discountPercent = getPhotoDiscountPercent(variant)
  const inCart = useMemo(() => {
    if (!plant || !variant) return 0
    return getCartLineQuantity(cartItems, plant.id, variant.id)
  }, [cartItems, plant, variant])
  const maxAddable = useMemo(() => {
    if (!plant || !variant) return 0
    return getMaxAddableQuantity(variant, cartItems, plant.id)
  }, [cartItems, plant, variant])
  const singleUnitSale = variant ? getSingleUnitSaleTier(variant) : null
  const salePrice = singleUnitSale?.pricePerUnit ?? variant?.basePrice ?? 0

  const handleBuy = () => {
    if (!plant || !variant) {
      toast.error(t('freshPhotosBuyUnavailable'))
      return
    }
    const addQty = Math.min(qty, Math.max(0, maxAddable))
    if (addQty <= 0) {
      toast.error(cartT('inStockOnly', { count: variant.stock }))
      return
    }
    const result = addItem(plant, addQty, {
      variant,
      unitPrice: getUnitPriceForQuantity(variant, inCart + addQty),
    })
    if (result.added > 0) {
      toast.success(cartT('addedToCart', { count: result.added }))
      setQty(1)
    }
  }

  const hasActiveFilters = Boolean(searchFromUrl || categoryFromUrl)

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
        <div className={cn(siteContentShellClassName, 'min-w-0 py-10 md:py-14')}>
          <ClientPublicPageBreadcrumbs
            className="mb-4"
            items={[
              { label: tNav('catalog'), href: '/catalog' },
              { label: tNav('freshPhotos') },
            ]}
          />

          <div className="mb-8 max-w-3xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {t('freshPhotosTitle')}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('freshPhotosSubtitle')}</p>
            {data && !isInitialLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('freshPhotosCount', { count: formatNumberForLocale(data.total, locale) })}
              </p>
            ) : isInitialLoading ? (
              <Skeleton className="mt-2 h-4 w-28" />
            ) : null}
          </div>

          <div className={cn(siteStickyToolbarOuterClassName, 'overflow-x-hidden')}>
            <div
              className={cn(
                siteStickyToolbarInnerClassName,
                'w-full min-w-0 flex-col gap-2 py-2.5 lg:flex-row lg:items-center lg:gap-2 lg:py-2',
              )}
            >
              <form
                className="flex w-full shrink-0 items-center gap-2 lg:w-auto lg:max-w-[18rem]"
                onSubmit={(event) => {
                  event.preventDefault()
                  pushQuery({ q: searchInput })
                }}
              >
                <InputWithClear
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onClear={() => {
                    setSearchInput('')
                    pushQuery({ q: '' })
                  }}
                  placeholder={t('freshPhotosSearchPlaceholder')}
                  leadingIcon={<Search className="h-4 w-4" />}
                  className="pl-10"
                  clearPaddingClass="pr-10"
                  aria-label={t('freshPhotosSearchPlaceholder')}
                />
                <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                  {tc('search')}
                </Button>
              </form>

              {categoriesLoading ? (
                <FreshPhotosChipsSkeleton />
              ) : filterCategories.length > 0 ? (
                <div className="flex w-full min-w-0 items-center gap-1.5 lg:flex-1">
                  <div
                    className={cn(
                      'flex min-w-0 flex-1 items-center overflow-hidden',
                      '-mx-[var(--site-shell-padding-x)] pl-[var(--site-shell-padding-x)] lg:mx-0 lg:pl-0',
                    )}
                  >
                    <div
                      className={cn(
                        'flex w-0 min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5',
                        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                      )}
                    >
                      {filterCategories.map((category) => {
                        const active = categoryFromUrl === category.slug
                        return (
                          <Button
                            key={category.id}
                            type="button"
                            size="sm"
                            variant={active ? 'default' : 'outline'}
                            className="h-7 shrink-0 rounded-full px-2.5 text-xs"
                            onClick={() =>
                              pushQuery({
                                category: active ? '' : category.slug,
                              })
                            }
                          >
                            {category.name}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                  {hasActiveFilters ? (
                    <div className={cn(siteStickyToolbarControlsClusterClassName, 'pl-1.5')}>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 shrink-0 rounded-full border border-border/70 bg-background shadow-sm hover:bg-muted"
                        onClick={() => {
                          setSearchInput('')
                          pushQuery({ q: '', category: '' })
                        }}
                        aria-label={t('freshPhotosResetFilters')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {isInitialLoading ? (
            <FreshPhotosGridSkeleton />
          ) : !data?.items.length ? (
            <p className="py-16 text-center text-muted-foreground">{t('freshPhotosEmpty')}</p>
          ) : (
            <div className={cn(isRefreshing && 'pointer-events-none opacity-60 transition-opacity')}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data.items.map((photo) => {
                  const productLink = photoProductHref(photo)
                  const cardVariant = photoToVariant(photo)
                  const cardDiscount = getPhotoDiscountPercent(cardVariant)
                  return (
                    <article
                      key={photo.id}
                      className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm"
                    >
                      <button
                        type="button"
                        className="relative aspect-[4/5] w-full bg-muted"
                        onClick={() => openPhoto(photo)}
                      >
                        <Image
                          src={photo.url}
                          alt={photo.productName || photo.appProperties.plantName || photo.ean}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="(max-width: 1280px) 20vw, 16vw"
                        />
                        {cardDiscount ? (
                          <Badge
                            variant="destructive"
                            className="absolute left-2 top-2 px-1 py-0 text-[10px] shadow-sm"
                          >
                            −{cardDiscount}%
                          </Badge>
                        ) : null}
                      </button>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        {productLink ? (
                          <Link
                            href={productLink}
                            className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
                          >
                            {photo.productName || photo.appProperties.plantName || '—'}
                          </Link>
                        ) : (
                          <h2 className="line-clamp-2 text-sm font-medium leading-snug">
                            {photo.productName || photo.appProperties.plantName || '—'}
                          </h2>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {photo.variantLabel || photo.appProperties.plantSize || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('freshPhotosPhotoFrom')}{' '}
                          {formatPhotoDate(getPhotoTakenAt(photo), locale)}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-auto w-full"
                          onClick={() => openPhoto(photo)}
                        >
                          <ShoppingCart className="mr-1.5 h-4 w-4" />
                          {tProduct('addToCart')}
                        </Button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <CatalogPaginationControls
                className="mt-10"
                page={page}
                totalPages={data.totalPages}
                total={data.total}
                shownCount={data.items.length}
                disabled={isRefreshing}
                onPageChange={(nextPage) => pushQuery({ page: nextPage })}
              />
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[min(100vw-1rem,28rem)] overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-md"
        >
          {selected ? (
            <div className="relative">
              <button
                type="button"
                className="absolute right-0 top-0 z-[75] inline-flex h-7 w-7 -translate-y-[calc(100%+0.35rem)] items-center justify-center rounded-full bg-black/85 text-white shadow-md transition hover:bg-black sm:h-8 sm:w-8 md:translate-x-[calc(100%+0.5rem)] md:translate-y-0"
                onClick={() => setSelected(null)}
                aria-label={tc('close')}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <div className="overflow-hidden rounded-xl bg-background shadow-xl">
                <DialogTitle className="sr-only">
                  {selected.productName || selected.appProperties.plantName || selected.ean}
                </DialogTitle>

                <div className="relative bg-muted">
                  <div className="flex min-h-[320px] items-center justify-center px-3 py-4 sm:min-h-[480px]">
                    <Image
                      src={selected.url}
                      alt={selected.productName || selected.appProperties.plantName || selected.ean}
                      width={720}
                      height={960}
                      unoptimized
                      className="max-h-[72vh] w-auto max-w-full object-contain"
                      sizes="(max-width: 768px) 90vw, 28rem"
                    />
                  </div>
                  {discountPercent ? (
                    <Badge
                      variant="destructive"
                      className="absolute left-2 top-2 px-1.5 py-0 text-[10px] shadow-sm sm:left-3 sm:top-3"
                    >
                      −{discountPercent}%
                    </Badge>
                  ) : null}
                </div>

                <div className="shrink-0 space-y-2 border-t border-border/60 p-3 sm:p-3.5">
                  <PhotoTitleLine photo={selected} />

                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                    <p className="text-muted-foreground">
                      {t('freshPhotosPhotoFrom')}{' '}
                      <span className="text-foreground">
                        {formatPhotoDate(getPhotoTakenAt(selected), locale)}
                      </span>
                      <span className="mx-1.5 text-border">·</span>
                      <span className="tabular-nums text-foreground">
                        {variant ? getVariantDisplayStock(variant) : selected.stock ?? 0}{' '}
                        {tc('pieceShort')}
                      </span>
                    </p>
                    {selectedShipmentDate ? (
                      <ShipmentDateBadge
                        date={selectedShipmentDate}
                        className="max-w-[11rem] shrink-0 text-[10px] sm:max-w-none sm:text-xs"
                      />
                    ) : null}
                  </div>

                  {variant && variant.basePrice > 0 ? (
                    <div className="space-y-1.5">
                      <DiscountedUnitPrice
                        originalPrice={variant.basePrice}
                        salePrice={salePrice}
                        perUnit="sale-only"
                        stacked={false}
                        originalClassName="text-[11px] text-muted-foreground"
                        saleClassName="text-sm font-semibold tabular-nums"
                      />
                      <PhotoDiscountChips variant={variant} />
                    </div>
                  ) : null}

                  {inCart > 0 ? (
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary sm:text-xs">
                      <span>{cartT('inCartCount', { count: inCart })}</span>
                      <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                      {maxAddable > 0 ? (
                        <span className="font-normal text-muted-foreground">
                          {tProduct('moreCanAdd', { count: maxAddable })}
                        </span>
                      ) : null}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <div
                      className={cn(
                        'inline-flex h-8 items-center rounded-md border',
                        inCart > 0 && 'border-primary ring-2 ring-primary/20',
                      )}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-8 text-center text-sm tabular-nums">{qty}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQty((q) => q + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      onClick={handleBuy}
                      disabled={!variant || maxAddable <= 0}
                    >
                      <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                      {tProduct('addToCart')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
