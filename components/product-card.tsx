'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FavoriteButton } from '@/components/favorites/favorite-button'
import { ProductCoverImage } from '@/components/product/product-cover-image'
import { NotifyAvailabilityButton } from '@/components/product/notify-availability-button'
import { NotifyWhenAvailableModal } from '@/components/product/notify-when-available-modal'
import { ProductCardAddToCartDialog } from '@/components/product/product-card-add-to-cart-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import { DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { productHrefFromPlant } from '@/lib/catalog/paths'
import { PRODUCT_CARD_CAROUSEL_WIDTH_CLASS } from '@/lib/catalog/product-card-layout'
import { triggerSelectionHaptic } from '@/lib/haptic'
import { getVisiblePlantVariants } from '@/lib/plant-variants'
import {
  getPlantMaxDiscountPercent,
  getSingleUnitSaleTier,
  getVariantPriceRange,
} from '@/lib/product-pricing'
import { cn } from '@/lib/utils'
import type { Plant } from '@/lib/types'

interface ProductCardProps {
  plant: Plant
  /** carousel — фіксована ширина; grid — розтягується на всю комірку сітки */
  layout?: 'carousel' | 'grid'
}

const productCardSurfaceShadow =
  'shadow-[1px_5px_12px_1px_rgba(45,90,39,0.1),0_2px_8px_rgba(0,0,0,0.14)]'
const productCardSurfaceShadowHover =
  'hover:shadow-[1px_6px_16px_2px_rgba(45,90,39,0.14),0_4px_14px_rgba(0,0,0,0.18)]'
const productCardImageShadow = 'shadow-[1px_1px_10px_1px_rgba(0,0,0,0.38)]'

