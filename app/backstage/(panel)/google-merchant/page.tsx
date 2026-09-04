'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  fetchGoogleMerchantDiagnostics,
  type MerchantDiagHealth,
  type MerchantDiagRowDto,
  type MerchantDiagView,
  type MerchantFeedDiagDto,
} from '@/lib/backstage/google-merchant'
import { cn } from '@/lib/utils'

const FEED_CODES = ['sk', 'cz', 'de', 'hu'] as const

function healthClass(health: MerchantDiagHealth | undefined) {
  if (health === 'OK') return 'bg-emerald-100 text-emerald-900'
  if (health === 'WARN') return 'bg-amber-100 text-amber-950'
  return 'bg-red-100 text-red-900'
}

function reasonLabel(
  reason: string | null,
  t: ReturnType<typeof useTranslations<'googleMerchant'>>,
) {
  switch (reason) {
    case 'unpublished_product':
    case 'missing_locale_name':
    case 'missing_category_slug':
    case 'stock_le_0':
    case 'missing_sku':
    case 'invalid_missing_price':
    case 'missing_non_public_image':
    case 'other':
      return t(`reason.${reason}`)
    default:
      return reason || '—'
  }
}

export default function GoogleMerchantDiagnosticsPage() {
  const t = useTranslations('googleMerchant')
  const [summaries, setSummaries] = useState<MerchantFeedDiagDto[]>([])
  const [activeFeed, setActiveFeed] = useState<(typeof FEED_CODES)[number]>('sk')
  const [view, setView] = useState<MerchantDiagView>('excluded')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<MerchantFeedDiagDto | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await fetchGoogleMerchantDiagnostics({ summary: true })
      setSummaries(data.feeds)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoadingSummary(false)
    }
  }, [t])

  const loadDetail = useCallback(async () => {
    setLoadingDetail(true)
    try {
      const data = await fetchGoogleMerchantDiagnostics({
        feed: activeFeed,
        view,
        page,
        pageSize: 50,
      })
      setDetail(data.feeds[0] ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoadingDetail(false)
    }
  }, [activeFeed, page, t, view])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const refresh = async () => {
    await Promise.all([loadSummary(), loadDetail()])
  }

  const rows: MerchantDiagRowDto[] = detail?.rows?.items ?? []
  const totalPages = detail?.rows?.totalPages ?? 1
  const counters = detail?.counters

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={loadingSummary || loadingDetail}>
            <RefreshCw
              className={cn('mr-2 h-4 w-4', (loadingSummary || loadingDetail) && 'animate-spin')}
            />
            {t('refresh')}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEED_CODES.map((code) => {
            const feed = summaries.find((row) => row.feed === code)
            const health = feed?.health
            const included = feed?.counters?.included ?? 0
            const excluded = feed?.counters?.excluded ?? 0
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setActiveFeed(code)
                  setPage(1)
                }}
                className={cn(
                  'rounded-lg border p-4 text-left transition-colors',
                  activeFeed === code
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase">{code}</span>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      healthClass(health),
                    )}
                  >
                    {health ?? (feed?.error ? 'ERROR' : '…')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('included')}: {included}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('excluded')}: {excluded}
                </p>
                {feed?.error ? (
                  <p className="mt-2 text-xs text-destructive">{feed.error}</p>
                ) : null}
              </button>
            )
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('detailTitle', { feed: activeFeed.toUpperCase() })}</CardTitle>
            <CardDescription>
              {detail?.publicUrl ? (
                <a
                  href={detail.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:underline"
                >
                  {detail.publicUrl}
                </a>
              ) : (
                t('detailHint')
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDetail && !detail ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('loading')}
              </div>
            ) : detail?.error ? (
              <p className="text-sm text-destructive">{detail.error}</p>
            ) : (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    {t('productsFetched')}: {counters?.productsFetched ?? 0}
                  </p>
                  <p>
                    {t('variantsInspected')}: {counters?.variantsInspected ?? 0}
                  </p>
                  <p>
                    {t('included')}: {counters?.included ?? 0}
                  </p>
                  <p>
                    {t('excluded')}: {counters?.excluded ?? 0}
                  </p>
                </div>

                <div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    {t('reason.unpublished_product')}:{' '}
                    {counters?.excludedUnpublishedProduct ?? 0}
                  </p>
                  <p>
                    {t('reason.missing_locale_name')}:{' '}
                    {counters?.excludedMissingLocaleName ?? 0}
                  </p>
                  <p>
                    {t('reason.missing_category_slug')}:{' '}
                    {counters?.excludedMissingCategorySlug ?? 0}
                  </p>
                  <p>
                    {t('reason.stock_le_0')}: {counters?.excludedStockLe0 ?? 0}
                  </p>
                  <p>
                    {t('reason.missing_sku')}: {counters?.excludedMissingSku ?? 0}
                  </p>
                  <p>
                    {t('reason.invalid_missing_price')}:{' '}
                    {counters?.excludedInvalidMissingPrice ?? 0}
                  </p>
                  <p>
                    {t('reason.missing_non_public_image')}:{' '}
                    {counters?.excludedMissingNonPublicImage ?? 0}
                  </p>
                  <p>
                    {t('reason.other')}: {counters?.excludedOther ?? 0}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['excluded', 'included', 'all'] as const).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      size="sm"
                      variant={view === mode ? 'default' : 'outline'}
                      onClick={() => {
                        setView(mode)
                        setPage(1)
                      }}
                    >
                      {t(`view.${mode}`)}
                    </Button>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t('colProduct')}</th>
                        <th className="px-3 py-2 font-medium">{t('colSku')}</th>
                        <th className="px-3 py-2 font-medium">{t('colReason')}</th>
                        <th className="px-3 py-2 font-medium">{t('colStock')}</th>
                        <th className="px-3 py-2 font-medium">{t('colPrice')}</th>
                        <th className="px-3 py-2 font-medium">{t('colImage')}</th>
                        <th className="px-3 py-2 font-medium">{t('colEdit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                            {t('emptyRows')}
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={`${row.variantId}-${row.decision}`} className="border-b last:border-0">
                            <td className="px-3 py-2 align-top">
                              <div className="font-medium">{row.productName || '—'}</div>
                              {row.latinName ? (
                                <div className="text-xs italic text-muted-foreground">
                                  {row.latinName}
                                </div>
                              ) : null}
                              <div className="font-mono text-xs text-muted-foreground">
                                {row.productId}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top font-mono text-xs">
                              {row.sku || '—'}
                            </td>
                            <td className="px-3 py-2 align-top">
                              {row.decision === 'included'
                                ? t('included')
                                : reasonLabel(row.reason, t)}
                            </td>
                            <td className="px-3 py-2 align-top">{row.stock}</td>
                            <td className="px-3 py-2 align-top">{row.price}</td>
                            <td className="px-3 py-2 align-top">
                              {row.imageCount > 0
                                ? t('imageOk', { count: row.imageCount })
                                : t('imageMissing', { raw: row.rawImageCount })}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <Link
                                href={row.editHref}
                                className="text-primary underline-offset-2 hover:underline"
                              >
                                {t('editProduct')}
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {t('pageOf', {
                      page: detail?.rows?.page ?? page,
                      totalPages,
                      total: detail?.rows?.total ?? 0,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={page <= 1 || loadingDetail}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      {t('prev')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || loadingDetail}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t('next')}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
