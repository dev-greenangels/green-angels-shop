import { getBackendApiUrl } from '@/lib/api/backend-url'
import {
  availableResult,
  type FetchResult,
  ProductNotFoundError,
  unavailableResult,
} from '@/lib/api/fetch-result'
import type { Plant } from '@/lib/types'

import { CATALOG_PAGE_SIZE } from './constants'
import { mapDetailToPlant, mapListItemToPlant } from './map-product'
import type { CatalogProductDetail, CatalogProductListItem } from './types'

import { defaultLocale, isAppLocale } from '@/i18n/routing'

export type CatalogProductsParams = {
  locale?: string
  categoryId?: string
  categorySlug?: string
  search?: string
  stock?: 'in_stock' | 'out_of_stock'
  excludeId?: string
  ids?: string[]
  characteristics?: string
  variantAttributes?: string
  priceMin?: string
  priceMax?: string
  limit?: number
  page?: number
  pageSize?: number
  sort?: string
  lowStockThreshold?: number
  hasDiscount?: boolean
  discountMinQuantity?: number
  discountQuantityMode?: 'gte' | 'exact'
  namePrefix?: string
}

export type CatalogProductsPageMeta = {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type CatalogProductsPageResult = {
  plants: Plant[]
  meta: CatalogProductsPageMeta
}

type PaginatedCatalogResponse = {
  items: CatalogProductListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const EMPTY_PAGE_RESULT: CatalogProductsPageResult = {
  plants: [],
  meta: {
    total: 0,
    page: 1,
    pageSize: CATALOG_PAGE_SIZE,
    totalPages: 0,
  },
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

function isPaginatedResponse(data: unknown): data is PaginatedCatalogResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedCatalogResponse).items)
  )
}

function buildProductsQuery(params: CatalogProductsParams = {}) {
  const locale =
    params.locale && isAppLocale(params.locale) ? params.locale : defaultLocale
  const query = new URLSearchParams({ locale, published: 'true' })
  if (params.categoryId) query.set('categoryId', params.categoryId)
  if (params.categorySlug) query.set('categorySlug', params.categorySlug)
  if (params.search) query.set('search', params.search)
  if (params.stock) query.set('stock', params.stock)
  if (params.excludeId) query.set('excludeId', params.excludeId)
  if (params.ids?.length) query.set('ids', params.ids.join(','))
  if (params.characteristics) query.set('characteristics', params.characteristics)
  if (params.variantAttributes) query.set('variantAttributes', params.variantAttributes)
  if (params.priceMin) query.set('priceMin', params.priceMin)
  if (params.priceMax) query.set('priceMax', params.priceMax)
  if (params.page != null) query.set('page', String(params.page))
  if (params.pageSize != null) query.set('pageSize', String(params.pageSize))
  if (params.sort) query.set('sort', params.sort)
  if (params.lowStockThreshold != null) {
    query.set('lowStockThreshold', String(params.lowStockThreshold))
  }
  if (params.hasDiscount != null) {
    query.set('hasDiscount', String(params.hasDiscount))
  }
  if (params.discountMinQuantity != null) {
    query.set('discountMinQuantity', String(params.discountMinQuantity))
  }
  if (params.discountQuantityMode) {
    query.set('discountQuantityMode', params.discountQuantityMode)
  }
  if (params.namePrefix) query.set('namePrefix', params.namePrefix)
  return query
}

function toPageResult(
  data: PaginatedCatalogResponse,
  requestedPage: number,
  pageSize: number,
): CatalogProductsPageResult {
  return {
    plants: data.items.map(mapListItemToPlant),
    meta: {
      total: data.total,
      page: data.page ?? requestedPage,
      pageSize: data.pageSize ?? pageSize,
      totalPages: data.totalPages ?? Math.max(1, Math.ceil(data.total / pageSize)),
    },
  }
}

