'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Loader2, RefreshCw, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import {
  downloadBackstageMarketingSubscribersExport,
  fetchBackstageMarketingSubscribers,
  marketingSourceLabel,
  type MarketingSubscriberListItem,
  type MarketingSubscriberStatus,
} from '@/lib/backstage/marketing-subscribers'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { cn } from '@/lib/utils'

type StatusFilter = MarketingSubscriberStatus | 'all'
type SortBy = 'subscribedAt' | 'email' | 'lastName' | 'status' | 'source'

function displayValue(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '—'
}

export default function BackstageMarketingSubscribersPage() {
  const t = useTranslations('marketingSubscribers')
  const { locale } = useBackstageUiLocale()
  const [items, setItems] = useState<MarketingSubscriberListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('subscribedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(q.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageMarketingSubscribers({
        q: search || undefined,
        status: statusFilter,
        sortBy,
        sortDir,
        page,
      })
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sortBy, sortDir, page, t])

  useEffect(() => {
    void load()
  }, [load])

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir(column === 'subscribedAt' ? 'desc' : 'asc')
    }
    setPage(1)
  }

  const runExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format)
    try {
      await downloadBackstageMarketingSubscribersExport({
        format,
        q: search || undefined,
        status: statusFilter,
        sortBy,
        sortDir,
      })
      toast.success(t('exportSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('exportError'))
    } finally {
      setExporting(null)
    }
  }

  const sortLabel = (column: SortBy, label: string) => {
    const active = sortBy === column
    const arrow = active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
    return `${label}${arrow}`
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('subtitle', { count: total })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={exporting !== null}
              onClick={() => void runExport('csv')}
            >
              {exporting === 'csv' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={exporting !== null}
              onClick={() => void runExport('xlsx')}
            >
              {exporting === 'xlsx' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
            <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              {t('refresh')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'withdrawn'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={statusFilter === value ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter(value)
                  setPage(1)
                }}
              >
                {t(`statusFilter.${value}`)}
              </Button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('loading')}
              </div>
            ) : error ? (
              <p className="px-4 py-8 text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('email')}>
                          {sortLabel('email', t('columns.email'))}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('lastName')}>
                          {sortLabel('lastName', t('columns.name'))}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('source')}>
                          {sortLabel('source', t('columns.source'))}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('status')}>
                          {sortLabel('status', t('columns.status'))}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">
                        <button type="button" className="hover:underline" onClick={() => toggleSort('subscribedAt')}>
                          {sortLabel('subscribedAt', t('columns.subscribedAt'))}
                        </button>
                      </th>
                      <th className="px-4 py-3 font-medium">{t('columns.unsubscribedAt')}</th>
                      <th className="px-4 py-3 font-medium">{t('columns.clientType')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.subscriberKey} className="border-b last:border-0">
                        <td className="px-4 py-3">{displayValue(row.email)}</td>
                        <td className="px-4 py-3">
                          {displayValue([row.lastName, row.firstName].filter(Boolean).join(' '))}
                        </td>
                        <td className="px-4 py-3">{marketingSourceLabel(row.source)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
                            {row.status === 'active' ? t('status.active') : t('status.withdrawn')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {row.subscribedAt
                            ? formatDateTime(row.subscribedAt, locale, 'datetime')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.unsubscribedAt
                            ? formatDateTime(row.unsubscribedAt, locale, 'datetime')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {row.isRegistered ? (
                            row.userId ? (
                              <Link
                                href={`/backstage/users/${row.userId}`}
                                className="text-primary underline-offset-2 hover:underline"
                              >
                                {t('clientType.registered')}
                              </Link>
                            ) : (
                              t('clientType.registered')
                            )
                          ) : (
                            t('clientType.guest')
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('pagination.prev')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('pagination.page', { page, totalPages })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              {t('pagination.next')}
            </Button>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  )
}
