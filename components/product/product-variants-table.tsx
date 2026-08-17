'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { PriceWithExVatUnder, ShelfPriceBlock } from '@/components/commerce/shelf-price-block'
import { ProductOutOfStockBlock } from '@/components/product/product-out-of-stock-block'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { VariantPhotoGalleryDialog } from '@/components/product/variant-photo-gallery-dialog'
import { VariantPhotoThumbnail } from '@/components/product/variant-photo-thumbnail'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  getBulkPriceTiers,
  getSingleUnitSaleTier,
  getUnitPriceForQuantity,
  getVariantDiscountLayout,
  getVariantPriceRange,
} from '@/lib/product-pricing'
import {
  canOrderVariant,
  getVariantDisplayStock,
  isPlantOrderable,
  getVariantMaxQuantity,
  isVariantPreorder,
  variantHasAvailableFrom,
} from '@/lib/plant-variants'
import { getMaxAddableQuantity } from '@/lib/cart-limits'
import { useCartItems } from '@/lib/cart-store'
import { useVariantPhotos } from '@/lib/variant-photos/use-variant-photos'
import type { ProductVariant } from '@/lib/types'

type ProductVariantsTableProps = {
  variants: ProductVariant[]
  plantId: string
  plantName: string
  fullyOutOfStock: boolean
  onBuy: (variant: ProductVariant, quantity: number, unitPrice: number) => void
  embedded?: boolean
  selectedVariantId?: string | null
  onSelectVariant?: (variantId: string) => void
}

const variantSizeLabelClassName =
  'font-sans font-medium leading-snug text-foreground sm:text-lg'

const variantFieldLabelClassName =
  'mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground'

const variantFieldLabelInlineClassName =
  'shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground'

function getVariantSizeCountLabel(count: number, t: ReturnType<typeof useTranslations<'product'>>): string {
  return t('totalSizes', { count })
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

function VariantTitleColumn({
  variant,
  className,
}: {
  variant: ProductVariant
  className?: string
}) {
  const t = useTranslations('product')
  const { packaging, sizeLabel } = splitVariantLabel(variant.label)
  const hasShipment = variantHasAvailableFrom(variant) && Boolean(variant.availableFrom)

  return (
    <div className={cn('min-w-0', className)}>
      {packaging ? (
        <p className={cn(variantSizeLabelClassName, 'text-base lg:text-lg')}>{packaging}</p>
      ) : null}
      <p
        className={cn(
          packaging ? 'mt-0.5 text-sm font-medium text-foreground/90' : variantSizeLabelClassName,
          !packaging && 'text-base lg:text-lg',
        )}
      >
        {sizeLabel}
      </p>
      {hasShipment && variant.availableFrom ? (
        <p className="mt-1 text-xs font-medium text-amber-900/90 dark:text-amber-100/90">
          {t('shipmentFrom', { date: variant.availableFrom })}
        </p>
      ) : null}
    </div>
  )
}

function ProductVariantsSectionSummary({
  priceMin,
  priceMax,
  variantCount,
}: {
  priceMin: number
  priceMax: number
  variantCount: number
}) {
  const t = useTranslations('product')
  const hasRange = priceMin !== priceMax
  const singleSize = variantCount === 1 && !hasRange

  return (
    <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs tracking-wide text-muted-foreground/80 sm:text-[13px]">
      <ShelfPriceBlock
        label={singleSize ? 'price' : 'from'}
        amount={priceMin}
        amountMax={hasRange ? priceMax : undefined}
        className="text-xs sm:text-[13px]"
        primaryClassName="text-xs font-medium text-muted-foreground sm:text-[13px]"
      />
      <span className="text-muted-foreground/40" aria-hidden>
        ·
      </span>
      <span>{getVariantSizeCountLabel(variantCount, t)}</span>
    </p>
  )
}

const variantBlockSurfaceClassName = cn(
  'bg-gradient-to-br from-primary/12 via-primary/6 to-transparent',
)

const variantMobileHeaderClassName = cn(
  'border-b border-primary/15',
  'px-2 py-2'
)

function AvailabilityBlock({
  variant,
  hideShipment = false,
  className,
  inlineLabel = false,
  stackedLabel = false,
}: {
  variant: ProductVariant
  hideShipment?: boolean
  className?: string
  inlineLabel?: boolean
  stackedLabel?: boolean
}) {
  const t = useTranslations('product')
  const tc = useTranslations('common')
  const hasShipmentDate = variantHasAvailableFrom(variant)
  const inlineLabelEl = <span className={variantFieldLabelInlineClassName}>{t('availability')}</span>
  const stackedLabelEl = <span className={variantFieldLabelClassName}>{t('availability')}</span>

  if (!canOrderVariant(variant)) {
    if (stackedLabel) {
      return (
        <div className={cn('flex flex-col gap-0.5', className)}>
          {stackedLabelEl}
          <span className="font-medium text-muted-foreground">{tc('outOfStock')}</span>
        </div>
      )
    }
    if (inlineLabel) {
      return (
        <div className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
          {inlineLabelEl}
          <span className="font-medium text-muted-foreground">{tc('outOfStock')}</span>
        </div>
      )
    }
    return <p className="font-medium text-muted-foreground">{tc('outOfStock')}</p>
  }

  if (stackedLabel) {
    return (
      <div className={cn('flex flex-col gap-0.5', className)}>
        {stackedLabelEl}
        <span className="font-medium tabular-nums text-foreground">
          {getVariantDisplayStock(variant)} {tc('pieceShort')}
        </span>
        {!hideShipment && hasShipmentDate && variant.availableFrom && (
          <ShipmentDateBadge date={variant.availableFrom} />
        )}
      </div>
    )
  }

  if (inlineLabel) {
    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          {inlineLabelEl}
          <span className="font-medium tabular-nums text-foreground">
            {getVariantDisplayStock(variant)} {tc('pieceShort')}
          </span>
        </div>
        {!hideShipment && hasShipmentDate && variant.availableFrom && (
          <ShipmentDateBadge date={variant.availableFrom} />
        )}
      </div>
    )
  }

  return (
    <div className={cn(hideShipment ? undefined : 'space-y-2', className)}>
      <p className="font-medium tabular-nums text-foreground">
        {getVariantDisplayStock(variant)} {tc('pieceShort')}
      </p>
      {!hideShipment && hasShipmentDate && variant.availableFrom && (
        <ShipmentDateBadge date={variant.availableFrom} />
      )}
    </div>
  )
}

