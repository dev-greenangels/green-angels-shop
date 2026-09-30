'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FlexiAbraHooksPanel } from '@/components/backstage/flexi-abra-hooks-panel'
import { FlexiLegacyRetirementPanel } from '@/components/backstage/flexi-legacy-retirement-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  disableFlexiAutoSync,
  enableFlexiAutoSyncWithoutUpdate,
  fetchFlexiOperations,
  fetchFlexiSettings,
  runFlexiFullRefresh,
  runFlexiOrderReconcile,
  updateAndEnableFlexiAutoSync,
  type FlexiFullRefreshResponse,
  type FlexiOperationsSnapshot,
  type FlexiPublicSettings,
} from '@/lib/backstage/flexi'
import { cn } from '@/lib/utils'

type EnableDialog = null | 'choose'

const ACTION_TIMEOUT_MS = 120_000

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
          ms,
        )
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export function FlexiAutoSyncCard() {
  const t = useTranslations('flexiAutoSync')
  const [settings, setSettings] = useState<FlexiPublicSettings | null>(null)
  const [ops, setOps] = useState<FlexiOperationsSnapshot | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [lastCounts, setLastCounts] = useState<FlexiFullRefreshResponse['counts'] | null>(null)
  const [enableDialog, setEnableDialog] = useState<EnableDialog>(null)
  const [techOpen, setTechOpen] = useState(false)

  const load = useCallback(async () => {
    const [s, o] = await Promise.all([fetchFlexiSettings(), fetchFlexiOperations()])
    setSettings(s)
    setOps(o)
  }, [])

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : t('loadError'))
    })
  }, [load, t])

  const run = async (
    key: string,
    action: () => Promise<{ message?: string; ok?: boolean; counts?: FlexiFullRefreshResponse['counts'] }>,
  ) => {
    setBusy(key)
    setMessage(null)
    try {
      const result = await withTimeout(action(), ACTION_TIMEOUT_MS, key)
      if (result.counts) setLastCounts(result.counts)
      setMessage(
        result.message ??
          (result.ok === false ? t('refreshFailed') : result.ok ? t('refreshDone') : t('done')),
      )
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('error'))
      try {
        await load()
      } catch {
        // ignore
      }
    } finally {
      setBusy(null)
      setEnableDialog(null)
    }
  }

  const autoOn = settings?.webhookAccepting !== false
  const healthFromApi = ops?.healthStatus
  const webhookDelivery = ops?.webhookDeliveryStatus
  const syncLabel = !settings
    ? '…'
    : busy
      ? t('updating')
      : healthFromApi === 'disabled' || !autoOn
        ? t('disabled')
        : healthFromApi === 'error'
          ? t('requiresAttention')
          : healthFromApi === 'degraded'
            ? t('degraded')
            : t('working')

  const webhookLabel =
    webhookDelivery === 'off'
      ? t('webhookOff')
      : webhookDelivery === 'unreachable_url'
        ? t('webhookUnreachable')
        : webhookDelivery === 'registered_waiting'
          ? t('webhookWaiting')
          : webhookDelivery === 'test_only'
            ? t('webhookTestOnly')
            : webhookDelivery === 'receiving'
              ? t('webhookReceiving')
              : webhookDelivery === 'error'
                ? t('webhookError')
                : t('webhookUnknown')

  const dash = t('dash')
  const usage = ops?.apiUsage
  const usagePct = usage?.percent ?? 0
  const usageTone =
    usagePct >= 100 ? 'limit' : usagePct >= 90 ? 'high' : usagePct >= 70 ? 'warn' : 'ok'

  const busyLabel =
    busy === 'full'
      ? t('busyFull')
      : busy === 'update-on'
        ? t('busyUpdateOn')
        : busy === 'enable-only'
          ? t('busyEnable')
          : busy === 'off'
            ? t('busyDisable')
            : busy === 'orders'
              ? t('busyOrders')
              : null

  const opLabel = (operation: string) => {
    switch (operation) {
      case 'FULL_REFRESH':
        return t('opFULL_REFRESH')
      case 'LIVE_REFRESH':
        return t('opLIVE_REFRESH')
      case 'AUTO_SYNC_ENABLE':
        return t('opAUTO_SYNC_ENABLE')
      case 'AUTO_SYNC_DISABLE':
        return t('opAUTO_SYNC_DISABLE')
      case 'UPDATE_AND_ENABLE':
        return t('opUPDATE_AND_ENABLE')
      case 'ENABLE_WITHOUT_UPDATE':
        return t('opENABLE_WITHOUT_UPDATE')
      case 'ORDER_RECONCILE':
        return t('opORDER_RECONCILE')
      case 'RECOVERY':
        return t('opRECOVERY')
      case 'ERROR':
        return t('opERROR')
      default:
        return operation
    }
  }

  const statusLabelRow = (status: string) => {
    if (status === 'ok') return t('statusOk')
    if (status === 'error') return t('statusError')
    if (status === 'running') return t('statusRunning')
    return status
  }

  const onToggleAuto = (next: boolean) => {
    if (busy) return
    if (!next) {
      void run('off', () =>
        window.confirm(t('disableConfirm'))
          ? disableFlexiAutoSync()
          : Promise.resolve({ ok: true, message: t('cancelled') }),
      )
      return
    }
    setEnableDialog('choose')
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium">{t('autoSync')}</p>
            <p
              className={cn(
                'text-sm font-semibold',
                syncLabel === t('requiresAttention') || syncLabel === t('error')
                  ? 'text-destructive'
                  : syncLabel === t('working') || syncLabel === t('healthy')
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground',
              )}
            >
              ● {syncLabel}
            </p>
            <p
              className={cn(
                'text-xs',
                webhookDelivery === 'receiving'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : webhookDelivery === 'unreachable_url' || webhookDelivery === 'error'
                    ? 'text-destructive'
                    : 'text-amber-700 dark:text-amber-400',
              )}
            >
              {t('webhook')}: {webhookLabel}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted-foreground">{autoOn ? t('on') : t('off')}</span>
            <Switch
              checked={autoOn}
              disabled={Boolean(busy) || !settings}
              onCheckedChange={onToggleAuto}
              aria-label={t('autoSync')}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 text-sm">
          <Meta
            label={t('lastSuccess')}
            value={ops?.lastSyncAt ?? settings?.lastSyncAt ?? dash}
          />
          <Meta
            label={t('lastWebhookReceived')}
            value={ops?.lastWebhookReceivedAt ?? settings?.lastWebhookReceivedAt ?? dash}
          />
          <Meta
            label={t('lastFull')}
            value={ops?.lastStromSyncAt ?? settings?.lastStromSyncAt ?? dash}
          />
        </div>

        {busyLabel ? (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400" role="status">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden />
            {busyLabel}
          </p>
        ) : null}

        {(ops?.openFailures?.length ?? 0) > 0 ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1">
            <p className="font-medium text-destructive">{t('openFailures')}</p>
            {ops!.openFailures!.slice(0, 5).map((f) => (
              <p key={f.key} className="break-words text-muted-foreground">
                {f.at.replace('T', ' ').slice(0, 19)} — {f.key}: {f.message}
              </p>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={Boolean(busy)}
            onClick={() =>
              void run('full', async () => {
                if (!window.confirm(t('updateAllConfirm'))) {
                  return { ok: true, message: t('cancelled') }
                }
                return runFlexiFullRefresh()
              })
            }
          >
            {busy === 'full' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {t('updateAll')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={Boolean(busy)}
            onClick={() => void run('orders', runFlexiOrderReconcile)}
          >
            {busy === 'orders' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {t('reconcileOrders')}
          </Button>
          <Button type="button" variant="ghost" disabled={Boolean(busy)} onClick={() => void load()}>
            {t('refreshStatus')}
          </Button>
        </div>

        {usage ? (
          <div className="space-y-2 rounded-xl border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">{t('apiUsageTitle')}</p>
              <p className="text-sm font-semibold tabular-nums">
                {t('apiUsageOf', {
                  used: usage.used.toLocaleString(),
                  limit: usage.limit.toLocaleString(),
                })}{' '}
                <span className="text-muted-foreground font-normal">({usage.percent}%)</span>
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full transition-all',
                  usageTone === 'ok' && 'bg-emerald-600',
                  usageTone === 'warn' && 'bg-amber-500',
                  usageTone === 'high' && 'bg-orange-600',
                  usageTone === 'limit' && 'bg-destructive',
                )}
                style={{ width: `${Math.min(100, usage.percent)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t('apiResetUtc', { date: usage.dateUtc })}</p>
            {usageTone === 'warn' ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">{t('apiWarn')}</p>
            ) : null}
            {usageTone === 'high' ? (
              <p className="text-xs text-orange-700 dark:text-orange-400">{t('apiHigh')}</p>
            ) : null}
            {usageTone === 'limit' ? (
              <p className="text-xs text-destructive">{t('apiLimit')}</p>
            ) : null}
            <p className="text-xs text-muted-foreground" title={usage.note}>
              {t('apiUsageHint')}
            </p>
            <div className="grid gap-1 sm:grid-cols-2 text-xs text-muted-foreground">
              <span>
                {t('breakdownLive')}: {usage.breakdown.live}
              </span>
              <span>
                {t('breakdownCatalog')}: {usage.breakdown.catalog}
              </span>
              <span>
                {t('breakdownOrders')}: {usage.breakdown.orders}
              </span>
              <span>
                {t('breakdownCheckout')}: {usage.breakdown.checkout}
              </span>
              <span>
                {t('breakdownFull')}: {usage.breakdown.fullRefresh}
              </span>
              <span>
                {t('breakdownOther')}: {usage.breakdown.other}
              </span>
            </div>
          </div>
        ) : null}

        {enableDialog === 'choose' ? (
          <div
            className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-3"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flexi-enable-dialog-title"
          >
            <p id="flexi-enable-dialog-title" className="text-sm font-medium">
              {t('enableDialogTitle')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void run('update-on', updateAndEnableFlexiAutoSync)}
              >
                {busy === 'update-on' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {t('updateAndEnable')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(busy)}
                onClick={() => {
                  if (!window.confirm(t('enableWithoutUpdateConfirm'))) return
                  void run('enable-only', enableFlexiAutoSyncWithoutUpdate)
                }}
              >
                {busy === 'enable-only' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {t('enableWithoutUpdate')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={Boolean(busy)}
                onClick={() => setEnableDialog(null)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        ) : null}

        {message ? (
          <p
            className={
              /помилк|error|fail|не вдало|не заверш|timed out|did not finish|nedokončen/i.test(
                message,
              )
                ? 'text-sm text-destructive break-words'
                : 'text-sm break-words'
            }
            role="status"
          >
            {message}
          </p>
        ) : null}

        {lastCounts ? (
          <div className="rounded-lg border p-3 text-xs space-y-1">
            <p className="font-medium text-sm">{t('resultCounts')}</p>
            <CountLine label={t('countCategories')} value={lastCounts.categories} />
            <CountLine label={t('countProducts')} value={lastCounts.products} />
            <CountLine label={t('countVariants')} value={lastCounts.variants} />
            <CountLine label={t('countCenikUpdated')} value={lastCounts.cenikUpdated} />
            <CountLine label={t('countOrdersUpdated')} value={lastCounts.ordersUpdated} />
            {lastCounts.durationMs != null ? (
              <p>
                {t('countDuration')}: {Math.round(lastCounts.durationMs / 1000)}s
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <p className="text-sm font-medium mb-2">{t('opsTitle')}</p>
          <div className="max-h-52 overflow-auto rounded-md border text-xs">
            <table className="w-full text-left min-w-[28rem]">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="px-2 py-1.5">{t('opsTime')}</th>
                  <th className="px-2 py-1.5">{t('opsOperation')}</th>
                  <th className="px-2 py-1.5">{t('opsResult')}</th>
                  <th className="px-2 py-1.5">{t('opsDetail')}</th>
                </tr>
              </thead>
              <tbody>
                {(ops?.entries ?? []).slice(0, 12).map((row) => (
                  <tr key={row.id} className="border-b border-border/40 align-top">
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {row.at.replace('T', ' ').slice(0, 16)}
                    </td>
                    <td className="px-2 py-1.5">{opLabel(row.operation)}</td>
                    <td className="px-2 py-1.5">{statusLabelRow(row.status)}</td>
                    <td className="px-2 py-1.5 text-muted-foreground break-words max-w-[16rem]">
                      {row.error || row.detail || dash}
                    </td>
                  </tr>
                ))}
                {(ops?.entries?.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-3 text-muted-foreground">
                      {t('opsEmpty')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() => setTechOpen((v) => !v)}
          >
            {techOpen ? t('techHide') : t('techShow')}
          </button>
          {techOpen ? (
            <div className="mt-2 space-y-3">
              <div className="rounded-lg border p-3 text-xs space-y-1 text-muted-foreground break-words">
                <p>
                  {t('webhook')}: {webhookLabel}
                </p>
                <p>
                  {t('techWebhookUrl')}: {ops?.webhookUrl || settings?.webhookUrl || dash}
                </p>
                <p>
                  {t('lastWebhookTest')}:{' '}
                  {(ops?.lastWebhookTestAt ?? settings?.lastWebhookTestAt ?? dash)
                    .toString()
                    .replace('T', ' ')
                    .slice(0, 19)}
                </p>
                <p>
                  {t('baseline')}: {ops?.globalVersion ?? settings?.globalVersion ?? dash}
                </p>
                <p>
                  {t('techJobs', {
                    waiting: ops?.jobs.waiting ?? 0,
                    active: ops?.jobs.active ?? 0,
                    delayed: ops?.jobs.delayed ?? 0,
                    failed: ops?.jobs.failed ?? 0,
                  })}
                </p>
                <p>
                  API usage source: {usage?.source ?? 'LOCAL'}
                </p>
                <p>
                  {t('techLastError')}: {ops?.webhookLastError || settings?.webhookLastError || dash}
                </p>
                <FlexiAbraHooksPanel
                  configuredWebhookUrl={ops?.webhookUrl || settings?.webhookUrl || ''}
                  onChanged={() => void load()}
                />
              </div>

              <details className="rounded-lg border border-amber-500/30 p-3">
                <summary className="cursor-pointer text-sm font-medium">{t('legacyTitle')}</summary>
                <div className="mt-3">
                  <FlexiLegacyRetirementPanel />
                </div>
              </details>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words text-sm">{value.replace('T', ' ').slice(0, 19)}</p>
    </div>
  )
}

function CountLine({ label, value }: { label: string; value?: number }) {
  if (value == null) return null
  return (
    <p>
      {label}: {value}
    </p>
  )
}