async function fetchPageFromBackend(
  params: CatalogProductsParams & { page: number; pageSize: number },
): Promise<CatalogProductsPageResult> {
  const query = buildProductsQuery(params)
  const res = await fetch(`${getBackendApiUrl()}/products?${query}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()

  if (isPaginatedResponse(data)) {
    return toPageResult(data, params.page, params.pageSize)
  }

  const rows = data as CatalogProductListItem[]
  const sliced = params.limit ? rows.slice(0, params.limit) : rows
  const total = sliced.length
  return {
    plants: sliced.map(mapListItemToPlant),
    meta: {
      total,
      page: 1,
      pageSize: params.pageSize,
      totalPages: 1,
    },
  }
}

async function fetchPageFromApiRoute(
  params: CatalogProductsParams & { page: number; pageSize: number },
): Promise<CatalogProductsPageResult> {
  const query = buildProductsQuery(params)
  const res = await fetch(`/api/catalog/products?${query}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()

  if (isPaginatedResponse(data)) {
    return toPageResult(data, params.page, params.pageSize)
  }

  const rows = data as CatalogProductListItem[]
  const sliced = params.limit ? rows.slice(0, params.limit) : rows
  const total = sliced.length
  return {
    plants: sliced.map(mapListItemToPlant),
    meta: {
      total,
      page: 1,
      pageSize: params.pageSize,
      totalPages: 1,
    },
  }
}

async function fetchListFromBackend(
  params: CatalogProductsParams = {},
): Promise<CatalogProductListItem[]> {
  const query = buildProductsQuery(params)
  const res = await fetch(`${getBackendApiUrl()}/products?${query}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  const rows = isPaginatedResponse(data) ? data.items : (data as CatalogProductListItem[])
  return params.limit ? rows.slice(0, params.limit) : rows
}

async function fetchListFromApiRoute(
  params: CatalogProductsParams = {},
): Promise<CatalogProductListItem[]> {
  const query = buildProductsQuery(params)
  const res = await fetch(`/api/catalog/products?${query}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = await res.json()
  const rows = isPaginatedResponse(data) ? data.items : (data as CatalogProductListItem[])
  return params.limit ? rows.slice(0, params.limit) : rows
}

async function fetchDetailFromBackend(slug: string, locale?: string): Promise<CatalogProductDetail> {
  const loc = locale && isAppLocale(locale) ? locale : defaultLocale
  const query = new URLSearchParams({ locale: loc })
  const res = await fetch(`${getBackendApiUrl()}/products/by-slug/${encodeURIComponent(slug)}?${query}`, {
    cache: 'no-store',
  })
  if (res.status === 404) throw new ProductNotFoundError()
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

async function fetchDetailFromApiRoute(slug: string, locale?: string): Promise<CatalogProductDetail> {
  const loc = locale && isAppLocale(locale) ? locale : defaultLocale
  const query = new URLSearchParams({ locale: loc })
  const res = await fetch(`/api/catalog/products/${encodeURIComponent(slug)}?${query}`, {
    cache: 'no-store',
  })
  if (res.status === 404) throw new ProductNotFoundError()
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchCatalogProductsPage(
  params: CatalogProductsParams & { page?: number; pageSize?: number } = {},
): Promise<FetchResult<CatalogProductsPageResult>> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = params.pageSize ?? CATALOG_PAGE_SIZE
  const request = { ...params, page, pageSize }

  try {
    const data =
      typeof window === 'undefined'
        ? await fetchPageFromBackend(request)
        : await fetchPageFromApiRoute(request)
    return availableResult(data)
  } catch {
    return unavailableResult(EMPTY_PAGE_RESULT)
  }
}

export async function fetchCatalogProducts(
  params: CatalogProductsParams = {},
): Promise<FetchResult<Plant[]>> {
  if (params.page != null || params.pageSize != null) {
    const result = await fetchCatalogProductsPage(params)
    return { data: result.data.plants, unavailable: result.unavailable }
  }

  try {
    const rows =
      typeof window === 'undefined'
        ? await fetchListFromBackend(params)
        : await fetchListFromApiRoute(params)
    return availableResult(rows.map(mapListItemToPlant))
  } catch {
    return unavailableResult([])
  }
}

export async function fetchCatalogProductBySlug(
  slug: string,
  locale?: string,
): Promise<FetchResult<Plant | null>> {
  try {
    const detail =
      typeof window === 'undefined'
        ? await fetchDetailFromBackend(slug, locale)
        : await fetchDetailFromApiRoute(slug, locale)
    return availableResult(mapDetailToPlant(detail))
  } catch (err) {
    if (err instanceof ProductNotFoundError) {
      return availableResult(null)
    }
    return unavailableResult(null)
  }
}