function VariantBasePrice({
  variant,
  className,
  stackedDiscount = false,
  priceAlign = 'end',
}: {
  variant: ProductVariant
  className?: string
  stackedDiscount?: boolean
  priceAlign?: 'start' | 'end'
}) {
  const singleUnitSale = getSingleUnitSaleTier(variant)
  const salePrice = singleUnitSale?.pricePerUnit ?? variant.basePrice

  return (
    <PriceWithExVatUnder
      storedAmount={salePrice}
      align={priceAlign}
      className={className}
    >
      <span className="inline-flex items-baseline">
        <DiscountedUnitPrice
          originalPrice={variant.basePrice}
          salePrice={salePrice}
          perUnit="sale-only"
          unitSymbol={variant.salesUnitSymbol}
          stacked={stackedDiscount}
          className={stackedDiscount && priceAlign === 'start' ? 'items-start' : undefined}
          originalClassName="text-sm font-medium"
          saleClassName="text-sm font-medium tabular-nums text-foreground"
        />
      </span>
    </PriceWithExVatUnder>
  )
}

function VariantPriceInlineRow({
  variant,
  stackedDiscount = false,
  className,
}: {
  variant: ProductVariant
  stackedDiscount?: boolean
  className?: string
}) {
  const t = useTranslations('product')

  return (
    <div className={cn('flex shrink-0 items-baseline gap-x-2 whitespace-nowrap ml-[auto]', className)}>
      <span className={variantFieldLabelInlineClassName}>{t('price')}</span>
      <VariantBasePrice variant={variant} stackedDiscount={stackedDiscount} priceAlign="start" />
    </div>
  )
}

function VariantTierPrices({
  variant,
  className,
  alignEnd = false,
}: {
  variant: ProductVariant
  className?: string
  alignEnd?: boolean
}) {
  const cart = useTranslations('cart')
  const tiers = useMemo(() => getBulkPriceTiers(variant), [variant])
  if (!tiers.length) return null

  return (
    <ul className={cn('space-y-1 text-sm', className)}>
      {tiers.map((tier) => (
        <li
          key={tier.minQuantity}
          className={cn(
            'flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md bg-muted/40 px-2 py-1',
            'justify-between',
            alignEnd ? 'md:justify-end' : 'md:justify-start',
          )}
        >
          <span className="text-muted-foreground">{cart('fromQty', { count: tier.minQuantity })}</span>
          <DiscountedUnitPrice
            originalPrice={variant.basePrice}
            salePrice={tier.pricePerUnit}
            perUnit="sale-only"
            unitSymbol={variant.salesUnitSymbol}
            originalClassName="text-xs"
            saleClassName="text-sm font-medium"
          />
        </li>
      ))}
    </ul>
  )
}

