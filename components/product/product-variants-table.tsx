'use client'

import { useEffect, useMemo, useState } from 'react'
import { Camera, Minus, Plus, ShoppingCart } from 'lucide-react'

import { openPhotoModal } from '@/components/product/open-photo-modal'
import { ProductOutOfStockBlock } from '@/components/product/product-out-of-stock-block'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  formatPrice,
  getUnitPriceForQuantity,
  getVariantPriceRange,
} from '@/lib/product-pricing'
import {
  canOrderVariant,
  getVariantDisplayStock,
  isPlantOrderable,
  getVariantMaxQuantity,
  isVariantPreorder,
  variantHasAvailableFrom,
  variantHasPriceTiers,
} from '@/lib/plant-variants'
import { getMaxAddableQuantity } from '@/lib/cart-limits'
import { useCartItems } from '@/lib/cart-store'
import type { ProductVariant } from '@/lib/types'

type ProductVariantsTableProps = {
  variants: ProductVariant[]
  plantId: string
  plantName: string
  fullyOutOfStock: boolean
  onBuy: (variant: ProductVariant, quantity: number, unitPrice: number) => void
}

const variantSizeLabelClassName =
  'font-serif font-semibold leading-tight text-foreground sm:text-xl'

const variantFieldLabelClassName =
  'mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground'

const variantFieldLabelInlineClassName =
  'shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground'

const variantBuyButtonClassName = 'w-[10.5rem] shrink-0 justify-center'

function getVariantSizeCountLabel(count: number): string {
  const mod100 = count % 100
  const mod10 = count % 10
  if (mod100 >= 11 && mod100 <= 14) return `${count} розмірів`
  if (mod10 === 1) return `${count} розмір`
  if (mod10 >= 2 && mod10 <= 4) return `${count} розміри`
  return `${count} розмірів`
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
  const hasRange = priceMin !== priceMax

  return (
    <div className="mt-2 space-y-1.5 text-base text-muted-foreground">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span>від</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {formatPrice(priceMin)}
        </span>
        {hasRange && (
          <>
            <span className="text-muted-foreground/60" aria-hidden>
              —
            </span>
            <span>до</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {formatPrice(priceMax)}
            </span>
          </>
        )}
      </p>
      <p>
        Всього{' '}
        <span className="font-medium text-foreground">
          {getVariantSizeCountLabel(variantCount)}
        </span>{' '}
        на вибір
      </p>
    </div>
  )
}

const variantMobileHeaderClassName = cn(
  'border-b border-primary/15 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent',
  'px-2 py-2'
)

const shipmentBadgeClassName = cn(
  'inline-flex max-w-full rounded-lg border border-amber-200/90 bg-amber-50/95',
  'font-medium text-amber-950/90',
  'shadow-[0_0_0_3px_rgba(251,191,36,0.12)] ring-1 ring-amber-100/80'
)

function ShipmentDateBadge({
  date,
  className,
}: {
  date: string
  className?: string
}) {
  return (
    <p className={cn(shipmentBadgeClassName, 'px-2.5 py-1 text-sm', className)}>
      <span className="whitespace-nowrap">Відвантаження з {date}</span>
    </p>
  )
}

function AvailabilityBlock({
  variant,
  hideShipment = false,
  className,
  inlineLabel = false,
}: {
  variant: ProductVariant
  hideShipment?: boolean
  className?: string
  inlineLabel?: boolean
}) {
  const hasShipmentDate = variantHasAvailableFrom(variant)
  const label = <span className={variantFieldLabelInlineClassName}>Наявність</span>

  if (!canOrderVariant(variant)) {
    if (inlineLabel) {
      return (
        <div className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
          {label}
          <span className="font-medium text-muted-foreground">Немає в наявності</span>
        </div>
      )
    }
    return <p className="font-medium text-muted-foreground">Немає в наявності</p>
  }

  if (inlineLabel) {
    return (
      <div className={cn('space-y-1.5', className)}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          {label}
          <span className="font-medium tabular-nums text-foreground">
            {getVariantDisplayStock(variant)} шт.
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
        {getVariantDisplayStock(variant)} шт.
      </p>
      {!hideShipment && hasShipmentDate && variant.availableFrom && (
        <ShipmentDateBadge date={variant.availableFrom} />
      )}
    </div>
  )
}

function useSortedTiers(variant: ProductVariant) {
  return useMemo(
    () => [...variant.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity),
    [variant.priceTiers]
  )
}

function VariantBasePrice({
  variant,
  className,
}: {
  variant: ProductVariant
  className?: string
}) {
  return (
    <p className={cn('text-lg font-bold text-foreground', className)}>
      {formatPrice(variant.basePrice)}
    </p>
  )
}

function VariantTierPrices({
  variant,
  className,
}: {
  variant: ProductVariant
  className?: string
}) {
  const tiers = useSortedTiers(variant)
  if (!variantHasPriceTiers(variant)) return null

  return (
    <ul className={cn('space-y-1.5 text-sm', className)}>
      {tiers.map((tier) => (
        <li
          key={tier.minQuantity}
          className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 sm:justify-start sm:gap-x-1.5"
        >
          <span className="text-muted-foreground">від {tier.minQuantity} шт.</span>
          <span className="font-medium text-primary">{formatPrice(tier.pricePerUnit)}</span>
        </li>
      ))}
    </ul>
  )
}

function PriceBlock({
  variant,
  inlineLabel = false,
}: {
  variant: ProductVariant
  inlineLabel?: boolean
}) {
  if (inlineLabel) {
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={variantFieldLabelInlineClassName}>Ціна</span>
          <VariantBasePrice variant={variant} />
        </div>
        <VariantTierPrices variant={variant} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <VariantBasePrice variant={variant} />
      <VariantTierPrices variant={variant} />
    </div>
  )
}

function FreshPhotosButton({
  variant,
  size = 'default',
  compact = false,
}: {
  variant: ProductVariant
  size?: 'default' | 'lg'
  compact?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'shrink-0 gap-1.5 whitespace-nowrap border-primary/30 text-primary hover:bg-primary/5',
        compact ? 'h-10 px-3' : size === 'lg' ? 'h-10 px-4' : 'h-9 px-3'
      )}
      onClick={() => openPhotoModal(variant.id, variant.label)}
    >
      <Camera className="h-4 w-4" />
      <span>Свіжі фото</span>
    </Button>
  )
}

