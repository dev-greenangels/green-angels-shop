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
  drainFlexiQueue,
  retryFlexiFailedQueue,
  skipFlexiFailedQueue,
} from '@/lib/backstage/flexi'
import { fetchBackstageJobs, type BackstageJobsSnapshot } from '@/lib/backstage/jobs'
import { cancelNovaPoshtaSync, triggerNovaPoshtaSync } from '@/lib/backstage/nova-poshta'
import {
  drainStockNotificationJobs,
  retryStockNotificationJobs,
} from '@/lib/backstage/stock-notifications'
import { cn } from '@/lib/utils'

function Counts({ counts }: { counts?: Record<string, number> }) {
  if (!counts) return null
  return (
    <p className="text-sm text-muted-foreground">
      waiting {counts.waiting ?? 0} · active {counts.active ?? 0} · delayed {counts.delayed ?? 0} ·
      failed {counts.failed ?? 0}
    </p>
  )
}

export default function BackstageJobsPage() {
  const t = useTranslations('jobsHub')
  const [data, setData] = useState<BackstageJobsSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fetchBackstageJobs())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key)
    try {
      await action()
      toast.success(t('done'))
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('actionFailed'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            {t('refresh')}
          </Button>
        </div>

        {loading && !data ? (
          <div className="flex items-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('loading')}
          </div>
        ) : (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('stockTitle')}</CardTitle>
                <CardDescription>{t('stockBody')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Counts counts={data?.app.counts} />
                <p className="text-xs text-muted-foreground">
                  {t('stockJobsCount', { count: data?.app.stockJobs.length ?? 0 })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/backstage/stock-notifications">{t('openStock')}</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('stock-retry', () => retryStockNotificationJobs())}
                  >
                    {t('retryFailed')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('stock-drain', () => drainStockNotificationJobs())}
                  >
                    {t('drainWaiting')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('flexiTitle')}</CardTitle>
                <CardDescription>{t('flexiBody')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Counts counts={data?.flexi.jobs} />
                <p className="text-xs text-muted-foreground">
                  cursor {data?.flexi.cursor ?? 0} · FAILED {data?.flexi.events.FAILED ?? 0} · PENDING{' '}
                  {data?.flexi.events.PENDING ?? 0}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/backstage/settings">{t('openFlexi')}</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('flexi-retry', () => retryFlexiFailedQueue())}
                  >
                    {t('retryFailed')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('flexi-skip', () => skipFlexiFailedQueue())}
                  >
                    {t('skipFailed')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('flexi-drain', () => drainFlexiQueue())}
                  >
                    {t('drainWaiting')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('npTitle')}</CardTitle>
                <CardDescription>{t('npBody')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Counts counts={data?.novaPoshta.jobs} />
                <p className="text-xs text-muted-foreground">
                  {data?.novaPoshta.isRunning ? t('npRunning') : t('npIdle')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/backstage/settings">{t('openNp')}</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('np-sync', () => triggerNovaPoshtaSync('all'))}
                  >
                    {t('npSync')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={Boolean(busy)}
                    onClick={() => void run('np-cancel', () => cancelNovaPoshtaSync())}
                  >
                    {t('npCancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('tedbTitle')}</CardTitle>
                <CardDescription>{t('tedbBody')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Counts counts={data?.tedb.jobs} />
                <p className="text-xs text-muted-foreground">
                  {data?.tedb.lastError || data?.tedb.lastRunAt || t('tedbIdle')}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/backstage/tedb">{t('openTedb')}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('appTitle')}</CardTitle>
                <CardDescription>{t('appBody')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Counts counts={data?.app.counts} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
