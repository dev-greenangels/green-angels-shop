'use client'

import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus, ShoppingCart, ZoomIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { showAddedToCartToast } from '@/lib/cart-toast'

import { FavoriteButton } from '@/components/favorites/favorite-button'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { PriceWithExVatUnder } from '@/components/commerce/shelf-price-block'
import { DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { ProductCoverImage } from '@/components/product/product-cover-image'
import { VariantPhotoGalleryDialog } from '@/components/product/variant-photo-gallery-dialog'
import { NotifyAvailabilityButton } from '@/components/product/notify-availability-button'
import { NotifyWhenAvailableModal } from '@/components/product/notify-when-available-modal'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import { getCartLineQuantity, getMaxAddableQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { productHrefFromPlant } from '@/lib/catalog/paths'
import {
  canOrderVariant,
  getVariantDisplayStock,
  getVariantMaxQuantity,
  getVisiblePlantVariants,
  isPlantFullyUnavailable,
  isVariantPreorder,
  variantHasAvailableFrom,
} from '@/lib/plant-variants'
import {
  getBulkPriceTiers,
  getPlantMaxDiscountPercent,
  getSingleUnitSaleTier,
  getUnitPriceForQuantity,
} from '@/lib/product-pricing'
import { cn } from '@/lib/utils'
import { useVariantPhotos } from '@/lib/variant-photos/use-variant-photos'
import type { Plant, ProductVariant } from '@/lib/types'
export type CatalogDiscountQuantityFilter = {
  minQuantity: number
  mode: 'gte' | 'exact'
}

function variantMatchesDiscountFilter(
  variant: ProductVariant,
  discountFilter?: CatalogDiscountQuantityFilter,
): boolean {
  if (!discountFilter) return true
  return variant.priceTiers.some((tier) => {
    if (tier.pricePerUnit >= variant.basePrice) return false
    if (discountFilter.mode === 'exact') return tier.minQuantity === discountFilter.minQuantity
    return tier.minQuantity >= discountFilter.minQuantity
  })
}


const catalogListRowClassName = cn(
  'rounded-xl border border-primary/10 p-2.5 shadow-sm',
  'bg-gradient-to-r from-card via-card to-primary/[0.04]',
  'transition-[box-shadow,border-color] hover:border-primary/20 hover:shadow-md',
  'max-sm:grid max-sm:grid-cols-[4.75rem_minmax(0,1fr)] max-sm:gap-x-2.5 max-sm:gap-y-1.5',
  'sm:flex sm:min-w-0 sm:items-center sm:gap-3 sm:p-3',
)

function hasVariantSalePrice(variant: ProductVariant, salePrice: number) {
  return salePrice < variant.basePrice - 0.001
}

function splitVariantLabel(label: string): { packaging?: string; sizeLabel: string } {
  const parts = label.split(' · ').map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return {
      packaging: parts[0],
      sizeLabel: parts.slice(1).join(' · '),
    }
  }
  return { sizeLabel: label }
}

function CatalogVariantDiscountChips({
  variant,
  className,
  chipClassName,
  priceClassName,
  onTierClick,
}: {
  variant: ProductVariant
  className?: string
  chipClassName?: string
  priceClassName?: string
  onTierClick?: (minQuantity: number) => void
}) {
  const cart = useTranslations('cart')
  const tiers = useMemo(() => getBulkPriceTiers(variant), [variant])
  if (!tiers.length) return null

  return (
    <div className={cn('flex w-full flex-wrap justify-end gap-1', className)}>
      {tiers.map((tier) => (
        <button
          key={tier.minQuantity}
          type="button"
          onClick={() => onTierClick?.(tier.minQuantity)}
          className={cn(
            'inline-flex w-auto max-w-full shrink-0 items-baseline justify-center gap-x-1 rounded-full border border-border/70',
            'bg-background/95 px-2 py-0.5 text-[11px] leading-tight',
            chipClassName,
            'shadow-sm transition-[transform,box-shadow,background-color]',
            'hover:bg-background hover:shadow-md',
            'active:scale-[0.97] active:bg-muted/70 active:shadow-inner',
            onTierClick && 'cursor-pointer',
          )}
        >
          <span className="shrink-0 text-muted-foreground">
            {cart('fromQty', { count: tier.minQuantity })}
          </span>
          <FormattedPrice
            amount={tier.pricePerUnit}
            perUnit
            unitSymbol={variant.salesUnitSymbol}
            className={cn(
              'shrink-0 font-sans text-[11px] font-medium tabular-nums text-red-500 dark:text-red-400',
              priceClassName,
            )}
          />
        </button>
      ))}
    </div>
  )
}

function CatalogListProductImage({
  plant,
  variant,
  discountPercent,
  showBadges,
}: {
  plant: Plant
  variant?: ProductVariant
  discountPercent: number
  showBadges: boolean
}) {
  const t = useTranslations('product')
  const [galleryOpen, setGalleryOpen] = useState(false)

  const showVariantPhotos = variant?.freshPhotos !== false
  const { photos: variantPhotos } = useVariantPhotos(
    showVariantPhotos ? variant?.ean : null,
    showVariantPhotos ? variant?.sku : null,
  )
  const plantPhotos = useMemo(
    () =>
      plant.images
        .filter(Boolean)
          .map((url, index) => ({
          id: `${plant.id}-${index}`,
          url,
          thumbUrl: url,
          alt: `${plant.name} — фото ${index + 1}`,
        })),
    [plant.id, plant.images, plant.name],
  )
  const galleryPhotos = variantPhotos.length > 0 ? variantPhotos : plantPhotos
  const coverSrc = galleryPhotos[0]?.thumbUrl ?? galleryPhotos[0]?.url ?? plant.images[0]

  return (
    <>
      <button
        type="button"
        onClick={() => galleryPhotos.length > 0 && setGalleryOpen(true)}
        disabled={galleryPhotos.length === 0}
        aria-label={t('viewPhoto', { alt: plant.name })}
        className={cn(
          'group relative block h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-lg bg-muted sm:h-[5.5rem] sm:w-[5.5rem]',
          'border border-transparent transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          galleryPhotos.length === 0 && 'cursor-default',
        )}
      >
        <ProductCoverImage
          src={coverSrc}
          alt={plant.name}
          sizes="88px"
          imageClassName="object-[center_35%] transition-transform duration-200 group-hover:scale-[1.03]"
        />
        {galleryPhotos.length > 0 ? (
          <>
            <span
              className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white opacity-90 backdrop-blur-sm transition group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" />
              </span>
            </span>
          </>
        ) : null}
        {showBadges ? (
          <div className="absolute inset-x-0 bottom-0 z-[1] flex flex-wrap items-end gap-0.5 p-1">
            {discountPercent ? (
              <Badge
                variant="destructive"
                className="rounded-[2px] px-[3px] py-0 text-[10px] shadow-sm"
              >
                −{discountPercent}%
              </Badge>
            ) : null}
            {plant.isNew ? (
              <Badge className="rounded-[2px] bg-primary/95 px-[3px] py-0 text-[10px] text-primary-foreground shadow-sm">
                {t('newBadge')}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </button>

      {galleryPhotos.length > 0 ? (
        <VariantPhotoGalleryDialog
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          photos={galleryPhotos}
          plantName={plant.name}
          variantLabel={variant?.label}
        />
      ) : null}
    </>
  )
}

function useVariantBuyHandler(plant: Plant) {
  const cartT = useTranslations('cart')
  const cartItems = useCartItems()
  const { addItem, updateQuantity } = useCartActions()

  return (variant: ProductVariant, targetQuantity: number, unitPrice: number) => {
    const inCart = getCartLineQuantity(cartItems, plant.id, variant.id)
    let addedCount = 0

    if (targetQuantity < inCart) {
      updateQuantity(plant.id, targetQuantity, variant.id)
    } else if (targetQuantity > inCart) {
      const result = addItem(plant, targetQuantity - inCart, { variant, unitPrice })
      addedCount = result.added
    }

    if (addedCount > 0) {
      showAddedToCartToast(cartT('addedToCart', { count: addedCount }), plant.name, variant.label)
    }
  }
}

function CatalogProductVariantRow({
  plant,
  variant,
}: {
  plant: Plant
  variant: ProductVariant
}) {
  const t = useTranslations('product')
  const tc = useTranslations('common')
  const cartT = useTranslations('cart')
  const cartItems = useCartItems()
  const onBuy = useVariantBuyHandler(plant)

  const href = productHrefFromPlant(plant)
  const discountPercent = getPlantMaxDiscountPercent(plant)
  const { packaging, sizeLabel } = splitVariantLabel(variant.label)
  const canOrder = canOrderVariant(variant)
  const preorder = isVariantPreorder(variant)
  const hasShipment = variantHasAvailableFrom(variant) && Boolean(variant.availableFrom)
  const singleUnitSale = getSingleUnitSaleTier(variant)
  const salePrice = singleUnitSale?.pricePerUnit ?? variant.basePrice

  const inCart = useMemo(
    () => cartItems.find((item) => item.plant.id === plant.id && item.variantId === variant.id)?.quantity ?? 0,
    [cartItems, plant.id, variant.id],
  )
  const maxQty = getVariantMaxQuantity(variant)
  const maxAddable = useMemo(
    () => getMaxAddableQuantity(variant, cartItems, plant.id),
    [variant, cartItems, plant.id],
  )

  const [quantity, setQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState('1')
  const [limitHint, setLimitHint] = useState(false)

  useEffect(() => {
    setQuantity(1)
    setQuantityInput('1')
    setLimitHint(false)
  }, [variant.id])

  useEffect(() => {
    if (maxAddable <= 0) {
      setQuantity(1)
      setQuantityInput('1')
      setLimitHint(false)
      return
    }
    if (quantity > maxAddable) {
      setQuantity(maxAddable)
      setQuantityInput(String(maxAddable))
      setLimitHint(false)
    }
  }, [maxAddable, quantity])

  const clampAddable = (value: number) => {
    if (maxAddable <= 0) return 1
    return Math.min(maxAddable, Math.max(1, value))
  }

  const applyQuantity = (next: number, showHintIfCapped = false) => {
    const parsed = Math.max(1, next)
    if (maxAddable <= 0) {
      setQuantity(1)
      setQuantityInput('1')
      setLimitHint(false)
      return
    }
    if (parsed > maxAddable) {
      if (showHintIfCapped) setLimitHint(true)
      const clamped = maxAddable
      setQuantity(clamped)
      setQuantityInput(String(clamped))
      return
    }
    setLimitHint(false)
    const clamped = clampAddable(parsed)
    setQuantity(clamped)
    setQuantityInput(String(clamped))
  }

  const commitQuantityInput = () => {
    const parsed = parseInt(quantityInput.replace(/\D/g, ''), 10)
    if (!quantityInput.trim() || Number.isNaN(parsed)) {
      applyQuantity(1)
      return
    }
    applyQuantity(parsed, true)
  }

  const targetQuantity = inCart + quantity
  const unitPrice = getUnitPriceForQuantity(variant, targetQuantity)
  const atCartMax = maxAddable <= 0 && inCart > 0
  const hasPartialInCart = inCart > 0 && !atCartMax

  const cartHints = (
    <>
      {limitHint ? (
        <p className="text-xs text-destructive max-sm:text-left sm:text-right" role="alert">
          {cartT('maxAddable', { count: maxAddable, inCart })}
        </p>
      ) : null}
      {!limitHint && atCartMax ? (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary max-sm:justify-start sm:justify-end">
          <span>{cartT('maxInCart', { count: maxQty })}</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label={tc('cart')} />
        </p>
      ) : null}
      {!limitHint && hasPartialInCart ? (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary max-sm:justify-start sm:justify-end">
          <span>{cartT('inCartCount', { count: inCart })}</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label={tc('cart')} />
        </p>
      ) : null}
    </>
  )

  const hasDesktopCartHint = Boolean(limitHint || atCartMax || hasPartialInCart)

  const desktopCartHintSlot = (
    <div className="flex min-h-[1.125rem] items-center justify-end text-xs leading-none">
      {hasDesktopCartHint ? (
        <span className="pointer-events-auto">{cartHints}</span>
      ) : (
        <p
          className="invisible inline-flex items-center gap-x-1 font-medium text-primary"
          aria-hidden
        >
          <span>{cartT('inCartCount', { count: 1 })}</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
        </p>
      )}
    </div>
  )

  const orderControls = canOrder ? (
    <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
      <div
        className={cn(
          'flex h-9 flex-1 items-center rounded-lg border bg-background sm:flex-none',
          inCart > 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-8 shrink-0"
          onClick={() => applyQuantity(quantity - 1)}
          disabled={quantity <= 1}
          aria-label={cartT('decreaseQty')}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={cartT('quantity')}
          value={quantityInput}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            setQuantityInput(digits)
            if (digits === '') {
              setLimitHint(false)
              return
            }
            const parsed = parseInt(digits, 10)
            if (!Number.isNaN(parsed)) {
              if (parsed > maxAddable) {
                setLimitHint(true)
                setQuantity(clampAddable(parsed))
              } else {
                setLimitHint(false)
                setQuantity(clampAddable(parsed))
              }
            }
          }}
          onBlur={commitQuantityInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitQuantityInput()
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          className={cn(
            'h-9 w-9 min-w-[2.25rem] flex-1 border-0 bg-transparent px-0 text-center text-sm font-semibold tabular-nums shadow-none focus-visible:ring-0 sm:flex-none',
            inCart > 0 && 'text-primary',
          )}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-8 shrink-0"
          onClick={() => applyQuantity(quantity + 1, true)}
          disabled={atCartMax || quantity >= maxAddable}
          aria-label={cartT('increaseQty')}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button
        type="button"
        size="sm"
        className="h-9 shrink-0 gap-1.5 px-2.5 sm:h-9 sm:w-9 sm:px-0"
        disabled={atCartMax}
        aria-label={preorder ? t('preorder') : t('addToCart')}
        onClick={() => onBuy(variant, targetQuantity, unitPrice)}
      >
        <ShoppingCart className="h-4 w-4 shrink-0" />
        <span className="text-xs sm:hidden">{preorder ? t('preorder') : t('addToCart')}</span>
      </Button>

      <FavoriteButton productId={plant.id} tone="brand" size="sm" className="shrink-0" />
    </div>
  ) : (
    <FavoriteButton productId={plant.id} tone="brand" size="sm" className="shrink-0" />
  )

  const mobileActions = (
    <div className="max-sm:col-span-2 flex flex-col gap-1.5 sm:hidden">
      {cartHints}
      {orderControls}
    </div>
  )

  const desktopActions = (
    <div className="relative hidden shrink-0 sm:block sm:self-center">
      <div className="pointer-events-none absolute right-0 bottom-full mb-1.5 w-max max-w-[14rem]">
        {desktopCartHintSlot}
      </div>
      <div className="inline-flex flex-col items-stretch gap-1.5">
        {orderControls}
        {hasShipment && variant.availableFrom ? (
          <ShipmentDateBadge date={variant.availableFrom} block />
        ) : null}
      </div>
    </div>
  )

  return (
    <article className={catalogListRowClassName}>
      <div className="max-sm:row-span-2 sm:shrink-0">
        <CatalogListProductImage
          plant={plant}
          variant={variant}
          discountPercent={discountPercent}
          showBadges={Boolean(discountPercent || plant.isNew)}
        />
      </div>

      <div className="min-w-0 max-sm:col-start-2 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-col justify-center gap-0.5 sm:max-w-[42%] lg:max-w-[36%]">
          <Link href={href} className="group/title block min-w-0">
            <h3 className="line-clamp-2 font-sans text-base font-medium leading-snug text-foreground transition-colors group-hover/title:text-primary sm:line-clamp-1 sm:text-lg sm:leading-[1.25]">
              {plant.name}
            </h3>
          </Link>
          <p className="line-clamp-2 font-sans text-xs leading-snug text-muted-foreground sm:text-sm">
            {packaging ? `${packaging} · ${sizeLabel}` : sizeLabel}
          </p>
          <p className="hidden font-sans text-sm text-muted-foreground sm:block">
            {canOrder ? (
              <>
                {t('availability')}:{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {getVariantDisplayStock(variant)} {tc('pieceShort')}
                </span>
              </>
            ) : (
              tc('outOfStock')
            )}
          </p>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col items-end justify-center gap-1.5 sm:flex">
          <PriceWithExVatUnder storedAmount={salePrice} align="end">
            <DiscountedUnitPrice
              originalPrice={variant.basePrice}
              salePrice={salePrice}
              perUnit="sale-only"
              unitSymbol={variant.salesUnitSymbol}
              stacked
              className="items-end"
              originalClassName="font-sans text-xs"
              saleClassName="font-sans text-base font-semibold tabular-nums"
            />
          </PriceWithExVatUnder>
          <CatalogVariantDiscountChips
            variant={variant}
            className="ml-auto max-w-full"
            onTierClick={(tierMinQuantity) => {
              const addQty = Math.max(1, tierMinQuantity - inCart)
              applyQuantity(addQty, true)
            }}
          />
        </div>
      </div>

      <div className="max-sm:col-span-2 flex items-center justify-between gap-2 sm:hidden">
        <p className="text-xs text-muted-foreground">
          {canOrder ? (
            <>
              {t('availability')}:{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {getVariantDisplayStock(variant)} {tc('pieceShort')}
              </span>
            </>
          ) : (
            tc('outOfStock')
          )}
        </p>
        <PriceWithExVatUnder storedAmount={salePrice} align="end" className="shrink-0">
          <DiscountedUnitPrice
            originalPrice={variant.basePrice}
            salePrice={salePrice}
            perUnit="sale-only"
            unitSymbol={variant.salesUnitSymbol}
            stacked={hasVariantSalePrice(variant, salePrice)}
            className="shrink-0 items-end"
            originalClassName="font-sans text-xs text-muted-foreground"
            saleClassName="font-sans text-xs font-semibold tabular-nums"
          />
        </PriceWithExVatUnder>
      </div>

      <div className="max-sm:col-span-2 w-full sm:hidden">
        <CatalogVariantDiscountChips
          variant={variant}
          chipClassName="px-1.5 py-0 text-[10px] leading-tight"
          priceClassName="text-[10px] font-semibold"
          onTierClick={(tierMinQuantity) => {
            const addQty = Math.max(1, tierMinQuantity - inCart)
            applyQuantity(addQty, true)
          }}
        />
      </div>

      {mobileActions}
      {desktopActions}

      {hasShipment && variant.availableFrom ? (
        <div className="max-sm:col-span-2 sm:hidden">
          <ShipmentDateBadge date={variant.availableFrom} fullWidth />
        </div>
      ) : null}
    </article>
  )
}

function CatalogProductUnavailableRow({ plant }: { plant: Plant }) {
  const tc = useTranslations('common')
  const [notifyOpen, setNotifyOpen] = useState(false)
  const href = productHrefFromPlant(plant)
  const discountPercent = getPlantMaxDiscountPercent(plant)

  return (
    <>
      <article className={catalogListRowClassName}>
        <div className="max-sm:row-span-2 sm:shrink-0">
          <CatalogListProductImage
            plant={plant}
            discountPercent={discountPercent}
            showBadges={Boolean(discountPercent || plant.isNew)}
          />
        </div>

        <div className="min-w-0 max-sm:col-start-2 sm:flex sm:min-w-0 sm:flex-1 sm:items-center">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <Link href={href} className="group/title min-w-0">
              <h3 className="line-clamp-2 font-sans text-base font-medium leading-snug text-foreground transition-colors group-hover/title:text-primary sm:line-clamp-1 sm:text-lg sm:leading-[1.25]">
                {plant.name}
              </h3>
            </Link>
            <p className="font-sans text-xs font-medium text-muted-foreground sm:text-sm">{tc('outOfStock')}</p>
          </div>
        </div>

        <div className="max-sm:col-span-2 flex items-center gap-1.5 sm:col-start-auto sm:shrink-0 sm:justify-center">
          <NotifyAvailabilityButton
            compact
            onClick={() => setNotifyOpen(true)}
          />
          <FavoriteButton productId={plant.id} tone="brand" size="sm" className="shrink-0" />
        </div>
      </article>

      <NotifyWhenAvailableModal
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        plantId={plant.id}
        plantName={plant.name}
      />
    </>
  )
}

export function CatalogProductListRows({
  plant,
  discountFilter,
}: {
  plant: Plant
  discountFilter?: CatalogDiscountQuantityFilter
}) {
  const visibleVariants = getVisiblePlantVariants(plant).filter((variant) =>
    variantMatchesDiscountFilter(variant, discountFilter),
  )
  const fullyUnavailable = isPlantFullyUnavailable(visibleVariants)

  if (fullyUnavailable) {
    return <CatalogProductUnavailableRow plant={plant} />
  }

  return (
    <>
      {visibleVariants.map((variant) => (
        <CatalogProductVariantRow key={variant.id} plant={plant} variant={variant} />
      ))}
    </>
  )
}
