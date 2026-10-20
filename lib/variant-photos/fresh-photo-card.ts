import { formatAvailableFromDisplay } from '@/lib/backstage/variant-pricing'
import { productHref } from '@/lib/catalog/paths'
import { intlLocaleForApp } from '@/lib/i18n/intl-locale'
import type { Plant, PriceTier, ProductVariant } from '@/lib/types'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import { resolveFreshPhotoThumbUrl } from '@/lib/variant-photos/fresh-photo-urls'

/** Map server priceTiers when present; otherwise empty (shelf provider overlays wholesale). */
function mapPhotoPriceTiers(
  rows: CatalogPhotoItem['priceTiers'] | undefined,
): PriceTier[] {
  return (rows ?? [])
    .filter((row) => row.minQuantity > 0 && row.unitPrice > 0)
    .map((row) => ({
      minQuantity: row.minQuantity,
      pricePerUnit: row.unitPrice,
    }))
    .sort((a, b) => a.minQuantity - b.minQuantity)
}

export function getPhotoTakenAt(photo: Pick<CatalogPhotoItem, 'appProperties' | 'createdAt'>): string | null {
  return photo.appProperties.date?.trim() || photo.createdAt || null
}

/**
 * Fresh Photos calendar date — interpret the stored instant in UTC so SSR
 * (Vercel) and the browser hydrate to the same label regardless of TZ.
 */
export function formatFreshPhotoDate(
  value: string | null | undefined,
  locale: string,
  options?: { includeYear?: boolean },
): string | null {
  if (!value?.trim()) return null
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const includeYear = options?.includeYear !== false
    return new Intl.DateTimeFormat(intlLocaleForApp(locale), {
      day: 'numeric',
      month: 'short',
      ...(includeYear ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    }).format(date)
  } catch {
    return value
  }
}

/** Compact overlay date (homepage card) — UTC calendar day, no year. */
export function formatFreshPhotoDateCompact(
  value: string | null | undefined,
  locale: string,
): string | null {
  return formatFreshPhotoDate(value, locale, { includeYear: false })
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
    priceTiers: mapPhotoPriceTiers(photo.priceTiers),
    availableFrom: formatAvailableFromDisplay(photo.availableFrom),
  }
}

/**
 * Storefront display name: catalog translation for the active locale first.
 * UA nursery `plantName` metadata is only a fallback on `uk`.
 */
export function resolveFreshPhotoDisplayName(
  photo: Pick<CatalogPhotoItem, 'productName' | 'ean' | 'appProperties'>,
  locale: string,
  fallback = '—',
): string {
  const productName = photo.productName?.trim()
  if (productName) return productName
  if (locale === 'uk') {
    const plantName = photo.appProperties.plantName?.trim()
    if (plantName) return plantName
  }
  const ean = photo.ean?.trim()
  if (ean) return ean
  return fallback
}

export function catalogPhotoToPlant(
  photo: CatalogPhotoItem,
  options: { locale: string; fallbackName?: string },
): Plant | null {
  if (!photo.productId || !photo.productSlug) return null
  const variant = catalogPhotoToVariant(photo)
  return {
    id: photo.productId,
    name: resolveFreshPhotoDisplayName(photo, options.locale, options.fallbackName ?? photo.ean),
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
