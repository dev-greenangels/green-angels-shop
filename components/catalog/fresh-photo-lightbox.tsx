'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, ShoppingCart, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { showAddedToCartToast } from '@/lib/cart-toast'

import { FormattedPrice } from '@/components/commerce/formatted-price'
import { PriceWithExVatUnder } from '@/components/commerce/shelf-price-block'
import { DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { ShipmentDateBadge } from '@/components/product/shipment-date-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAvailableFromDisplay } from '@/lib/backstage/variant-pricing'
import { getCartLineQuantity, getMaxAddableQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { getVariantDisplayStock } from '@/lib/plant-variants'
import {
  getBulkPriceTiers,
  getMinVariantPrice,
  getSingleUnitSaleTier,
  getUnitPriceForQuantity,
} from '@/lib/product-pricing'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import { resolveFreshPhotoMainUrl } from '@/lib/variant-photos/fresh-photo-urls'
import {
  catalogPhotoToPlant,
  catalogPhotoToVariant,
  formatFreshPhotoDate,
  getPhotoTakenAt,
  resolveFreshPhotoDisplayName,
} from '@/lib/variant-photos/fresh-photo-card'
import type { ProductVariant } from '@/lib/types'
import { cn } from '@/lib/utils'

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

type FreshPhotoLightboxProps = {
  photo: CatalogPhotoItem | null
  onClose: () => void
}

export function FreshPhotoLightbox({ photo, onClose }: FreshPhotoLightboxProps) {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const tProduct = useTranslations('product')
  const cartT = useTranslations('cart')
  const cartItems = useCartItems()
  const { addItem } = useCartActions()
  const [qty, setQty] = useState(1)
  const fallbackName = tc('productFallback')

  useEffect(() => {
    if (photo) setQty(1)
  }, [photo?.id])

  const plant = useMemo(
    () =>
      photo
        ? catalogPhotoToPlant(photo, {
            locale,
            fallbackName,
          })
        : null,
    [photo, locale, fallbackName],
  )
  const variant = useMemo(() => (photo ? catalogPhotoToVariant(photo) : null), [photo])
  const displayName = photo
    ? resolveFreshPhotoDisplayName(photo, locale, fallbackName)
    : ''
  const selectedShipmentDate = photo?.availableFrom
    ? formatAvailableFromDisplay(photo.availableFrom)
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
  const sizeLabel = photo?.variantLabel || photo?.appProperties.plantSize || '—'

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
      showAddedToCartToast(cartT('addedToCart', { count: result.added }), plant.name, variant.label)
      setQty(1)
    }
  }

  return (
    <Dialog
      open={Boolean(photo)}
      onOpenChange={(open) => {
        if (!open) {
          setQty(1)
          onClose()
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className={cn(
          'max-w-[min(100vw-1rem,28rem)] overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-md',
          'max-h-[min(100dvh-1.5rem,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))]',
          'top-[calc(50%+((env(safe-area-inset-top)-env(safe-area-inset-bottom))/2))]',
        )}
      >
        {photo ? (
          <div className="relative max-h-[inherit] overflow-y-auto overscroll-contain">
            <div className="overflow-hidden rounded-xl bg-background shadow-xl">
              <DialogTitle className="sr-only">{displayName}</DialogTitle>

              <div className="relative bg-muted">
                <button
                  type="button"
                  className="absolute right-2 top-2 z-[75] inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/85 text-white shadow-md transition hover:bg-black sm:right-3 sm:top-3 sm:h-8 sm:w-8"
                  onClick={onClose}
                  aria-label={tc('close')}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex min-h-[240px] items-center justify-center px-3 py-4 sm:min-h-[420px]">
                  <Image
                    src={resolveFreshPhotoMainUrl(photo)}
                    alt={displayName}
                    width={720}
                    height={960}
                    unoptimized
                    className="max-h-[min(52dvh,28rem)] w-auto max-w-full object-contain"
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
                <p className="text-xs font-medium leading-snug text-foreground">
                  {displayName}
                  <span className="font-normal text-muted-foreground"> · {sizeLabel}</span>
                </p>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                  <p className="text-muted-foreground">
                    {t('freshPhotosPhotoFrom')}{' '}
                    <span className="text-foreground">
                      {formatFreshPhotoDate(getPhotoTakenAt(photo), locale) ?? '—'}
                    </span>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="tabular-nums text-foreground">
                      {variant ? getVariantDisplayStock(variant) : photo.stock ?? 0}{' '}
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
                    <PriceWithExVatUnder storedAmount={salePrice}>
                      <DiscountedUnitPrice
                        originalPrice={variant.basePrice}
                        salePrice={salePrice}
                        perUnit="sale-only"
                        stacked={false}
                        originalClassName="text-[11px] text-muted-foreground"
                        saleClassName="text-sm font-semibold tabular-nums"
                      />
                    </PriceWithExVatUnder>
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
  )
}
