import { NextResponse } from 'next/server'

import { requireBackstageSession } from '@/lib/backstage-auth/require-session'
import { buildMerchantFeedDiagnostics } from '@/lib/merchant/build-feed'
import {
  MERCHANT_FEED_CODES,
  MERCHANT_FEEDS,
  type MerchantFeedCode,
} from '@/lib/merchant/feeds'
import type { MerchantVariantEvaluation } from '@/lib/merchant/evaluate'

export const dynamic = 'force-dynamic'

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

type ViewMode = 'excluded' | 'included' | 'all'

function parseFeedCode(raw: string | null): MerchantFeedCode | null {
  if (!raw) return null
  const code = raw.trim().toLowerCase() as MerchantFeedCode
  return MERCHANT_FEED_CODES.includes(code) ? code : null
}

function parseView(raw: string | null): ViewMode {
  if (raw === 'included' || raw === 'all') return raw
  return 'excluded'
}

function paginate<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  }
}

function serializeRow(row: MerchantVariantEvaluation) {
  return {
    productId: row.productId,
    productName: row.productName,
    latinName: row.latinName,
    productSlug: row.productSlug,
    categorySlug: row.categorySlug,
    variantId: row.variantId,
    sku: row.sku,
    variantLabel: row.variantLabel,
    stock: row.stock,
    price: row.price,
    decision: row.decision,
    reason: row.reason,
    imageCount: row.absoluteImages.length,
    rawImageCount: row.rawImages.length,
    editHref: `/backstage/products/${row.productId}/edit`,
  }
}

export async function GET(request: Request) {
  const { error } = await requireBackstageSession(request)
  if (error) return error

  const url = new URL(request.url)
  const feedCode = parseFeedCode(url.searchParams.get('feed'))
  const view = parseView(url.searchParams.get('view'))
  const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE),
  )
  const summaryOnly = url.searchParams.get('summary') === '1'

  const codes: MerchantFeedCode[] = feedCode ? [feedCode] : [...MERCHANT_FEED_CODES]
  const feeds = []

  for (const code of codes) {
    const result = await buildMerchantFeedDiagnostics(MERCHANT_FEEDS[code])
    if ('status' in result) {
      feeds.push({
        feed: code,
        error: result.message,
        status: result.status,
      })
      continue
    }

    const rows =
      view === 'included'
        ? result.includedRows
        : view === 'all'
          ? [...result.excludedRows, ...result.includedRows]
          : result.excludedRows

    const pageData = summaryOnly
      ? { items: [], total: rows.length, page: 1, pageSize, totalPages: 1 }
      : paginate(rows, page, pageSize)

    feeds.push({
      feed: result.feed,
      locale: result.locale,
      origin: result.origin,
      publicUrl: result.publicUrl,
      gmcTargets: result.gmcTargets,
      counters: result.counters,
      health: result.health,
      view,
      rows: {
        ...pageData,
        items: pageData.items.map(serializeRow),
      },
    })
  }

  return NextResponse.json(
    { feeds },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
