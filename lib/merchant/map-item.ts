import { productHref } from '@/lib/catalog/paths'
import { localePath } from '@/lib/locale-path'
import type { SeoOfferContext } from '@/lib/seo/offer-context'
import { variantDisplayName } from '@/lib/seo/variant-json-ld'
import type { AppLocale } from '@/i18n/routing'

import {
  GOOGLE_PRODUCT_CATEGORY_PLANTS,
  MERCHANT_BRAND,
  type MerchantFeedConfig,
} from './feeds'
import {
  evaluateMerchantCatalog,
  evaluateMerchantVariant,
  type MerchantDiagCounters,
} from './evaluate'
import { stripHtmlToPlainText } from './eligibility'
import type {
  MerchantCatalogProduct,
  MerchantFeedItem,
  MerchantVariantOption,
} from './types'

const TITLE_MAX = 150
const DESCRIPTION_MAX = 5000

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

export function buildMerchantTitle(input: {
  name: string
  latinName?: string | null
  variantLabel?: string | null
}): string {
  const name = input.name.trim()
  const latin = input.latinName?.trim() || ''
  const withLatin =
    latin && !name.toLowerCase().includes(latin.toLowerCase()) ? `${name} (${latin})` : name
  const title = variantDisplayName(withLatin, {
    id: '',
    label: input.variantLabel?.trim() || '',
    stock: 0,
    basePrice: 0,
    priceTiers: [],
  })
  return truncate(title, TITLE_MAX)
}

export function buildMerchantDescription(input: {
  descriptionHtml?: string | null
  name: string
  latinName?: string | null
}): string {
  const fromHtml = stripHtmlToPlainText(input.descriptionHtml)
  if (fromHtml) return truncate(fromHtml, DESCRIPTION_MAX)
  const name = input.name.trim()
  const latin = input.latinName?.trim()
  const fallback = latin ? `${name}. ${latin}` : name
  return truncate(fallback, DESCRIPTION_MAX)
}

export function formatMerchantPrice(offer: SeoOfferContext): string {
  const amount = offer.price
  const formatted =
    offer.currency === 'HUF'
      ? String(Math.round(amount))
      : amount.toFixed(2)
  return `${formatted} ${offer.currency}`
}

/** Absolute PDP URL with Merchant variant deep-link (`?variant=<SKU>`). */
export function buildMerchantVariantLink(input: {
  origin: string
  locale: AppLocale
  categorySlug: string
  productSlug: string
  sku: string
}): string {
  const path = localePath(
    productHref(input.categorySlug, input.productSlug),
    input.locale,
  )
  return `${input.origin.replace(/\/$/, '')}${path}?variant=${encodeURIComponent(input.sku)}`
}

function variantOptionsFor(
  variant: MerchantCatalogProduct['variants'][number],
): MerchantVariantOption[] {
  const fromAttrs = (variant.displayAttributes ?? [])
    .map((attr) => ({
      name: attr.name.trim(),
      value: attr.displayValue.trim(),
    }))
    .filter((opt) => opt.name && opt.value)

  if (fromAttrs.length) return fromAttrs.slice(0, 30)

  const label = variant.label?.trim()
  if (label) return [{ name: 'Variant', value: label }]
  return []
}

export function mapProductToMerchantItems(input: {
  product: MerchantCatalogProduct
  feed: MerchantFeedConfig
  origin: string
  resolveOffer: (storedPrice: number) => SeoOfferContext | null
  siteUrl?: string | null
}): { items: MerchantFeedItem[]; stats: MerchantDiagCounters } {
  const { product, feed, origin, resolveOffer, siteUrl } = input
  const evalOpts = { siteUrl, resolveOffer }
  const stats = evaluateMerchantCatalog([product], evalOpts).counters
  const description = buildMerchantDescription({
    descriptionHtml: product.description,
    name: product.name,
    latinName: product.latinName,
  })
  const productType = product.categoryName?.trim() || null
  const items: MerchantFeedItem[] = []

  for (const variant of product.variants) {
    const ev = evaluateMerchantVariant(product, variant, evalOpts)
    if (ev.decision !== 'included' || !ev.sku) continue

    const offer = resolveOffer(variant.price)
    if (!offer || offer.price <= 0) continue

    const [imageLink, ...additionalImageLinks] = ev.absoluteImages
    if (!imageLink) continue

    items.push({
      id: ev.sku,
      mpn: ev.sku,
      itemGroupId: product.id,
      title: buildMerchantTitle({
        name: product.name,
        latinName: product.latinName,
        variantLabel: variant.label,
      }),
      description,
      link: buildMerchantVariantLink({
        origin,
        locale: feed.locale as AppLocale,
        categorySlug: product.categorySlug,
        productSlug: product.slug,
        sku: ev.sku,
      }),
      imageLink,
      additionalImageLinks: additionalImageLinks.slice(0, 10),
      availability: 'in_stock',
      price: formatMerchantPrice(offer),
      condition: 'new',
      brand: MERCHANT_BRAND,
      googleProductCategory: GOOGLE_PRODUCT_CATEGORY_PLANTS,
      productType,
      variantOptions: variantOptionsFor(variant),
    })
  }

  return { items, stats }
}
