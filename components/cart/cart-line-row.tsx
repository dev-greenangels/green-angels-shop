'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Minus, Plus, RefreshCw, Trash2, ShoppingCart } from 'lucide-react'

import { CartReplacementModal } from '@/components/cart/cart-replacement-modal'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { DiscountedLineTotal, DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { NotifyAvailabilityButton } from '@/components/product/notify-availability-button'
import { NotifyWhenAvailableModal } from '@/components/product/notify-when-available-modal'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isCartItemInStock } from '@/lib/cart-availability'
import { resolveCartLinePricing } from '@/lib/cart-line-pricing'
import { findVariantOnPlant, getCartItemMaxQuantity, getMaxAddableQuantity } from '@/lib/cart-limits'
import { variantHasAvailableFrom } from '@/lib/plant-variants'
import type { PricingQuoteLine } from '@/lib/pricing/quote'
import { productHrefFromPlant } from '@/lib/catalog/paths'
import { cn } from '@/lib/utils'
import type { CartItem, Plant, ProductVariant } from '@/lib/types'
import { Link } from '@/i18n/navigation'

type CartLineRowProps = {
  item: CartItem
  items: CartItem[]
  updateQuantity: (plantId: string, quantity: number, variantId: string) => void
  removeItem: (plantId: string, variantId: string) => void
  replaceItem: (oldItem: CartItem, plant: Plant, variant: ProductVariant, unitPrice: number) => void
  onNavigate?: () => void
  compact?: boolean
  quoteLine?: PricingQuoteLine | null
  /** У боковому кошику — без перекресленої суми рядка, лише фінальна ціна */
  showLineStrikethrough?: boolean
}

export function CartLineRow({
  item,
  items,
  updateQuantity,
  removeItem,
  replaceItem,
  onNavigate,
  compact = false,
  quoteLine,
  showLineStrikethrough = true,
}: CartLineRowProps) {
  const productHref = productHrefFromPlant(item.plant)
  const variantId = item.variantId
  const inStock = isCartItemInStock(item)

  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)

  if (!variantId) return null

  const variant = findVariantOnPlant(item.plant, variantId)
  if (!variant) return null

  if (!inStock) {
    return (
      <>
        <div
          className={cn(
            'flex flex-col border-b border-[#d6d5d5] pb-3 opacity-60',
            compact && 'pb-2',
          )}
        >
          <div className="flex gap-4">
            <Link
              href={productHref}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted grayscale"
              aria-label={tc('goToProduct', { name: item.plant.name })}
              onClick={onNavigate}
            >
              <Image
                src={item.plant.images[0] || '/images/category-placeholder.svg'}
                alt={item.plant.name}
                fill
                className="object-cover"
              />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={productHref} className="block min-w-0" onClick={onNavigate}>
                    <h4 className="truncate text-sm font-medium">{item.plant.name}</h4>
                  </Link>
                  {item.variantLabel ? (
                    <VariantSizeLabel
                      as="p"
                      label={item.variantLabel}
                      variant={variant}
                      className="text-sm font-medium text-muted-foreground"
                    />
                  ) : null}
                  {variantHasAvailableFrom(variant) && variant.availableFrom ? (
                    <ShipmentDateBadge
                      date={variant.availableFrom}
                      className="mt-1 px-2 py-0.5 text-xs"
                    />
                  ) : null}
                  <p className="mt-1 text-xs font-medium text-destructive">{tc('outOfStock')}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.plant.id, variantId)}
                  aria-label={t('remove')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {!compact ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <NotifyAvailabilityButton
                size="sm"
                className="flex-1"
                onClick={() => setNotifyOpen(true)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setReplaceOpen(true)}
              >
                <RefreshCw className="h-4 w-4" />
                {t('chooseReplacement')}
              </Button>
            </div>
          ) : null}
        </div>

        <NotifyWhenAvailableModal
          open={notifyOpen}
          onOpenChange={setNotifyOpen}
          plantId={item.plant.id}
          plantName={item.plant.name}
        />
        <CartReplacementModal
          open={replaceOpen}
          onOpenChange={setReplaceOpen}
          item={item}
          onReplace={(plant, nextVariant, nextUnitPrice) =>
            replaceItem(item, plant, nextVariant, nextUnitPrice)
          }
        />
      </>
    )
  }

  return (
    <InStockCartLineRow
      item={item}
      items={items}
      variant={variant}
      variantId={variantId}
      quoteLine={quoteLine}
      showLineStrikethrough={showLineStrikethrough}
      productHref={productHref}
      updateQuantity={updateQuantity}
      removeItem={removeItem}
      onNavigate={onNavigate}
      compact={compact}
    />
  )
}

