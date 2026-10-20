import type { DiscountRulePreviewResult, PromoEligibleAudience } from '@/lib/backstage/pricing'

export type SalesPriceValidityStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED'

export type ProductSalesPriceRow = {
  id: string
  productVariantId: string
  scope: 'ALL' | 'GROUP' | 'COMPANY'
  priceGroupCode: string | null
  flexiFirmaKod: string | null
  currency: string
  unitPrice: number
  validFrom: string | null
  validTo: string | null
  validityStatus: SalesPriceValidityStatus
  limMnoz2: number
  unitPrice2: number | null
  limMnoz3: number
  unitPrice3: number | null
  limMnoz4: number
  unitPrice4: number | null
  limMnoz5: number
  unitPrice5: number | null
  syncedAt: string
}

export type ProductSalesPricesPage = {
  items: ProductSalesPriceRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  companyIncluded: boolean
  companyDenied: boolean
}

async function parseError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}))
  return typeof data.error === 'string'
    ? data.error
    : typeof data.message === 'string'
      ? data.message
      : 'Request failed.'
}

function normalizeSalesPricesPage(data: Record<string, unknown>): ProductSalesPricesPage {
  return {
    items: Array.isArray(data.items) ? (data.items as ProductSalesPriceRow[]) : [],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? 1),
    pageSize: Number(data.pageSize ?? 20),
    totalPages: Number(data.totalPages ?? 1),
    companyIncluded: Boolean(data.companyIncluded),
    companyDenied: Boolean(data.companyDenied),
  }
}

export async function fetchProductSalesPrices(
  productId: string,
  opts?: {
    includeCompany?: boolean
    scope?: 'ALL' | 'GROUP' | 'COMPANY'
    page?: number
    pageSize?: number
  },
): Promise<ProductSalesPricesPage> {
  const qs = new URLSearchParams()
  if (opts?.includeCompany) qs.set('includeCompany', 'true')
  if (opts?.scope) qs.set('scope', opts.scope)
  if (opts?.page) qs.set('page', String(opts.page))
  if (opts?.pageSize) qs.set('pageSize', String(opts.pageSize))
  const suffix = qs.toString() ? `?${qs}` : ''
  const res = await fetch(
    `/api/backstage/sales-prices/for-product/${encodeURIComponent(productId)}${suffix}`,
    { cache: 'no-store' },
  )
  if (!res.ok) throw new Error(await parseError(res))
  return normalizeSalesPricesPage(await res.json())
}

/** Preferred for Product Editor accordion — one variant, paginated. */
export async function fetchVariantSalesPrices(
  variantId: string,
  opts?: {
    includeCompany?: boolean
    scope?: 'ALL' | 'GROUP' | 'COMPANY'
    page?: number
    pageSize?: number
  },
): Promise<ProductSalesPricesPage> {
  const qs = new URLSearchParams()
  qs.set('variantIds', variantId)
  if (opts?.includeCompany) qs.set('includeCompany', 'true')
  if (opts?.scope) qs.set('scope', opts.scope)
  if (opts?.page) qs.set('page', String(opts.page))
  if (opts?.pageSize) qs.set('pageSize', String(opts.pageSize))
  const res = await fetch(`/api/backstage/sales-prices/for-variants?${qs}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return normalizeSalesPricesPage(await res.json())
}

export async function previewVariantPrice(payload: {
  productVariantId: string
  quantity: number
  audience: PromoEligibleAudience
  registrationPreview?: 'GUEST' | 'REGISTERED'
  previewUserId?: string
}): Promise<DiscountRulePreviewResult> {
  const res = await fetch('/api/backstage/pricing/variant-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

/** Format retail label with commerce currency (no hardcoded ₴). */
export function formatBasePriceLabel(currencyCode: string, currencySymbol?: string): string {
  const code = currencyCode.trim().toUpperCase() || 'EUR'
  const symbol = currencySymbol?.trim()
  return symbol ? `${symbol} (${code})` : code
}

export function filterSalesPricesForVariant(
  rows: ProductSalesPriceRow[],
  variantId: string | null | undefined,
): ProductSalesPriceRow[] {
  if (!variantId) return []
  return rows.filter((row) => row.productVariantId === variantId)
}

export function salesPriceTierLines(row: ProductSalesPriceRow): Array<{
  minQty: number
  unitPrice: number
}> {
  const tiers: Array<{ minQty: number; unitPrice: number }> = [
    { minQty: 1, unitPrice: row.unitPrice },
  ]
  const pairs: Array<[number, number | null]> = [
    [row.limMnoz2, row.unitPrice2],
    [row.limMnoz3, row.unitPrice3],
    [row.limMnoz4, row.unitPrice4],
    [row.limMnoz5, row.unitPrice5],
  ]
  for (const [lim, price] of pairs) {
    if (lim > 0 && price != null) tiers.push({ minQty: lim, unitPrice: price })
  }
  return tiers
}
