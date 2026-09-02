import { isProductPlaceholderImage } from '@/lib/product-image'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import type { ProductSeoEntity } from '@/lib/seo/product-entity'

const AVAILABILITY: Record<NonNullable<ProductSeoEntity['availability']>, string> = {
  in_stock: 'https://schema.org/InStock',
  out_of_stock: 'https://schema.org/OutOfStock',
  preorder: 'https://schema.org/PreOrder',
}

export function gtinFromEan(ean: string | null | undefined): string | null {
  const digits = (ean ?? '').replace(/\D/g, '')
  if (digits.length >= 8 && digits.length <= 14) return digits
  return null
}

/** Map valid EAN digits to the appropriate Schema.org GTIN property. */
export function gtinSchemaFields(ean: string | null | undefined): Record<string, string> | null {
  const digits = gtinFromEan(ean)
  if (!digits) return null
  if (digits.length === 14) return { gtin14: digits }
  if (digits.length === 13) return { gtin13: digits }
  if (digits.length === 12) return { gtin12: digits }
  if (digits.length === 8) return { gtin8: digits }
  return { gtin: digits }
}

export function absoluteCatalogImages(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    const url = toPublicMediaUrl(raw)
    if (!url || isProductPlaceholderImage(url) || seen.has(url)) continue
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

export type ProductJsonLdOfferInput = {
  lowPrice: number
  highPrice: number
  currency: string
  offerCount?: number
}

function buildOffersNode(
  url: string,
  availability: ProductSeoEntity['availability'],
  offer: ProductJsonLdOfferInput,
): Record<string, unknown> {
  const availabilityUrl = availability
    ? AVAILABILITY[availability]
    : 'https://schema.org/OutOfStock'
  const shared = {
    url,
    priceCurrency: offer.currency,
    availability: availabilityUrl,
    itemCondition: 'https://schema.org/NewCondition',
  }

  if (offer.lowPrice === offer.highPrice) {
    return {
      '@type': 'Offer',
      ...shared,
      price: offer.lowPrice,
    }
  }

  return {
    '@type': 'AggregateOffer',
    ...shared,
    lowPrice: offer.lowPrice,
    highPrice: offer.highPrice,
    offerCount: offer.offerCount ?? undefined,
  }
}

export function buildProductJsonLd(input: {
  entity: ProductSeoEntity
  images?: string[]
  ean?: string | null
  latinName?: string | null
  alternateNames?: string[]
  offer?: ProductJsonLdOfferInput | null
}): Record<string, unknown> | null {
  const name = input.entity.name?.trim()
  const url = input.entity.url?.trim()
  if (!name || !url) return null

  const images = (input.images?.length ? input.images : input.entity.image ? [input.entity.image] : [])
    .map((item) => toPublicMediaUrl(item))
    .filter((item) => item && !isProductPlaceholderImage(item))

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url,
    ...(input.entity.description ? { description: input.entity.description } : {}),
    ...(images.length ? { image: images.length === 1 ? images[0] : images } : {}),
    ...(input.entity.sku ? { sku: input.entity.sku } : {}),
    ...(gtinSchemaFields(input.ean) ?? {}),
    ...(input.entity.brand ? { brand: { '@type': 'Brand', name: input.entity.brand } } : {}),
  }

  if (input.latinName?.trim()) {
    schema.additionalProperty = {
      '@type': 'PropertyValue',
      name: 'botanicalName',
      value: input.latinName.trim(),
    }
  }

  const alternateNames = (input.alternateNames ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
  if (alternateNames.length > 0) {
    schema.alternateName = alternateNames.length === 1 ? alternateNames[0] : alternateNames
  }

  if (
    input.offer &&
    input.offer.currency &&
    input.offer.lowPrice > 0 &&
    input.offer.highPrice > 0
  ) {
    schema.offers = buildOffersNode(url, input.entity.availability, input.offer)
  }

  return schema
}