function VariantPriceColumn({
  variant,
  stacked = false,
  stackedDiscount = false,
  align = 'end',
}: {
  variant: ProductVariant
  stacked?: boolean
  stackedDiscount?: boolean
  align?: 'start' | 'end'
}) {
  const t = useTranslations('product')
  const alignClass = align === 'start' ? 'items-start text-left' : 'items-end text-right'

  if (stacked) {
    return (
      <div className={cn('flex  flex-col', alignClass)}>
        <span className={variantFieldLabelClassName}>{t('price')}</span>
        <VariantBasePrice
          variant={variant}
          stackedDiscount={stackedDiscount}
          priceAlign={align}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex shrink-0 flex-wrap items-baseline gap-x-2 gap-y-0.5', alignClass)}>
      <span className={variantFieldLabelInlineClassName}>{t('price')}</span>
      <VariantBasePrice variant={variant} />
    </div>
  )
}

function VariantPhotoControls({
  variant,
  plantName,
  className,
}: {
  variant: ProductVariant
  plantName?: string
  className?: string
}) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const showPhotos = variant.freshPhotos !== false
  const { photos } = useVariantPhotos(showPhotos ? variant.ean : null, showPhotos ? variant.sku : null)

  if (!showPhotos || photos.length === 0) return null

  return (
    <>
      <VariantPhotoThumbnail
        imageUrl={photos[0].thumbUrl}
        alt={photos[0].alt}
        onClick={() => setGalleryOpen(true)}
        className={className}
      />
      <VariantPhotoGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        photos={photos}
        plantName={plantName}
        variantLabel={variant.label}
      />
    </>
  )
}

function VariantTierDiscountChips({
  variant,
  className,
  onTierClick,
}: {
  variant: ProductVariant
  className?: string
  onTierClick?: (minQuantity: number) => void
}) {
  const cart = useTranslations('cart')
  const tiers = useMemo(() => getBulkPriceTiers(variant), [variant])
  if (!tiers.length) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tiers.map((tier) => (
        <button
          key={tier.minQuantity}
          type="button"
          onClick={() => onTierClick?.(tier.minQuantity)}
          className={cn(
            'inline-flex max-w-full items-baseline gap-x-2 rounded-full border border-border/70',
            'bg-background/95 px-3 py-1 text-sm leading-snug',
            'shadow-sm transition-[transform,box-shadow,background-color]',
            'hover:bg-background hover:shadow-md',
            'active:scale-[0.97] active:bg-muted/70 active:shadow-inner',
            onTierClick && 'cursor-pointer',
          )}
        >
          <span className="text-muted-foreground">{cart('fromQty', { count: tier.minQuantity })}</span>
          <FormattedPrice
            amount={tier.pricePerUnit}
            perUnit
            unitSymbol={variant.salesUnitSymbol}
            className="text-sm font-medium tabular-nums text-red-500 dark:text-red-400"
          />
        </button>
      ))}
    </div>
  )
}

function VariantTierDiscounts({
  variant,
  className,
  alignEnd = false,
}: {
  variant: ProductVariant
  className?: string
  alignEnd?: boolean
}) {
  const tc = useTranslations('common')
  const tiers = getBulkPriceTiers(variant)
  if (!tiers.length) return null

  return (
    <div className={className}>
      <p className={cn(variantFieldLabelClassName, 'mb-1.5', alignEnd && 'text-right')}>
        {tc('discount')}
      </p>
      <VariantTierPrices variant={variant} alignEnd={alignEnd} />
    </div>
  )
}

