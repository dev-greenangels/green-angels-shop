import {
  formatAvailableFromDisplay,
  resolveDiscountUnitPrice,
} from '@/lib/backstage/variant-pricing'
import { productHref } from '@/lib/catalog/paths'
import type { Plant, PriceTier, ProductVariant } from '@/lib/types'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import { resolveFreshPhotoThumbUrl } from '@/lib/variant-photos/fresh-photo-urls'

type QuantityPriceRow = NonNullable<CatalogPhotoItem['quantityPrices']>[number]

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

export function getPhotoTakenAt(photo: Pick<CatalogPhotoItem, 'appProperties' | 'createdAt'>): string | null {
  return photo.appProperties.date?.trim() || photo.createdAt || null
}

export function formatFreshPhotoDate(value: string | null | undefined, locale: string) {
  if (!value?.trim()) return null
  try {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(value),
    )
  } catch {
    return value
  }
}

export function photoProductHref(photo: CatalogPhotoItem): string | null {
  if (photo.productSlug && photo.categorySlug) {
    return productHref(photo.categorySlug, photo.productSlug)
  }
  if (photo.productSlug) return `/product/${photo.productSlug}`
  return null
}

export function catalogPhotoToVariant(photo: CatalogPhotoItem): ProductVariant | null {
  if (!photo.variantId) return null
  const basePrice = photo.price ?? 0
  return {
    id: photo.variantId,
    ean: photo.ean,
    label: photo.variantLabel || photo.appProperties.plantSize || '',
    stock: photo.stock ?? 0,
    basePrice,
    priceTiers: mapPhotoPriceTiers(basePrice, photo.quantityPrices ?? []),
    availableFrom: formatAvailableFromDisplay(photo.availableFrom),
  }
}

export function catalogPhotoToPlant(photo: CatalogPhotoItem): Plant | null {
  if (!photo.productId || !photo.productSlug) return null
  const variant = catalogPhotoToVariant(photo)
  return {
    id: photo.productId,
    name: photo.productName || photo.appProperties.plantName || 'Товар',
    latinName: '',
    slug: photo.productSlug,
    category: photo.categorySlug || '',
    price: photo.price ?? 0,
    sku: '',
    images: [resolveFreshPhotoThumbUrl(photo)],
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
