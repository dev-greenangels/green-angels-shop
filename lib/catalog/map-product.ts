import { formatAvailableFromDisplay } from '@/lib/backstage/variant-pricing'
import { stripHtmlToPlainText } from '@/lib/html/plain-text'
import { resolveThumbUrl } from '@/lib/media/paths'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { getMinVariantPrice, getPlantMaxDiscountPercent } from '@/lib/product-pricing'
import type { Plant, PriceTier, ProductVariant } from '@/lib/types'

import type {
  CatalogProductDetail,
  CatalogProductListItem,
  CatalogVariantPriceTier,
} from './types'
import { parseSearchSynonyms } from './search-synonyms'

const PLACEHOLDER_IMAGE = '/images/category-placeholder.svg'

/** Map server-resolved absolute unit prices → storefront PriceTier. */
function mapPriceTiers(rows: CatalogVariantPriceTier[] | undefined): PriceTier[] {
  return (rows ?? [])
    .filter((row) => row.minQuantity > 0 && row.unitPrice > 0)
    .map((row) => ({
      minQuantity: row.minQuantity,
      pricePerUnit: row.unitPrice,
    }))
    .sort((a, b) => a.minQuantity - b.minQuantity)
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
    priceTiers: mapPriceTiers(variant.priceTiers),
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
    priceTiers: mapPriceTiers(variant.priceTiers),
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
  const text = stripHtmlToPlainText(description)
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
    searchSynonyms: parseSearchSynonyms(item.searchSynonyms),
  }
}
