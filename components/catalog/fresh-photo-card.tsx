'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FormattedPrice } from '@/components/commerce/formatted-price'
import { ProductCardAddToCartDialog } from '@/components/product/product-card-add-to-cart-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import { resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { resolveFreshPhotoThumbUrl } from '@/lib/variant-photos/fresh-photo-urls'
import { PRODUCT_PLACEHOLDER_IMAGE } from '@/lib/product-image'
import { getMinVariantPrice } from '@/lib/product-pricing'
import { cn } from '@/lib/utils'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import {
  catalogPhotoToPlant,
  catalogPhotoToVariant,
  getPhotoTakenAt,
  photoProductHref,
} from '@/lib/variant-photos/fresh-photo-card'

const SIDEBAR_WIDTH = '7.25rem'

function formatCompactPhotoDate(value: string | null | undefined, locale: string) {
  if (!value?.trim()) return null
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
    }).format(date)
  } catch {
    return value
  }
}

type FreshPhotoCardProps = {
  photo: CatalogPhotoItem
  locale: string
  className?: string
  /** Click on the nursery photo (lightbox). */
  onImageClick?: () => void
}

export function FreshPhotoCard({
  photo,
  locale,
  className,
  onImageClick,
}: FreshPhotoCardProps) {
  const t = useTranslations('catalog')
  const tProduct = useTranslations('product')
  const [cartDialogOpen, setCartDialogOpen] = useState(false)

  const numberLocale = intlLocaleForApp(locale)
  const productName = photo.productName || photo.appProperties.plantName || photo.ean
  const variantLabel = photo.variantLabel || photo.appProperties.plantSize || null
  const photoDate = formatCompactPhotoDate(getPhotoTakenAt(photo), numberLocale)
  const productLink = photoProductHref(photo)
  const variant = catalogPhotoToVariant(photo)
  const plant = catalogPhotoToPlant(photo)
  const displayPrice =
    variant && variant.basePrice > 0 ? getMinVariantPrice(variant) : photo.price
  const discountPercent =
    variant && variant.basePrice > 0 && displayPrice != null && displayPrice < variant.basePrice - 0.001
      ? Math.round((1 - displayPrice / variant.basePrice) * 100)
      : null

  const productThumbSrc = photo.productImageUrl
    ? toPublicMediaUrl(resolveThumbUrl(photo.productImageUrl))
    : PRODUCT_PLACEHOLDER_IMAGE

  const canOpenCart = Boolean(plant)

  const mediaOverlays = (
    <>
      {discountPercent ? (
        <Badge
          variant="destructive"
          className="absolute left-2 top-2 z-[1] px-1.5 py-0 text-[10px] shadow-sm"
        >
          −{discountPercent}%
        </Badge>
      ) : null}

      {displayPrice != null && displayPrice > 0 ? (
        <FormattedPrice
          amount={displayPrice}
          className="pointer-events-none absolute bottom-2 left-2 z-[1] text-sm font-semibold tabular-nums text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.75)]"
        />
      ) : null}

      {photoDate ? (
        <span className="pointer-events-none absolute bottom-2 right-2 z-[1] inline-flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
          <Camera className="h-2.5 w-2.5 shrink-0 opacity-90" aria-hidden />
          <span className="whitespace-nowrap">
            {t('freshPhotosPhotoFrom')} {photoDate}
          </span>
        </span>
      ) : null}
    </>
  )

  const mediaImage = (
    <Image
      src={resolveFreshPhotoThumbUrl(photo)}
      alt={productName}
      fill
      unoptimized
      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      sizes="(max-width: 768px) 55vw, 14rem"
    />
  )

  return (
    <>
      <article
        className={cn(
          'group flex min-h-[13.5rem] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm sm:min-h-[14.5rem]',
          className,
        )}
      >
        <div className="relative min-h-full min-w-0 flex-1 self-stretch bg-muted">
          {onImageClick ? (
            <button
              type="button"
              className="absolute inset-0 block text-left"
              onClick={onImageClick}
              aria-label={productName}
            >
              {mediaImage}
              {mediaOverlays}
            </button>
          ) : productLink ? (
            <Link href={productLink} className="absolute inset-0 block">
              {mediaImage}
              {mediaOverlays}
            </Link>
          ) : (
            <div className="absolute inset-0">
              {mediaImage}
              {mediaOverlays}
            </div>
          )}
        </div>

        <div
          className="relative z-[1] flex shrink-0 flex-col border-l border-border/40 bg-card p-2.5"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg border border-border/50 bg-muted">
            {productLink ? (
              <Link href={productLink} className="absolute inset-0">
                <Image
                  src={productThumbSrc}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="116px"
                />
              </Link>
            ) : (
              <Image
                src={productThumbSrc}
                alt={productName}
                fill
                className="object-cover"
                sizes="116px"
              />
            )}
          </div>

          {productLink ? (
            <Link
              href={productLink}
              className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground transition-colors hover:text-primary"
            >
              {productName}
            </Link>
          ) : (
            <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
              {productName}
            </p>
          )}

          {variantLabel ? (
            <p className="mt-1 truncate text-[10px] text-muted-foreground">{variantLabel}</p>
          ) : null}

          <div className="mt-auto border-t border-border/40 pt-2">
            <Button
              type="button"
              size="sm"
              disabled={!canOpenCart && !onImageClick}
              className="h-8 w-full gap-1 px-2 text-xs font-semibold"
              onClick={() => {
                if (canOpenCart) {
                  setCartDialogOpen(true)
                  return
                }
                onImageClick?.()
              }}
            >
              <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{tProduct('addToCart')}</span>
            </Button>
          </div>
        </div>
      </article>

      {plant ? (
        <ProductCardAddToCartDialog
          plant={plant}
          open={cartDialogOpen}
          onOpenChange={setCartDialogOpen}
        />
      ) : null}
    </>
  )
}

export function FreshPhotoCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        'flex min-h-[13.5rem] overflow-hidden rounded-2xl border border-border/50 bg-card/70 sm:min-h-[14.5rem]',
        className,
      )}
    >
      <div className="min-w-0 flex-1 self-stretch animate-pulse bg-muted" />
      <div
        className="flex shrink-0 flex-col gap-2 border-l border-border/40 p-2.5"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-auto h-8 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </article>
  )
}
