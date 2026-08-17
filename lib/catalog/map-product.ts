import {
  formatAvailableFromDisplay,
  resolveDiscountUnitPrice,
} from '@/lib/backstage/variant-pricing'
import { resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { getMinVariantPrice, getPlantMaxDiscountPercent } from '@/lib/product-pricing'
import type { Plant, PriceTier, ProductVariant } from '@/lib/types'

import type {
  CatalogProductDetail,
  CatalogProductListItem,
  CatalogVariantQuantityPrice,
} from './types'

const PLACEHOLDER_IMAGE = '/images/category-placeholder.svg'

function isQuantityPriceActive(row: CatalogVariantQuantityPrice, now = new Date()) {
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

function mapPriceTiers(
  basePrice: number,
  quantityPrices: CatalogVariantQuantityPrice[],
): PriceTier[] {
  return quantityPrices
    .filter((row) => isQuantityPriceActive(row))
    .sort((a, b) => a.minQuantity - b.minQuantity)
    .map((row) => ({
      minQuantity: row.minQuantity,
      pricePerUnit: resolveDiscountUnitPrice(
        basePrice,
        row.discountType ?? 'fixed_price',
        row.value,
      ),
    }))
    .filter((tier) => tier.pricePerUnit > 0 && tier.pricePerUnit < basePrice)
}

function isNewProduct(createdAt: string) {
  const created = new Date(createdAt).getTime()
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  return created >= thirtyDaysAgo
}

function mapCharacteristics(item: CatalogProductListItem) {
  const chars = item.characteristics
  return {
    sunRequirement: (chars.sunRequirement || 'full-sun') as Plant['sunRequirement'],
    soilType: (chars.soilType || 'any') as Plant['soilType'],
    hardinessZone: chars.hardinessZone || '—',
    wateringNeeds: (chars.wateringNeeds || 'moderate') as Plant['wateringNeeds'],
    height: chars.height?.trim() || '—',
  }
}

function mapListVariants(item: CatalogProductListItem): ProductVariant[] {
  return (item.variants ?? []).map((variant) => ({
    id: variant.id,
    ean: variant.ean ?? null,
    sku: variant.sku ?? null,
    label: variant.label?.trim() ?? '',
    stock: variant.stock,
    basePrice: variant.price,
    availableFrom: formatAvailableFromDisplay(variant.availableFrom),
    salesUnitSymbol: variant.salesUnitSymbol ?? null,
    priceTiers: mapPriceTiers(variant.price, variant.quantityPrices ?? []),
    displayAttributes: variant.displayAttributes ?? [],
  }))
}

function mapVariants(item: CatalogProductDetail): ProductVariant[] {
  return item.variants.map((variant) => ({
    id: variant.id,
    ean: variant.ean ?? null,
    sku: variant.sku ?? null,
    label: variant.label?.trim() ?? '',
    stock: variant.stock,
    basePrice: variant.price,
    availableFrom: formatAvailableFromDisplay(variant.availableFrom),
    salesUnitSymbol: variant.salesUnitSymbol ?? null,
    priceTiers: mapPriceTiers(variant.price, variant.quantityPrices ?? []),
    displayAttributes: variant.displayAttributes ?? [],
  }))
}

function resolveImages(item: CatalogProductDetail | CatalogProductListItem): string[] {
  if ('images' in item && item.images.length > 0) {
    return item.images.map((url) => toPublicMediaUrl(url))
  }
  if (item.imageUrl) return [toPublicMediaUrl(item.imageUrl)]
  return [PLACEHOLDER_IMAGE]
}

function resolveListImages(item: CatalogProductListItem): string[] {
  const images = resolveImages(item)
  return images.map((url) => (url === PLACEHOLDER_IMAGE ? url : resolveThumbUrl(url)))
}

function buildShortDescription(description: string | null | undefined) {
  const text = description?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? ''
  if (!text) return ''
  return text.length > 140 ? `${text.slice(0, 137)}…` : text
}

export function mapListItemToPlant(item: CatalogProductListItem): Plant {
  const specs = mapCharacteristics(item)
  const variants = mapListVariants(item)
  const price = variants.length
    ? Math.min(...variants.map((variant) => variant.basePrice))
    : (item.price ?? 0)
  const firstVariant = variants[0]

  return {
    id: item.id,
    name: item.name,
    latinName: item.latinName ?? '',
    slug: item.slug,
    categoryId: item.categoryId,
    category: item.categorySlug,
    price,
    sku: '',
    images: resolveListImages(item),
    description: '',
    shortDescription: '',
    stock: item.stock,
    variants,
    containerSize: (firstVariant?.label || 'C2') as Plant['containerSize'],
    width: '—',
    plantingInstructions: '',
    lightRequirements: '',
    careInstructions: '',
    ...specs,
    isNew: isNewProduct(item.createdAt),
    maxDiscountPercent: item.maxDiscountPercent ?? null,
    createdAt: item.createdAt,
  }
}

export function mapDetailToPlant(item: CatalogProductDetail): Plant {
  const listBase = mapListItemToPlant(item)
  const variants = mapVariants(item)
  const firstVariant = variants[0]
  const minPrice = variants.length
    ? Math.min(...variants.map((variant) => getMinVariantPrice(variant)))
    : listBase.price

  return {
    ...listBase,
    price: minPrice,
    sku: item.variants[0]?.sku ?? '',
    images: resolveImages(item),
    description: item.description ?? '',
    shortDescription: buildShortDescription(item.description),
    stock: item.stock,
    variants,
    maxDiscountPercent: getPlantMaxDiscountPercent({ variants }) ?? listBase.maxDiscountPercent ?? null,
    containerSize: (firstVariant?.label || 'C2') as Plant['containerSize'],
    displayCharacteristics: item.displayCharacteristics ?? [],
    metaTitle: item.metaTitle ?? null,
    metaDesc: item.metaDesc ?? null,
  }
}