function VariantActions({
  variant,
  plantId,
  onBuy,
  size = 'default',
  layout = 'inline',
}: {
  variant: ProductVariant
  plantId: string
  onBuy: ProductVariantsTableProps['onBuy']
  size?: 'default' | 'lg'
  layout?: 'inline' | 'mobile'
}) {
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

  /** У полі — загальна кількість (у т.ч. уже в кошику) */
  useEffect(() => {
    const next = Math.min(maxQty, Math.max(1, inCart > 0 ? inCart : 1))
    setQuantity(next)
    setQuantityInput(String(next))
    setLimitHint(false)
  }, [variant.id, inCart, maxQty])

  const clampTotal = (value: number) => Math.min(maxQty, Math.max(1, value))

  const applyQuantity = (next: number, showHintIfCapped = false) => {
    const parsed = Math.max(1, next)
    if (parsed > maxQty) {
      if (showHintIfCapped) setLimitHint(true)
      const clamped = maxQty
      setQuantity(clamped)
      setQuantityInput(String(clamped))
      return
    }
    setLimitHint(false)
    const clamped = clampTotal(parsed)
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

  const unitPrice = getUnitPriceForQuantity(variant, quantity)
  const controlHeight = size === 'lg' ? 'h-10' : 'h-9'
  const iconSize = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9'

  const dec = () => applyQuantity(quantity - 1)
  const inc = () => applyQuantity(quantity + 1, true)

  const atCartMax = maxAddable <= 0 && inCart > 0
  const hasPartialInCart = inCart > 0 && !atCartMax
  const isMobileLayout = layout === 'mobile'

  const cartHints = (
    <>
      {limitHint && (
        <p className="text-xs text-destructive" role="alert">
          Не більше {maxQty} шт. доступно (у кошику {inCart})
        </p>
      )}
      {!limitHint && atCartMax && (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary">
          <span>Вже додано макс. {maxQty} шт. в</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label="Кошик" />
        </p>
      )}
      {!limitHint && hasPartialInCart && (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary">
          <span>У кошику {inCart} шт.</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label="Кошик" />
          {maxAddable > 0 && (
            <span className="text-muted-foreground">· ще можна {maxAddable}</span>
          )}
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
        isMobileLayout && 'min-w-0 flex-1'
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={iconSize}
        onClick={dec}
        disabled={quantity <= 1}
        aria-label="Зменшити кількість"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-label={
          inCart > 0 ? `Кількість, у кошику ${inCart} шт.` : 'Кількість'
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
            if (parsed > maxQty) {
              setLimitHint(true)
              setQuantity(maxQty)
            } else {
              setLimitHint(false)
              setQuantity(clampTotal(parsed))
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
          'h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-center font-semibold tabular-nums shadow-none focus-visible:ring-0',
          inCart > 0 && 'text-primary',
          isMobileLayout ? 'text-base' : size === 'lg' ? 'text-base' : 'text-sm'
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={iconSize}
        onClick={inc}
        disabled={quantity >= maxQty}
        aria-label="Збільшити кількість"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )

  const buyButton = (
    <Button
      type="button"
      size={isMobileLayout ? 'lg' : size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'gap-2',
        isMobileLayout ? 'w-full' : variantBuyButtonClassName
      )}
      disabled={atCartMax && quantity === inCart}
      onClick={() => onBuy(variant, quantity, unitPrice)}
    >
      <ShoppingCart className="h-4 w-4 shrink-0" />
      {preorder ? 'Забронювати' : 'Купити'}
    </Button>
  )

  if (!canOrder) {
    return (
      <div
        className={cn(
          'flex flex-col gap-2',
          !isMobileLayout && 'ml-auto items-end'
        )}
      >
        {cartHints}
        <FreshPhotosButton variant={variant} size={size} compact={isMobileLayout} />
      </div>
    )
  }

  if (isMobileLayout) {
    return (
      <div className="flex flex-col gap-3">
        {cartHints}
        <div className="flex items-stretch gap-2">
          {quantityControl}
          <FreshPhotosButton variant={variant} size="lg" compact />
        </div>
        {buyButton}
      </div>
    )
  }

  return (
    <div className="ml-auto flex flex-col items-end gap-2">
      {cartHints}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <FreshPhotosButton variant={variant} size={size} />
        {quantityControl}
        {buyButton}
      </div>
    </div>
  )
}

function VariantMobileCard({
  variant,
  plantId,
  onBuy,
}: {
  variant: ProductVariant
  plantId: string
  onBuy: ProductVariantsTableProps['onBuy']
}) {
  const hasShipment = variantHasAvailableFrom(variant) && Boolean(variant.availableFrom)

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className={variantMobileHeaderClassName}>
        <h3 className={variantSizeLabelClassName}>{variant.label}</h3>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 items-start gap-x-4 gap-y-3 text-sm">
          <div className="min-w-0">
            <p className={variantFieldLabelClassName}>Наявність</p>
            <AvailabilityBlock variant={variant} hideShipment />
          </div>
          <div className="min-w-0 text-right">
            <p className={variantFieldLabelClassName}>Ціна</p>
            <VariantBasePrice variant={variant} className="text-right" />
          </div>
        </div>

        {variantHasPriceTiers(variant) && (
          <div className="border-t border-border/80 pt-3">
            <VariantTierPrices variant={variant} className="w-full" />
          </div>
        )}

        <VariantActions
          variant={variant}
          plantId={plantId}
          onBuy={onBuy}
          size="lg"
          layout="mobile"
        />
      </div>

      {hasShipment && variant.availableFrom && (
        <ShipmentDateBadge
          date={variant.availableFrom}
          className="flex w-full justify-center rounded-none border-x-0 border-b-0 px-3 py-2.5 text-[13px]"
        />
      )}
    </article>
  )
}

function VariantDesktopRow({
  variant,
  plantId,
  onBuy,
}: {
  variant: ProductVariant
  plantId: string
  onBuy: ProductVariantsTableProps['onBuy']
}) {
  return (
    <tr className="border-b border-border/80 last:border-0 hover:bg-muted/30">
      <td className="px-4 py-4 align-top">
        <span className="font-serif text-base font-semibold text-foreground">{variant.label}</span>
      </td>
      <td className="px-3 py-4 align-top">
        <AvailabilityBlock variant={variant} inlineLabel />
      </td>
      <td className="min-w-[10rem] px-3 py-4 align-top">
        <PriceBlock variant={variant} inlineLabel />
      </td>
      <td className="px-4 py-4 align-top">
        <VariantActions variant={variant} plantId={plantId} onBuy={onBuy} />
      </td>
    </tr>
  )
}

export function ProductVariantsTable({
  variants,
  plantId,
  plantName,
  fullyOutOfStock,
  onBuy,
}: ProductVariantsTableProps) {
  const canOrder = isPlantOrderable(variants)
  const { min: priceMin, max: priceMax } = getVariantPriceRange(variants)

  return (
    <section className="space-y-4" aria-label="Розміри та ціни">
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl">Розміри та ціни</h2>
        {canOrder && variants.length > 0 && (
          <ProductVariantsSectionSummary
            priceMin={priceMin}
            priceMax={priceMax}
            variantCount={variants.length}
          />
        )}
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          {fullyOutOfStock
            ? 'Перегляньте доступні розміри. Підпишіться, щоб дізнатись про появу товару.'
            : 'Оберіть маркування і додайте до кошика. За наявності дати — можливе бронювання з відвантаженням у вказаний термін.'}
        </p>
      </div>

      {fullyOutOfStock && (
        <ProductOutOfStockBlock plantId={plantId} plantName={plantName} />
      )}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            {variants.map((variant) => (
              <VariantDesktopRow
                key={variant.id}
                variant={variant}
                plantId={plantId}
                onBuy={onBuy}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {variants.map((variant) => (
          <VariantMobileCard
            key={variant.id}
            variant={variant}
            plantId={plantId}
            onBuy={onBuy}
          />
        ))}
      </div>
    </section>
  )
}
