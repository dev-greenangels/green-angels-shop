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

export function buildProductJsonLd(input: {
  entity: ProductSeoEntity
  images?: string[]
  gtin?: string | null
  latinName?: string | null
  offer?: { price: number; currency: string } | null
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
    ...(input.gtin ? { gtin: input.gtin } : {}),
    ...(input.entity.brand ? { brand: { '@type': 'Brand', name: input.entity.brand } } : {}),
  }

  if (input.latinName?.trim()) {
    schema.additionalProperty = {
      '@type': 'PropertyValue',
      name: 'botanicalName',
      value: input.latinName.trim(),
    }
  }

  if (input.offer && input.offer.price > 0 && input.offer.currency) {
    schema.offers = {
      '@type': 'Offer',
      url,
      price: input.offer.price,
      priceCurrency: input.offer.currency,
      availability: input.entity.availability
        ? AVAILABILITY[input.entity.availability]
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    }
  }

  return schema
}
