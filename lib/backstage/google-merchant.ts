export type MerchantDiagHealth = 'OK' | 'WARN' | 'ERROR'

export type MerchantDiagCountersDto = {
  productsFetched: number
  variantsInspected: number
  included: number
  excluded: number
  excludedUnpublishedProduct: number
  excludedMissingLocaleName: number
  excludedMissingCategorySlug: number
  excludedStockLe0: number
  excludedMissingSku: number
  excludedInvalidMissingPrice: number
  excludedMissingNonPublicImage: number
  excludedOther: number
}

export type MerchantDiagRowDto = {
  productId: string
  productName: string
  latinName: string | null
  productSlug: string
  categorySlug: string
  variantId: string
  sku: string | null
  variantLabel: string | null
  stock: number
  price: number
  decision: 'included' | 'excluded'
  reason: string | null
  imageCount: number
  rawImageCount: number
  editHref: string
}

export type MerchantFeedDiagDto = {
  feed: string
  locale?: string
  origin?: string
  publicUrl?: string
  gmcTargets?: string[]
  counters?: MerchantDiagCountersDto
  health?: MerchantDiagHealth
  view?: string
  error?: string
  status?: number
  rows?: {
    items: MerchantDiagRowDto[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export type MerchantDiagnosticsResponse = {
  feeds: MerchantFeedDiagDto[]
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

export type MerchantDiagView = 'excluded' | 'included' | 'all'

export async function fetchGoogleMerchantDiagnostics(input?: {
  feed?: string
  view?: MerchantDiagView
  page?: number
  pageSize?: number
  summary?: boolean
}): Promise<MerchantDiagnosticsResponse> {
  const params = new URLSearchParams()
  if (input?.feed) params.set('feed', input.feed)
  if (input?.view) params.set('view', input.view)
  if (input?.page) params.set('page', String(input.page))
  if (input?.pageSize) params.set('pageSize', String(input.pageSize))
  if (input?.summary) params.set('summary', '1')

  const qs = params.toString()
  const res = await fetch(`/api/backstage/google-merchant${qs ? `?${qs}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as MerchantDiagnosticsResponse
}
