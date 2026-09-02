import { getMinVariantPrice } from '@/lib/product-pricing'
import type { Plant, ProductVariant } from '@/lib/types'

import type { PublicCommerceSettings } from '@/lib/commerce/types'
import type { CountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import { resolveSeoOffer } from '@/lib/seo/offer-context'
import { toProductSeoEntity } from '@/lib/seo/product-entity'
import {
  absoluteCatalogImages,
  buildProductJsonLd,
  gtinSchemaFields,
  type ProductJsonLdOfferInput,
} from '@/lib/seo/product-json-ld'
import {
  collectProductVariesBy,
  productGroupId,
  variantDisplayName,
  variantSchemaProperties,
  variantSeoAvailability,
} from '@/lib/seo/variant-json-ld'
import type { MarketSettings } from '@/lib/settings/market'

export type ProductStructuredDataContext = {
  market: MarketSettings
  overlay: CountrySiteOverlay | null
  commerce: PublicCommerceSettings
  cartTaxRatePercent: number
}

const AVAILABILITY_URL: Record<
  NonNullable<ReturnType<typeof variantSeoAvailability>>,
  string
> = {
  in_stock: 'https://schema.org/InStock',
  out_of_stock: 'https://schema.org/OutOfStock',
  preorder: 'https://schema.org/PreOrder',
}

function buildVariantOfferNode(
  variant: ProductVariant,
  productUrl: string,
  ctx: ProductStructuredDataContext,
): Record<string, unknown> | null {
  const stored = getMinVariantPrice(variant)
  const shelf = resolveSeoOffer(stored, ctx)
  if (!shelf || shelf.price <= 0) return null

  const availability = variantSeoAvailability(variant)
  return {
    '@type': 'Offer',
    url: productUrl,
    price: shelf.price,
    priceCurrency: shelf.currency,
    availability: AVAILABILITY_URL[availability],
    itemCondition: 'https://schema.org/NewCondition',
  }
}

function productJsonLdImageValue(images: string[]): string | string[] | undefined {
  if (images.length === 0) return undefined
  return images.length === 1 ? images[0] : images
}

function buildVariantProductNode(
  plant: Plant,
  variant: ProductVariant,
  productUrl: string,
  ctx: ProductStructuredDataContext,
  images: string[],
): Record<string, unknown> {
  const name = variantDisplayName(plant.name, variant)
  const offer = buildVariantOfferNode(variant, productUrl, ctx)
  const sku = variant.sku?.trim() || undefined
  const gtinFields = gtinSchemaFields(variant.ean)
  const image = productJsonLdImageValue(images)

  return {
    '@type': 'Product',
    name,
    ...(image ? { image } : {}),
    ...(sku ? { sku } : {}),
    ...(gtinFields ?? {}),
    ...variantSchemaProperties(variant),
    ...(offer ? { offers: offer } : {}),
  }
}

export function buildProductGroupJsonLd(input: {
  plant: Plant
  productUrl: string
  brand: string
  images?: string[]
  latinName?: string | null
  alternateNames?: string[]
  description?: string
  ctx: ProductStructuredDataContext
}): Record<string, unknown> | null {
  const productUrl = input.productUrl.trim()
  const name = input.plant.name?.trim()
  if (!productUrl || !name) return null

  const variants = input.plant.variants ?? []
  if (variants.length <= 1) return null

  const images = absoluteCatalogImages(
    input.images?.length ? input.images : input.plant.images,
  )

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    name,
    url: productUrl,
    productGroupID: productGroupId(input.plant),
    variesBy: collectProductVariesBy(variants),
    hasVariant: variants.map((variant) =>
      buildVariantProductNode(input.plant, variant, productUrl, input.ctx, images),
    ),
  }

  const description =
    input.description?.trim() ||
    input.plant.shortDescription?.trim() ||
    input.plant.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (description) schema.description = description

  const image = productJsonLdImageValue(images)
  if (image) {
    schema.image = image
  }

  if (input.brand.trim()) {
    schema.brand = { '@type': 'Brand', name: input.brand.trim() }
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

  return schema
}

export function buildProductStructuredData(input: {
  plant: Plant
  productUrl: string
  locale: string
  brand: string
  images?: string[]
  latinName?: string | null
  alternateNames?: string[]
  ctx: ProductStructuredDataContext
}): Record<string, unknown> | null {
  const productUrl = input.productUrl.trim()
  if (!productUrl) return null

  const variants = input.plant.variants ?? []

  if (variants.length > 1) {
    return buildProductGroupJsonLd({
      plant: input.plant,
      productUrl,
      brand: input.brand,
      images: input.images,
      latinName: input.latinName,
      alternateNames: input.alternateNames,
      ctx: input.ctx,
    })
  }

  const singleVariant = variants[0]
  const entity = toProductSeoEntity({
    plant: input.plant,
    url: productUrl,
    locale: input.locale,
    brand: input.brand,
  })

  if (singleVariant) {
    entity.sku = singleVariant.sku?.trim() || entity.sku
    entity.availability = variantSeoAvailability(singleVariant)
  }

  let offer: ProductJsonLdOfferInput | null = null
  if (singleVariant) {
    const shelf = resolveSeoOffer(getMinVariantPrice(singleVariant), input.ctx)
    if (shelf && shelf.price > 0) {
      offer = {
        lowPrice: shelf.price,
        highPrice: shelf.price,
        currency: shelf.currency,
        offerCount: 1,
      }
    }
  } else if (input.plant.price > 0) {
    const shelf = resolveSeoOffer(input.plant.price, input.ctx)
    if (shelf && shelf.price > 0) {
      offer = {
        lowPrice: shelf.price,
        highPrice: shelf.price,
        currency: shelf.currency,
        offerCount: 1,
      }
    }
  }

  return buildProductJsonLd({
    entity,
    images: input.images,
    ean: singleVariant?.ean ?? null,
    latinName: input.latinName,
    alternateNames: input.alternateNames,
    offer,
  })
}
