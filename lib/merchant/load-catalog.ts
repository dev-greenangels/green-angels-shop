import { getBackendApiUrl } from '@/lib/api/backend-url'
import { isReservedPublicSegment } from '@/lib/catalog/paths'

import {
  MERCHANT_MAX_PRODUCT_PAGES,
  MERCHANT_PRODUCT_PAGE_SIZE,
  type MerchantFeedConfig,
} from './feeds'
import type { MerchantCatalogProduct } from './types'

async function fetchJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${getBackendApiUrl()}${path}`, {
      // Feed must see fresh price/stock/images; route is force-dynamic.
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function mapRow(row: Record<string, unknown>): MerchantCatalogProduct | null {
  const id = typeof row.id === 'string' ? row.id.trim() : ''
  const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
  const name = typeof row.name === 'string' ? row.name.trim() : ''
  const categorySlug = typeof row.categorySlug === 'string' ? row.categorySlug.trim() : ''
  if (!id || !slug || !categorySlug || isReservedPublicSegment(categorySlug)) return null

  const variantsRaw = Array.isArray(row.variants) ? row.variants : []
  const variants = variantsRaw
    .map((variant) => {
      if (!variant || typeof variant !== 'object') return null
      const v = variant as Record<string, unknown>
      const variantId = typeof v.id === 'string' ? v.id.trim() : ''
      if (!variantId) return null
      return {
        id: variantId,
        sku: typeof v.sku === 'string' ? v.sku : null,
        label: typeof v.label === 'string' ? v.label : null,
        stock: Number(v.stock) || 0,
        price: Number(v.price) || 0,
        displayAttributes: Array.isArray(v.displayAttributes)
          ? v.displayAttributes
              .map((attr) => {
                if (!attr || typeof attr !== 'object') return null
                const a = attr as Record<string, unknown>
                const attrName = typeof a.name === 'string' ? a.name : ''
                const displayValue = typeof a.displayValue === 'string' ? a.displayValue : ''
                if (!attrName || !displayValue) return null
                return {
                  name: attrName,
                  displayValue,
                  valueType: typeof a.valueType === 'string' ? a.valueType : undefined,
                }
              })
              .filter((attr): attr is NonNullable<typeof attr> => Boolean(attr))
          : [],
      }
    })
    .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant))

  const images = Array.isArray(row.images)
    ? row.images.filter((url): url is string => typeof url === 'string' && Boolean(url.trim()))
    : []

  return {
    id,
    slug,
    name,
    latinName: typeof row.latinName === 'string' ? row.latinName : null,
    categorySlug,
    categoryName: typeof row.categoryName === 'string' ? row.categoryName : categorySlug,
    description: typeof row.description === 'string' ? row.description : null,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
    images,
    isPublished: row.isPublished === false ? false : true,
    variants,
  }
}

export async function loadMerchantCatalogPage(
  feed: MerchantFeedConfig,
  page: number,
): Promise<{ products: MerchantCatalogProduct[]; totalPages: number }> {
  const params = new URLSearchParams({
    locale: feed.locale,
    published: 'true',
    page: String(page),
    pageSize: String(MERCHANT_PRODUCT_PAGE_SIZE),
    merchant: '1',
  })
  const data = (await fetchJson(`/products?${params}`)) as {
    items?: Array<Record<string, unknown>>
    totalPages?: number
  } | null

  if (!data?.items) return { products: [], totalPages: 0 }

  const products = data.items
    .map((row) => mapRow(row))
    .filter((row): row is MerchantCatalogProduct => Boolean(row))

  return {
    products,
    totalPages: Math.min(MERCHANT_MAX_PRODUCT_PAGES, Math.max(0, data.totalPages ?? 0)),
  }
}

export async function loadAllMerchantCatalogProducts(
  feed: MerchantFeedConfig,
): Promise<MerchantCatalogProduct[]> {
  const first = await loadMerchantCatalogPage(feed, 1)
  const pages = Math.max(first.totalPages, first.products.length ? 1 : 0)
  const all = [...first.products]
  for (let page = 2; page <= pages; page += 1) {
    const chunk = await loadMerchantCatalogPage(feed, page)
    all.push(...chunk.products)
  }
  return all
}