function InStockCartLineRow({
  item,
  items,
  variant,
  variantId,
  quoteLine,
  showLineStrikethrough,
  productHref,
  updateQuantity,
  removeItem,
  onNavigate,
  compact,
}: {
  item: CartItem
  items: CartItem[]
  variant: ProductVariant
  variantId: string
  quoteLine?: PricingQuoteLine | null
  showLineStrikethrough: boolean
  productHref: string
  updateQuantity: (plantId: string, quantity: number, variantId: string) => void
  removeItem: (plantId: string, variantId: string) => void
  onNavigate?: () => void
  compact: boolean
}) {
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const pricing = resolveCartLinePricing(item, variant, quoteLine)
  const maxQty = Math.max(1, getCartItemMaxQuantity(item))
  const inCart = item.quantity
  const maxAddable = getMaxAddableQuantity(variant, items, item.plant.id)
  const atCartMax = inCart >= maxQty
  const hasPartialInCart = inCart > 0 && !atCartMax
  const shipmentDate =
    variantHasAvailableFrom(variant) && variant.availableFrom ? variant.availableFrom : null

  const [quantityInput, setQuantityInput] = useState(String(item.quantity))
  const [limitHint, setLimitHint] = useState(false)

  useEffect(() => {
    setQuantityInput(String(item.quantity))
    setLimitHint(false)
  }, [item.quantity, item.plant.id, item.variantId])

  const clampTotal = (value: number) => Math.min(maxQty, Math.max(1, value))

  const commitQuantityInput = () => {
    const parsed = parseInt(quantityInput.replace(/\D/g, ''), 10)

    if (!quantityInput.trim() || Number.isNaN(parsed)) {
      const next = 1
      setLimitHint(false)
      setQuantityInput(String(next))
      updateQuantity(item.plant.id, next, variantId)
      return
    }

    const next = clampTotal(parsed)
    setLimitHint(parsed > maxQty)
    setQuantityInput(String(next))
    updateQuantity(item.plant.id, next, variantId)
  }

  const dec = () => {
    const next = Math.max(1, inCart - 1)
    setLimitHint(false)
    setQuantityInput(String(next))
    updateQuantity(item.plant.id, next, variantId)
  }

  const inc = () => {
    if (atCartMax) return
    const nextRaw = inCart + 1
    const next = clampTotal(nextRaw)
    setLimitHint(nextRaw > maxQty)
    setQuantityInput(String(next))
    updateQuantity(item.plant.id, next, variantId)
  }

  if (compact) {
    return (
      <div className="border-b border-border/60 pb-3 last:border-0">
        <div className="flex gap-3">
          <Link
            href={productHref}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"
            aria-label={tc('goToProduct', { name: item.plant.name })}
            onClick={onNavigate}
          >
            <Image
              src={item.plant.images[0] || '/images/category-placeholder.svg'}
              alt={item.plant.name}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={productHref} className="block min-w-0" onClick={onNavigate}>
              <p className="truncate text-sm font-medium text-foreground">{item.plant.name}</p>
            </Link>
            {item.variantLabel ? (
              <VariantSizeLabel
                as="p"
                label={item.variantLabel}
                variant={variant}
                className="text-xs font-medium text-primary"
              />
            ) : null}
            {shipmentDate ? (
              <ShipmentDateBadge date={shipmentDate} className="mt-1 px-2 py-0.5 text-xs" />
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            {showLineStrikethrough ? (
              <DiscountedLineTotal
                originalTotal={pricing.originalLineTotal}
                saleTotal={pricing.saleLineTotal}
                className="text-sm font-semibold text-foreground"
                saleClassName="text-sm font-semibold"
                mode="shelf"
              />
            ) : (
              <FormattedPrice
                amount={pricing.saleLineTotal}
                className="text-sm font-semibold text-foreground"
                mode="shelf"
              />
            )}
            <p className="text-xs text-muted-foreground">
              <DiscountedUnitPrice
                originalPrice={pricing.originalUnitPrice}
                salePrice={pricing.saleUnitPrice}
                perUnit
                saleClassName="text-xs"
                mode="shelf"
              />
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 pl-[4.75rem]">
          <div className="flex min-w-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={dec}
              disabled={inCart <= 1}
              aria-label={t('decreaseQty')}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label={t('quantity')}
              value={quantityInput}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setQuantityInput(digits)
                if (digits === '') {
                  setLimitHint(false)
                  return
                }
                const parsed = parseInt(digits, 10)
                if (!Number.isNaN(parsed)) setLimitHint(parsed > maxQty)
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
                'h-7 w-10 shrink-0 rounded-md border border-input bg-background px-0 text-center text-sm font-medium tabular-nums shadow-none',
                'focus-visible:ring-1 focus-visible:ring-ring',
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={inc}
              disabled={atCartMax}
              aria-label={t('increaseQty')}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="min-w-0 text-right text-xs">
            {limitHint ? (
              <p className="text-destructive" role="alert">
                {t('inStock', { count: maxQty })}
              </p>
            ) : atCartMax ? (
              <p className="font-medium text-primary">{t('maxQty', { count: maxQty })}</p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col border-b border-[#d6d5d5] pb-2">
      <div className="flex gap-4">
        <Link
          href={productHref}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
          aria-label={tc('goToProduct', { name: item.plant.name })}
          onClick={onNavigate}
        >
          <Image
            src={item.plant.images[0] || '/images/category-placeholder.svg'}
            alt={item.plant.name}
            fill
            className="object-cover"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <Link href={productHref} className="block min-w-0 flex-1" onClick={onNavigate}>
              <h4 className="truncate text-sm font-medium">{item.plant.name}</h4>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
              onClick={() => removeItem(item.plant.id, variantId)}
              aria-label={t('remove')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {item.variantLabel ? (
            <VariantSizeLabel
              as="p"
              label={item.variantLabel}
              variant={variant}
              className="text-sm font-medium text-primary"
            />
          ) : null}
          {shipmentDate ? (
            <ShipmentDateBadge date={shipmentDate} className="mt-1 px-2 py-0.5 text-xs" />
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={dec}
            disabled={inCart <= 1}
            aria-label={t('decreaseQty')}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={t('quantity')}
            value={quantityInput}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              setQuantityInput(digits)
              if (digits === '') {
                setLimitHint(false)
                return
              }
              const parsed = parseInt(digits, 10)
              if (!Number.isNaN(parsed)) setLimitHint(parsed > maxQty)
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
              'h-7 w-10 shrink-0 rounded-md border border-input bg-background px-0 text-center text-sm font-medium tabular-nums shadow-none',
              'focus-visible:ring-1 focus-visible:ring-ring',
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={inc}
            disabled={atCartMax}
            aria-label={t('increaseQty')}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <div className="min-w-0 self-end text-xs">
            {limitHint ? (
              <p className="text-destructive" role="alert">
                {t('inStockOnly', { count: maxQty })}
              </p>
            ) : null}
            {!limitHint && atCartMax ? (
              <p className="inline-flex flex-wrap items-center gap-x-1 font-medium text-primary">
                <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{t('addedAllInStock', { count: maxQty })}</span>
              </p>
            ) : null}
            {!limitHint && hasPartialInCart && maxAddable > 0 ? (
              <p className="font-medium text-muted-foreground">{t('moreInStock', { count: maxAddable })}</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          {showLineStrikethrough ? (
            <DiscountedLineTotal
              originalTotal={pricing.originalLineTotal}
              saleTotal={pricing.saleLineTotal}
              saleClassName="text-sm font-semibold"
              mode="shelf"
            />
          ) : (
            <FormattedPrice
              amount={pricing.saleLineTotal}
              className="text-sm font-semibold"
              mode="shelf"
            />
          )}
          <p className="text-xs text-muted-foreground">
            <DiscountedUnitPrice
              originalPrice={pricing.originalUnitPrice}
              salePrice={pricing.saleUnitPrice}
              perUnit
              saleClassName="text-xs"
              mode="shelf"
            />
          </p>
        </div>
      </div>
    </div>
  )
}
