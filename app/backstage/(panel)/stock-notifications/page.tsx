'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import {
  deleteBackstageStockNotification,
  deleteBackstageStockNotifications,
  drainStockNotificationJobs,
  fetchBackstageStockNotifications,
  fetchStockNotificationJobs,
  retryStockNotificationJobs,
  sendBackstageStockNotifications,
  type StockJobItem,
  type StockNotificationChannelFilter,
  type StockNotificationListItem,
  type StockNotificationStatusFilter,
} from '@/lib/backstage/stock-notifications'
import { cn } from '@/lib/utils'

const STOCK_PENDING_EVENT = 'ga:stock-notify-pending-refresh'

export default function BackstageStockNotificationsPage() {
  const t = useTranslations('stockNotifications')
  const { locale } = useBackstageUiLocale()
  const [tab, setTab] = useState<'list' | 'jobs'>('list')
  const [items, setItems] = useState<StockNotificationListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<StockNotificationStatusFilter>('pending')
  const [channel, setChannel] = useState<StockNotificationChannelFilter>('all')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({})
  const [jobItems, setJobItems] = useState<StockJobItem[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageStockNotifications({
        status,
        channel,
        q: search,
        page,
      })
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [status, channel, search, page, t])

  const loadJobs = useCallback(async () => {
    setJobsLoading(true)
    try {
      const data = await fetchStockNotificationJobs()
      setJobCounts(data.counts)
      setJobItems(data.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('jobsLoadError'))
    } finally {
      setJobsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (tab === 'list') void load()
  }, [tab, load])

  useEffect(() => {
    if (tab === 'jobs') void loadJobs()
  }, [tab, loadJobs])

  const allSelected = useMemo(
    () => items.length > 0 && items.every((row) => selected.has(row.id)),
    [items, selected],
  )

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(items.map((row) => row.id)))
  }

  const runSend = async (ids: string[]) => {
    try {
      const result = await sendBackstageStockNotifications(ids)
      toast.success(t('queued', { count: result.queued }))
      window.dispatchEvent(new CustomEvent(STOCK_PENDING_EVENT))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('sendFailed'))
    }
  }

  const runDelete = async (ids: string[]) => {
    try {
      if (ids.length === 1) {
        await deleteBackstageStockNotification(ids[0])
      } else {
        await deleteBackstageStockNotifications(ids)
      }
      toast.success(t('deleted'))
      window.dispatchEvent(new CustomEvent(STOCK_PENDING_EVENT))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('deleteFailed'))
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subtitle', { count: total })}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => (tab === 'list' ? void load() : void loadJobs())}
            disabled={loading || jobsLoading}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', (loading || jobsLoading) && 'animate-spin')} />
            {t('refresh')}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={tab === 'list' ? 'default' : 'outline'} onClick={() => setTab('list')}>
            {t('tabList')}
          </Button>
          <Button type="button" size="sm" variant={tab === 'jobs' ? 'default' : 'outline'} onClick={() => setTab('jobs')}>
            {t('tabJobs')}
          </Button>
        </div>

        {tab === 'jobs' ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              waiting {jobCounts.waiting ?? 0} · active {jobCounts.active ?? 0} · delayed{' '}
              {jobCounts.delayed ?? 0} · failed {jobCounts.failed ?? 0}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await retryStockNotificationJobs()
                  toast.success(t('retried', { count: result.count }))
                  await loadJobs()
                }}
              >
                {t('retryFailed')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const result = await drainStockNotificationJobs()
                  toast.success(t('drained', { count: result.removed }))
                  await loadJobs()
                }}
              >
                {t('drainWaiting')}
              </Button>
            </div>
            {jobsLoading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('loading')}
              </div>
            ) : jobItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">{t('jobsEmpty')}</CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {jobItems.map((job) => (
                  <Card key={String(job.id)}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span className="font-mono text-xs">{job.id}</span>
                      <Badge variant="outline">{job.state}</Badge>
                      <span className="text-muted-foreground">{job.failedReason ?? '—'}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <form
              className="flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                setPage(1)
                setSearch(q)
              }}
            >
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="max-w-sm"
              />
              <Button type="submit" variant="outline" size="sm">
                {t('search')}
              </Button>
            </form>

            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'notified'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={status === value ? 'default' : 'outline'}
                  onClick={() => {
                    setStatus(value)
                    setPage(1)
                  }}
                >
                  {t(`status.${value}`)}
                </Button>
              ))}
              {(['all', 'email', 'phone'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={channel === value ? 'secondary' : 'outline'}
                  onClick={() => {
                    setChannel(value)
                    setPage(1)
                  }}
                >
                  {t(`channel.${value}`)}
                </Button>
              ))}
            </div>

            {selected.size > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void runSend([...selected])}>
                  {t('sendSelected', { count: selected.size })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => void runDelete([...selected])}
                >
                  {t('deleteSelected', { count: selected.size })}
                </Button>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center gap-2 py-12 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('loading')}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
              </Card>
            ) : items.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">{t('empty')}</CardContent>
              </Card>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b bg-muted/40">
                    <tr>
                      <th className="p-3">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                      </th>
                      <th className="p-3">{t('colProduct')}</th>
                      <th className="p-3">{t('colContact')}</th>
                      <th className="p-3">{t('colStatus')}</th>
                      <th className="p-3">{t('colCreated')}</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => {
                              setSelected((current) => {
                                const next = new Set(current)
                                if (next.has(row.id)) next.delete(row.id)
                                else next.add(row.id)
                                return next
                              })
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{row.productName}</p>
                          <p className="text-xs text-muted-foreground">{row.name}</p>
                        </td>
                        <td className="p-3">
                          <p>{row.email ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{row.phone ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.locale}
                            {row.countrySiteCode ? ` · ${row.countrySiteCode}` : ''}
                          </p>
                        </td>
                        <td className="p-3">
                          <Badge variant={row.notifiedAt ? 'secondary' : 'default'}>
                            {row.notifiedAt ? t('status.notified') : t('status.pending')}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {formatDateTime(row.createdAt, locale)}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {!row.notifiedAt ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => void runSend([row.id])}>
                                {t('send')}
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => void runDelete([row.id])}
                            >
                              {t('delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {t('prev')}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