export function ProductCard({ plant, layout = 'carousel' }: ProductCardProps) {
  const t = useTranslations('product')
  const tc = useTranslations('common')
  const [cartDialogOpen, setCartDialogOpen] = useState(false)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [pressing, setPressing] = useState(false)
  const visibleVariants = getVisiblePlantVariants(plant)
  const singleVariant = visibleVariants.length === 1 ? visibleVariants[0] : null
  const singleUnitSale = singleVariant ? getSingleUnitSaleTier(singleVariant) : null
  const { min: priceMin, max: priceMax } = getVariantPriceRange(visibleVariants)
  const isOutOfStock = visibleVariants.length === 0
  const hasPriceRange = priceMin !== priceMax && !singleUnitSale
  const discountPercent = getPlantMaxDiscountPercent(plant)
  const href = productHrefFromPlant(plant)

  const clearPressing = () => setPressing(false)

  const isGridLayout = layout === 'grid'

  return (
    <div
      className={cn(
        'flex h-full flex-col transition-transform duration-100 ease-out',
        isGridLayout ? 'w-full' : cn('mx-auto', PRODUCT_CARD_CAROUSEL_WIDTH_CLASS),
        pressing && 'scale-[0.985]',
      )}
    >
      <Card
        className={cn(
          'group/card relative flex h-full flex-col gap-0 overflow-hidden rounded-lg border-border/40 py-0',
          productCardSurfaceShadow,
          'select-none transition-[box-shadow,transform] duration-150 ease-out',
          '[-webkit-tap-highlight-color:transparent]',
          pressing ? 'shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : productCardSurfaceShadowHover,
        )}
      >
        <Link
          href={href}
          className="absolute inset-0 z-[1] rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={tc('goToProduct', { name: plant.name })}
          onPointerDown={() => {
            triggerSelectionHaptic()
            setPressing(true)
          }}
          onPointerUp={clearPressing}
          onPointerLeave={clearPressing}
          onPointerCancel={clearPressing}
        />
        <div
          className={cn(
            'pointer-events-none relative aspect-[10/11] overflow-hidden bg-muted',
            productCardImageShadow,
          )}
        >
          <ProductCoverImage
            src={plant.images[0]}
            alt={plant.name}
            sizes={isGridLayout ? '(max-width: 640px) 50vw, 11rem' : '(max-width: 640px) 58vw, 11rem'}
            imageClassName={cn(
              'object-[center_35%] transition-transform duration-100 ease-out',
              pressing ? 'scale-[0.99]' : 'duration-500 group-hover/card:scale-[1.03]',
            )}
          />

          <div className="absolute left-0 top-1 z-[2] flex flex-col items-start gap-0.5">
            {discountPercent ? (
              <Badge variant="destructive" className="px-1 py-0 text-[10px] shadow-sm">
                −{discountPercent}%
              </Badge>
            ) : null}
            {plant.isNew ? (
              <Badge className="bg-primary/95 px-1 py-0 text-[10px] text-primary-foreground shadow-sm">
                {t('newBadge')}
              </Badge>
            ) : null}
          </div>

          <div
            data-card-action
            className="pointer-events-auto absolute bottom-1.5 right-1.5 z-[2]"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <FavoriteButton productId={plant.id} tone="overlay" size="sm" />
          </div>
        </div>

        <CardContent className="pointer-events-none relative z-[2] flex flex-1 flex-col gap-1 px-2.5 pb-2.5 pt-1.5">
          <div className="space-y-0">
            {plant.latinName ? (
              <p className="line-clamp-1 text-[10px] leading-tight italic text-muted-foreground">
                {plant.latinName}
              </p>
            ) : null}
            <h3 className="line-clamp-2 font-sans text-[15px] font-medium leading-[1.32] text-foreground transition-colors duration-150 group-hover/card:text-primary/90">
              {plant.name}
            </h3>
          </div>
          <div className="mt-auto space-y-1.5 border-t border-border/50 pt-1.5">
            {isOutOfStock ? (
              <p className="text-xs font-medium text-muted-foreground">{tc('outOfStock')}</p>
            ) : singleUnitSale && singleVariant ? (
              <DiscountedUnitPrice
                originalPrice={singleVariant.basePrice}
                salePrice={singleUnitSale.pricePerUnit}
                originalClassName="text-[10px]"
                saleClassName="text-xs tabular-nums"
              />
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5 text-muted-foreground">
                <span className="text-[10px]">{t('from')}</span>
                <FormattedPrice
                  amount={priceMin}
                  className="text-xs font-medium tabular-nums text-primary"
                />
                {hasPriceRange ? (
                  <>
                    <span className="text-[10px]">{t('to')}</span>
                    <FormattedPrice
                      amount={priceMax}
                      className="text-xs font-medium tabular-nums text-primary"
                    />
                  </>
                ) : null}
              </p>
            )}

            {isOutOfStock ? (
              <NotifyAvailabilityButton
                compact
                fullWidth
                className="pointer-events-auto relative z-[3] h-8"
                data-card-action
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  event.preventDefault()
                  setNotifyOpen(true)
                }}
              />
            ) : (
              <Button
                type="button"
                variant="default"
                data-card-action
                className={cn(
                  'pointer-events-auto relative z-[3] h-8 w-full gap-1.5 text-xs font-semibold',
                  'border border-primary/70 bg-primary text-primary-foreground',
                  'shadow-[0_4px_16px_rgba(91,148,56,0.35)] backdrop-blur-sm',
                  'supports-[backdrop-filter]:bg-primary/95',
                  'transition-[background-color,box-shadow,transform] duration-150',
                  'hover:bg-primary/92 hover:shadow-[0_6px_20px_rgba(91,148,56,0.42)]',
                  'active:scale-[0.98] active:bg-primary',
                )}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation()
                  setCartDialogOpen(true)
                }}
              >
                <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
                {t('addToCart')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ProductCardAddToCartDialog
        plant={plant}
        open={cartDialogOpen}
        onOpenChange={setCartDialogOpen}
      />

      <NotifyWhenAvailableModal
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        plantId={plant.id}
        plantName={plant.name}
      />
    </div>
  )
}
