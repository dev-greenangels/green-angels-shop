'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  closeFlexiBacklogTier,
  drainFlexiQueue,
  fetchFlexiBacklogDryRun,
  fetchFlexiQueue,
  retryFlexiFailedQueue,
  skipFlexiFailedQueue,
  type FlexiBacklogDryRunReport,
  type FlexiBacklogTier,
  type FlexiQueueSnapshot,
} from '@/lib/backstage/flexi'

export function FlexiQueueCard() {
  const [snapshot, setSnapshot] = useState<FlexiQueueSnapshot | null>(null)
  const [dryRun, setDryRun] = useState<FlexiBacklogDryRunReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setSnapshot(await fetchFlexiQueue())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не вдалося завантажити чергу')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (key: string, action: () => Promise<{ message?: string }>) => {
    setBusy(key)
    setMessage(null)
    try {
      const result = await action()
      setMessage(result.message ?? 'Готово')
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Помилка')
    } finally {
      setBusy(null)
    }
  }

  const runDryRun = async () => {
    setBusy('dry-run')
    setMessage(null)
    try {
      setDryRun(await fetchFlexiBacklogDryRun())
      setMessage('Dry-run оновлено.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Помилка dry-run')
    } finally {
      setBusy(null)
    }
  }

  const runTierClose = async (tier: FlexiBacklogTier, confirmText: string) => {
    if (!dryRun?.dryRunHash) {
      setMessage('Спочатку запустіть dry-run.')
      return
    }
    if (!window.confirm(confirmText)) return
    setBusy(`close-${tier}`)
    setMessage(null)
    try {
      const result = await closeFlexiBacklogTier({ tier, dryRunHash: dryRun.dryRunHash })
      setMessage(result.message)
      setDryRun(await fetchFlexiBacklogDryRun())
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Помилка закриття')
    } finally {
      setBusy(null)
    }
  }

  const events = snapshot?.events ?? {}
  const open =
    (events.PENDING ?? 0) + (events.FAILED ?? 0) + (events.PROCESSING ?? 0)

  const topEvidence = dryRun
    ? Object.entries(dryRun.openByEvidence)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Незакриті зміни</CardTitle>
        <CardDescription>
          Журнал V (курсор poll) vs відкриті FlexiChangeEvent. Застряглі події блокують курсор;
          при рестарті API worker знову обробляє backlog (якщо не перевищено reconcile threshold).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !snapshot ? (
          <p className="text-sm text-muted-foreground">Завантаження черги…</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <QueueStat label="Незакриті" value={open} warn={open > 0} />
              <QueueStat label="FAILED" value={events.FAILED ?? 0} warn={(events.FAILED ?? 0) > 0} />
              <QueueStat label="PENDING" value={events.PENDING ?? 0} />
              <QueueStat label="Журнал V" value={snapshot?.cursor ?? 0} />
            </div>
            <p className="text-xs text-muted-foreground">
              Jobs: waiting {snapshot?.jobs.waiting ?? 0}, active {snapshot?.jobs.active ?? 0},
              delayed {snapshot?.jobs.delayed ?? 0}, failed {snapshot?.jobs.failed ?? 0}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => void load()}>
                Оновити
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(busy) || (events.FAILED ?? 0) === 0}
                onClick={() => void run('retry', retryFlexiFailedQueue)}
              >
                {busy === 'retry' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Повторити FAILED
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(busy) || (events.FAILED ?? 0) === 0}
                onClick={() => {
                  if (
                    !window.confirm(
                      'Позначити всі FAILED як оброблені й зрушити курсор? Події більше не повторюватимуться.',
                    )
                  ) {
                    return
                  }
                  void run('skip', skipFlexiFailedQueue)
                }}
              >
                {busy === 'skip' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Пропустити FAILED
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={Boolean(busy)}
                onClick={() => void run('drain', drainFlexiQueue)}
              >
                {busy === 'drain' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Зняти waiting jobs
              </Button>
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <div>
                <p className="text-sm font-medium">Закрити застарілий backlog</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dry-run → tiered close. Змінює лише FlexiChangeEvent.status, не Order/commerce.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={Boolean(busy)}
                  onClick={() => void runDryRun()}
                >
                  {busy === 'dry-run' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Dry-run
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busy) || !dryRun || dryRun.orderOpen === 0}
                  onClick={() =>
                    void runTierClose(
                      'T1',
                      `T1: закрити ${dryRun?.orderOpen ?? 0} order-подій (Flexi orders empty=${String(dryRun?.flexiOrdersEmpty)})?`,
                    )
                  }
                >
                  {busy === 'close-T1' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  T1 Orders ({dryRun?.orderOpen ?? '—'})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busy) || !dryRun || dryRun.unsupportedOpen === 0}
                  onClick={() =>
                    void runTierClose(
                      'T2',
                      `T2: закрити ${dryRun?.unsupportedOpen ?? 0} unsupported-подій?`,
                    )
                  }
                >
                  {busy === 'close-T2' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  T2 Unsupported ({dryRun?.unsupportedOpen ?? '—'})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={Boolean(busy) || !dryRun || (dryRun.wouldClose.adresar ?? 0) === 0}
                  onClick={() =>
                    void runTierClose(
                      'T3',
                      `T3: закрити ${dryRun?.wouldClose.adresar ?? 0} adresar-подій?`,
                    )
                  }
                >
                  {busy === 'close-T3' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  T3 Adresar ({dryRun?.wouldClose.adresar ?? '—'})
                </Button>
              </div>
              {dryRun ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    hash={dryRun.dryRunHash} · catalogOpen={dryRun.catalogOpen} · orderOpen=
                    {dryRun.orderOpen} · unsupported={dryRun.unsupportedOpen}
                    {dryRun.changeVersionMinMax
                      ? ` · versions ${dryRun.changeVersionMinMax[0]}–${dryRun.changeVersionMinMax[1]}`
                      : ''}
                    {dryRun.flexiOrdersEmpty != null
                      ? ` · flexiOrdersEmpty=${String(dryRun.flexiOrdersEmpty)}`
                      : ''}
                  </p>
                  {topEvidence.length > 0 ? (
                    <p>
                      Top evidence:{' '}
                      {topEvidence.map(([ev, n]) => `${ev}(${n})`).join(', ')}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Dry-run ще не виконано.</p>
              )}
            </div>

            {message ? <p className="text-sm text-foreground">{message}</p> : null}
            {(snapshot?.failed.length ?? 0) > 0 ? (
              <div className="max-h-64 overflow-auto rounded-md border text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground">
                      <th className="px-2 py-1.5">Ver</th>
                      <th className="px-2 py-1.5">Evidence</th>
                      <th className="px-2 py-1.5">Помилка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot!.failed.map((row) => (
                      <tr key={row.id} className="border-b border-border/40 align-top">
                        <td className="px-2 py-1.5 tabular-nums">{row.changeVersion}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {row.evidence}/{row.objectId}
                        </td>
                        <td className="px-2 py-1.5 text-destructive">{row.lastError || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Немає FAILED подій.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function QueueStat({
  label,
  value,
  warn = false,
}: {
  label: string
  value: number
  warn?: boolean
}) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={warn ? 'text-lg font-semibold text-destructive' : 'text-lg font-semibold'}>
        {value}
      </p>
    </div>
  )
}