function VariantActions({
  variant,
  plantId,
  plantName,
  onBuy,
  size = 'default',
  layout = 'inline',
  embedded = false,
  showMoreCanAdd = false,
  onRegisterTierQuantityApply,
}: {
  variant: ProductVariant
  plantId: string
  plantName?: string
  onBuy: ProductVariantsTableProps['onBuy']
  size?: 'default' | 'lg'
  layout?: 'inline' | 'mobile'
  embedded?: boolean
  showMoreCanAdd?: boolean
  onRegisterTierQuantityApply?: (apply: (tierMinQuantity: number) => void) => void
}) {
  const t = useTranslations('product')
  const tc = useTranslations('common')
  const cart = useTranslations('cart')
  const cartItems = useCartItems()
  const canOrder = canOrderVariant(variant)
  const maxQty = getVariantMaxQuantity(variant)
  const inCart = useMemo(
    () => cartItems.find((i) => i.plant.id === plantId && i.variantId === variant.id)?.quantity ?? 0,
    [cartItems, plantId, variant.id]
  )
  const maxAddable = useMemo(
    () => getMaxAddableQuantity(variant, cartItems, plantId),
    [variant, cartItems, plantId]
  )
  const preorder = isVariantPreorder(variant)
  const [quantity, setQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState('1')
  const [limitHint, setLimitHint] = useState(false)
  const useThumbnailLayout = embedded || layout === 'mobile'

  /** У полі — кількість, яку додаємо поверх уже наявної в кошику. */
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

  const applyQuantityRef = useRef(applyQuantity)
  applyQuantityRef.current = applyQuantity

  useEffect(() => {
    if (!onRegisterTierQuantityApply) return
    onRegisterTierQuantityApply((tierMinQuantity: number) => {
      const addQty = Math.max(1, tierMinQuantity - inCart)
      applyQuantityRef.current(addQty, true)
    })
  }, [onRegisterTierQuantityApply, inCart, variant.id])

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
  const isCompact = useThumbnailLayout
  const controlHeight = isCompact ? 'h-9' : size === 'lg' ? 'h-10' : 'h-9'
  const iconSize = isCompact ? 'h-8 w-8 shrink-0' : size === 'lg' ? 'h-10 w-10' : 'h-9 w-9'

  const dec = () => applyQuantity(quantity - 1)
  const inc = () => applyQuantity(quantity + 1, true)

  const atCartMax = maxAddable <= 0 && inCart > 0
  const hasPartialInCart = inCart > 0 && !atCartMax
  const isMobileLayout = useThumbnailLayout

  const cartHints = (
    <>
      {limitHint && (
        <p className="text-xs text-destructive" role="alert">
          {cart('maxAddable', { count: maxAddable, inCart })}
        </p>
      )}
      {!limitHint && atCartMax && (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary">
          <span>{cart('maxInCart', { count: maxQty })}</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label={tc('cart')} />
        </p>
      )}
      {!limitHint && hasPartialInCart && (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary">
          <span>{cart('inCartCount', { count: inCart })}</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label={tc('cart')} />
          {showMoreCanAdd && maxAddable > 0 ? (
            <span className="text-muted-foreground">{t('moreCanAdd', { count: maxAddable })}</span>
          ) : null}
        </p>
      )}
    </>
  )

  const quantityControl = (
    <div
      className={cn(
        'flex items-center rounded-lg border bg-background',
        inCart > 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        controlHeight,
        isMobileLayout ? 'min-w-0 flex-1' : 'w-[auto]',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={iconSize}
        onClick={dec}
        disabled={quantity <= 1}
        aria-label={cart('decreaseQty')}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={
          inCart > 0 ? cart('quantityInCart', { count: inCart }) : cart('quantity')
        }
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
          'h-full w-10 min-w-[2.5rem] flex-1 border-0 bg-transparent px-0 text-center text-base font-semibold tabular-nums shadow-none focus-visible:ring-0',
          inCart > 0 && 'text-primary',
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={iconSize}
        onClick={inc}
        disabled={atCartMax || quantity >= maxAddable}
        aria-label={cart('increaseQty')}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )

  const buyButton = (
    <Button
      type="button"
      size={isMobileLayout ? 'default' : size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'gap-2',
        isMobileLayout ? 'min-w-0 flex-1 shrink-0 px-3 text-sm' : 'min-w-[7rem] shrink-0 justify-center',
      )}
      disabled={atCartMax}
      onClick={() => onBuy(variant, targetQuantity, unitPrice)}
    >
      <ShoppingCart className="h-4 w-4 shrink-0" />
      {preorder ? t('preorder') : t('addToCart')}
    </Button>
  )

  const thumbnailActionsRow = (
    <div className="flex items-center gap-2">
      {quantityControl}
      {buyButton}
      <VariantPhotoControls variant={variant} plantName={plantName} className="ml-auto shrink-0 self-center" />
    </div>
  )

  if (!canOrder) {
    if (useThumbnailLayout) {
      return (
        <div className="flex flex-col gap-2.5">
          {cartHints}
          <div className="flex justify-end">
            <VariantPhotoControls variant={variant} plantName={plantName} />
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-end gap-2">
        {cartHints}
      </div>
    )
  }

  if (useThumbnailLayout) {
    return (
      <div className="flex flex-col gap-2.5">
        {cartHints}
        {thumbnailActionsRow}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {cartHints}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {quantityControl}
        {buyButton}
      </div>
    </div>
  )
}

function VariantMobileCard({
  variant,
  plantId,
  plantName,
  onBuy,
  embedded = false,
  selected = false,
  onSelect,
}: {
  variant: ProductVariant
  plantId: string
  plantName: string
  onBuy: ProductVariantsTableProps['onBuy']
  embedded?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const hasShipment = variantHasAvailableFrom(variant) && Boolean(variant.availableFrom)
  const discountLayout = getVariantDiscountLayout(variant)
  const tierQuantityApplyRef = useRef<(tierMinQuantity: number) => void>(() => {})

  const embeddedDesktopMainRow = (
    <div className="flex flex-nowrap items-center gap-3 p-3 sm:gap-4">
      <VariantPhotoControls variant={variant} plantName={plantName} className="self-center" />
      <div className="shrink-0">
        <AvailabilityBlock variant={variant} hideShipment stackedLabel />
      </div>
      <VariantPriceColumn
        variant={variant}
        stacked
        align="start"
        stackedDiscount={discountLayout === 'single-unit'}
      />
      <div className="ml-auto shrink-0">
        <VariantActions
          variant={variant}
          plantId={plantId}
          plantName={plantName}
          onBuy={onBuy}
          layout="inline"
          onRegisterTierQuantityApply={(apply) => {
            tierQuantityApplyRef.current = apply
          }}
        />
      </div>
    </div>
  )

  const embeddedDesktopBody =
    discountLayout === 'bulk' ? (
      <>
        {embeddedDesktopMainRow}
        <div className="flex flex-wrap items-center gap-2 border-t border-primary/10 px-3 pb-3 pt-2.5">
          <VariantTierDiscountChips
            variant={variant}
            onTierClick={(minQuantity) => tierQuantityApplyRef.current(minQuantity)}
          />
        </div>
      </>
    ) : (
      embeddedDesktopMainRow
    )

  const embeddedDiscountChips =
    discountLayout === 'bulk' ? (
      <VariantTierDiscountChips
        variant={variant}
        onTierClick={(minQuantity) => tierQuantityApplyRef.current(minQuantity)}
      />
    ) : null

  const mobileBody = (
    <div className={cn('space-y-3', embedded ? 'space-y-3 p-3.5' : 'space-y-3 p-3')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <AvailabilityBlock variant={variant} hideShipment stackedLabel />
        </div>
        <VariantPriceColumn variant={variant} stacked />
      </div>

      {embedded ? embeddedDiscountChips : (
        <VariantTierDiscounts variant={variant} className="border-t border-border/80 pt-2.5" />
      )}

      <VariantActions
        variant={variant}
        plantId={plantId}
        plantName={plantName}
        onBuy={onBuy}
        size={embedded ? 'default' : 'lg'}
        layout="mobile"
        embedded={embedded}
        onRegisterTierQuantityApply={
          embedded
            ? (apply) => {
                tierQuantityApplyRef.current = apply
              }
            : undefined
        }
      />
    </div>
  )

  const desktopBody = (
    <div className="flex gap-4 p-2 lg:gap-5 items-center">
      <VariantPhotoControls variant={variant} plantName={plantName} className="shrink-0 self-center" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-nowrap items-baseline gap-x-5 lg:gap-x-6">
          <span
            className={cn(
              variantSizeLabelClassName,
              'shrink-0 whitespace-nowrap text-base lg:text-lg',
            )}
          >
            {variant.label}
          </span>
          <AvailabilityBlock
            variant={variant}
            hideShipment
            inlineLabel
            className="shrink-0 whitespace-nowrap ml-[auto]"
          />
          <VariantPriceInlineRow variant={variant} />
        </div>

        {(hasShipment || discountLayout === 'bulk') ? (
          <div className="flex items-center gap-2">
            {hasShipment && variant.availableFrom ? (
              <ShipmentDateBadge date={variant.availableFrom} className="shrink-0" />
            ) : null}
            {discountLayout === 'bulk' ? (
              <VariantTierDiscountChips
                variant={variant}
                onTierClick={(minQuantity) => tierQuantityApplyRef.current(minQuantity)}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 self-center">
        <VariantActions
          variant={variant}
          plantId={plantId}
          plantName={plantName}
          onBuy={onBuy}
          size="lg"
          layout="inline"
          onRegisterTierQuantityApply={(apply) => {
            tierQuantityApplyRef.current = apply
          }}
        />
      </div>
    </div>
  )

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-card shadow-sm',
        selected ? 'border-primary ring-1 ring-primary/25' : 'border-primary/15',
        embedded && 'shadow-md',
        onSelect && 'cursor-pointer',
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          variantMobileHeaderClassName,
          variantBlockSurfaceClassName,
          embedded ? 'px-3.5 py-2.5' : 'px-2 py-2 md:hidden',
        )}
      >
        <h3 className={cn(variantSizeLabelClassName, embedded && 'text-base sm:text-lg')}>
          {variant.label}
        </h3>
      </div>

      {embedded ? (
        <>
          <div className="sm:hidden">
            {mobileBody}
            {hasShipment && variant.availableFrom ? (
              <ShipmentDateBadge date={variant.availableFrom} fullWidth />
            ) : null}
          </div>
          <div className="hidden sm:block">
            {embeddedDesktopBody}
            {hasShipment && variant.availableFrom ? (
              <ShipmentDateBadge date={variant.availableFrom} fullWidth />
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="md:hidden">
            {mobileBody}
            {hasShipment && variant.availableFrom ? (
              <ShipmentDateBadge date={variant.availableFrom} fullWidth />
            ) : null}
          </div>
          <div className="hidden md:block">{desktopBody}</div>
        </>
      )}
    </article>
  )
}

export function ProductVariantsTable({
  variants,
  plantId,
  plantName,
  fullyOutOfStock,
  onBuy,
  embedded = false,
  selectedVariantId = null,
  onSelectVariant,
}: ProductVariantsTableProps) {
  const t = useTranslations('product')
  const canOrder = isPlantOrderable(variants)
  const { min: priceMin, max: priceMax } = getVariantPriceRange(variants)

  const handleBuy: ProductVariantsTableProps['onBuy'] = (variant, quantity, unitPrice) => {
    onSelectVariant?.(variant.id)
    onBuy(variant, quantity, unitPrice)
  }

  const variantsContent = fullyOutOfStock ? (
    <ProductOutOfStockBlock plantId={plantId} plantName={plantName} />
  ) : embedded ? (
    <div className="flex flex-col gap-3.5">
      {variants.map((variant) => (
        <VariantMobileCard
          key={variant.id}
          embedded
          variant={variant}
          plantId={plantId}
          plantName={plantName}
          selected={selectedVariantId === variant.id}
          onSelect={onSelectVariant ? () => onSelectVariant(variant.id) : undefined}
          onBuy={handleBuy}
        />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-3 md:gap-4">
      {variants.map((variant) => (
        <VariantMobileCard
          key={variant.id}
          variant={variant}
          plantId={plantId}
          plantName={plantName}
          selected={selectedVariantId === variant.id}
          onSelect={onSelectVariant ? () => onSelectVariant(variant.id) : undefined}
          onBuy={handleBuy}
        />
      ))}
    </div>
  )

  if (embedded) {
    return (
      <div className="space-y-3.5" aria-label={t('sizesAndPrices')}>
        {variantsContent}
      </div>
    )
  }

  return (
    <section className="space-y-4" aria-label={t('sizesAndPrices')}>
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">
            {fullyOutOfStock ? t('availability') : t('sizesAndPrices')}
          </h2>
          {canOrder && variants.length > 0 ? (
            <ProductVariantsSectionSummary
              priceMin={priceMin}
              priceMax={priceMax}
              variantCount={variants.length}
            />
          ) : null}
        </div>
        {!fullyOutOfStock ? (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{t('sizesHint')}</p>
        ) : null}
      </div>

      {variantsContent}
    </section>
  )
}
