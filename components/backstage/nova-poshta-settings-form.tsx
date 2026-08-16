'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Save, XCircle } from 'lucide-react'
import { toast } from '@/lib/toast'

import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { NovaPoshtaAutoSyncFields, DEFAULT_AUTO_SYNC_CONFIG } from '@/components/backstage/nova-poshta-auto-sync-fields'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  cancelNovaPoshtaSync,
  fetchNovaPoshtaSettings,
  fetchNovaPoshtaSyncStatus,
  triggerNovaPoshtaSync,
  updateNovaPoshtaSettings,
} from '@/lib/backstage/nova-poshta'
import {
  formatSyncRunLabel,
  formatSyncRunProgress,
  formatTargetLastSync,
  TARGET_LABELS,
  type NovaPoshtaSettings,
  type NovaPoshtaSyncStatus,
  type NpSyncTarget,
  type NpTargetLastSync,
} from '@/lib/nova-poshta/types'

const DEFAULT_SETTINGS: NovaPoshtaSettings = {
  apiKeyConfigured: false,
  apiKeyMasked: '',
  apiKeySource: 'none',
  jsonApiUrl: '',
  effectiveJsonApiUrl: 'https://api.novaposhta.ua/v2.0/json/',
  jsonApiUrlSource: 'default',
  syncPageSizes: {
    settlements: 150,
    warehouses: 6500,
  },
  syncPageSizeLimits: {
    settlements: 150,
    warehouses: 6500,
  },
  autoSync: DEFAULT_AUTO_SYNC_CONFIG,
}

const TARGET_ORDER: Array<NpTargetLastSync['target']> = [
  'settlements',
  'warehouses',
  'warehouse_types',
]

function targetStatusClass(status: NpTargetLastSync['status'] | undefined): string {
  if (status === 'failed') return 'text-destructive'
  if (status === 'completed') return 'text-emerald-700 dark:text-emerald-400'
  if (status === 'cancelled') return 'text-amber-700 dark:text-amber-400'
  return 'text-muted-foreground'
}

export function NovaPoshtaSettingsForm() {
  const { locale } = useBackstageUiLocale()
  const [settings, setSettings] = useState<NovaPoshtaSettings>(DEFAULT_SETTINGS)
  const [baseline, setBaseline] = useState<string | null>(null)
  const [status, setStatus] = useState<NovaPoshtaSyncStatus | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<NpSyncTarget | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const dirty =
    Boolean(baseline && JSON.stringify({ settings, apiKey }) !== baseline) || apiKey.trim().length > 0

  const refreshStatus = useCallback(async () => {
    const nextStatus = await fetchNovaPoshtaSyncStatus()
    setStatus(nextStatus)
    return nextStatus
  }, [])

  const load = useCallback(async () => {
    try {
      const [nextSettings, nextStatus] = await Promise.all([
        fetchNovaPoshtaSettings(),
        fetchNovaPoshtaSyncStatus(),
      ])
      const merged = {
        ...DEFAULT_SETTINGS,
        ...nextSettings,
        syncPageSizes: {
          ...DEFAULT_SETTINGS.syncPageSizes,
          ...nextSettings.syncPageSizes,
        },
        syncPageSizeLimits: {
          ...DEFAULT_SETTINGS.syncPageSizeLimits,
          ...nextSettings.syncPageSizeLimits,
        },
        autoSync: nextSettings.autoSync ?? DEFAULT_SETTINGS.autoSync,
      }
      setSettings(merged)
      setApiKey('')
      setBaseline(JSON.stringify({ settings: merged, apiKey: '' }))
      setStatus(nextStatus)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити налаштування НП.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const shouldPoll = Boolean(status?.isRunning || syncing)
    if (!shouldPoll) return

    const timer = window.setInterval(() => {
      void refreshStatus()
        .then((next) => {
          if (!next.isRunning && syncing) {
            setSyncing(null)
            const failed = TARGET_ORDER.map((t) => next.lastByTarget?.[t]).find(
              (entry) => entry?.status === 'failed',
            )
            if (next.lastRun?.status === 'failed' || failed) {
              toast.error(
                failed?.error ??
                  next.lastRun?.error ??
                  'Синхронізація завершилась з помилкою.',
              )
              void load()
            } else if (next.lastRun?.status === 'completed') {
              toast.success('Синхронізацію завершено.')
              void load()
            } else if (next.lastRun?.status === 'cancelled') {
              toast.message('Синхронізацію скасовано.')
              void load()
            } else {
              void load()
            }
          }
        })
        .catch(() => undefined)
    }, 2000)

    return () => window.clearInterval(timer)
  }, [status?.isRunning, syncing, refreshStatus, load])

  const save = async () => {
    setSaving(true)
    try {
      const payload: {
        apiKey?: string
        jsonApiUrl?: string
        syncPageSizes: NovaPoshtaSettings['syncPageSizes']
        autoSync: NovaPoshtaSettings['autoSync']
      } = {
        jsonApiUrl: settings.jsonApiUrl.trim(),
        syncPageSizes: settings.syncPageSizes,
        autoSync: settings.autoSync,
      }
      if (apiKey.trim()) payload.apiKey = apiKey.trim()
      const next = await updateNovaPoshtaSettings(payload)
      setSettings(next)
      setApiKey('')
      setBaseline(JSON.stringify({ settings: next, apiKey: '' }))
      toast.success('Налаштування Нової Пошти збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти.')
    } finally {
      setSaving(false)
    }
  }

  const runSync = async (target: NpSyncTarget) => {
    setSyncing(target)
    try {
      const result = await triggerNovaPoshtaSync(target)
      if (!result.queued) {
        toast.message('Синхронізація вже виконується.')
        await refreshStatus()
        return
      }
      toast.success('Синхронізацію запущено.')
      await refreshStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося запустити синхронізацію.')
      await refreshStatus().catch(() => undefined)
      setSyncing(null)
    }
  }

  const cancelSync = async () => {
    setCancelling(true)
    try {
      const result = await cancelNovaPoshtaSync()
      toast.success(
        result.runsUpdated
          ? `Синхронізацію скасовано (${result.runsUpdated} записів оновлено).`
          : 'Синхронізацію скасовано.',
      )
      setSyncing(null)
      await refreshStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося скасувати синхронізацію.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Завантаження…
      </div>
    )
  }

  const jsonUrlPlaceholder =
    settings.effectiveJsonApiUrl || 'https://api.novaposhta.ua/v2.0/json/'
  const activeRun = status?.activeRun ?? null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Нової Пошти</CardTitle>
          <CardDescription>
            Зараз використовується <code>{settings.effectiveJsonApiUrl}</code>. Ключ:{' '}
            {settings.apiKeySource === 'database'
              ? 'бек-офіс'
              : settings.apiKeySource === 'env'
                ? 'NOVA_POSHTA_API_KEY'
                : 'не налаштовано'}
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-api-key">API ключ</Label>
            <Input
              id="np-api-key"
              type="password"
              placeholder={settings.apiKeyConfigured ? settings.apiKeyMasked : 'Вкажіть API ключ'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="np-json-url">URL JSON API</Label>
            <Input
              id="np-json-url"
              placeholder={jsonUrlPlaceholder}
              value={settings.jsonApiUrl}
              onChange={(e) => setSettings({ ...settings, jsonApiUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="np-page-size-settlements">Сторінка: населені пункти</Label>
            <Input
              id="np-page-size-settlements"
              type="number"
              min={1}
              max={settings.syncPageSizeLimits.settlements}
              value={settings.syncPageSizes.settlements}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  syncPageSizes: {
                    ...settings.syncPageSizes,
                    settlements: Math.max(
                      1,
                      Math.min(
                        settings.syncPageSizeLimits.settlements,
                        Math.trunc(Number(e.target.value) || settings.syncPageSizeLimits.settlements),
                      ),
                    ),
                  },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              getSettlements — макс. {settings.syncPageSizeLimits.settlements} записів на сторінку
              (документація НП).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="np-page-size-warehouses">Сторінка: відділення</Label>
            <Input
              id="np-page-size-warehouses"
              type="number"
              min={1}
              max={settings.syncPageSizeLimits.warehouses}
              value={settings.syncPageSizes.warehouses}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  syncPageSizes: {
                    ...settings.syncPageSizes,
                    warehouses: Math.max(
                      1,
                      Math.min(
                        settings.syncPageSizeLimits.warehouses,
                        Math.trunc(Number(e.target.value) || 6500),
                      ),
                    ),
                  },
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              getWarehouses — макс. {settings.syncPageSizeLimits.warehouses} записів на сторінку
              (документація НП). Окремі запити по TypeOfWarehouseRef; цикл до порожнього блоку
              даних. Між сторінками — пауза 20 с (до 3 запитів/хв).
            </p>
          </div>
          <NovaPoshtaAutoSyncFields
            autoSync={settings.autoSync}
            onChange={(autoSync) => setSettings({ ...settings, autoSync })}
          />
          <div className="sm:col-span-2">
            <Button type="button" onClick={() => void save()} disabled={saving || !dirty}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Зберегти
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Довідники</CardTitle>
          <CardDescription>
            Міста та відділення зберігаються в БД. Вулиці — онлайн-пошук через API НП. Статус
            кожного довідника зберігається до наступного планового або ручного оновлення.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <div className="space-y-3 rounded-lg border p-4 text-sm">
              <p>
                У базі: населені пункти{' '}
                <strong>{status.counts.settlements.toLocaleString('uk-UA')}</strong> · відділення{' '}
                <strong>{status.counts.warehouses.toLocaleString('uk-UA')}</strong> · типи{' '}
                <strong>{status.counts.warehouseTypes.toLocaleString('uk-UA')}</strong>
              </p>

              {status.isRunning && activeRun && (
                <p className="font-medium text-primary">
                  Зараз виконується: {formatSyncRunLabel(activeRun)} ·{' '}
                  {formatSyncRunProgress(activeRun)}
                  <br />
                  <span className="text-xs font-normal text-muted-foreground">
                    Початок: {formatDateTime(activeRun.startedAt, locale, 'datetimeSeconds')}
                  </span>
                </p>
              )}

              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Останнє оновлення по довідниках
                </p>
                <ul className="space-y-2">
                  {TARGET_ORDER.map((target) => {
                    const entry = status.lastByTarget?.[target] ?? null
                    if (!entry) {
                      return (
                        <li key={target} className="text-muted-foreground">
                          {TARGET_LABELS[target]}: ще не було синхронізації
                        </li>
                      )
                    }
                    const formatted = formatTargetLastSync(entry, locale)
                    return (
                      <li key={target} className={targetStatusClass(entry.status)}>
                        <p>{formatted.summary}</p>
                        {formatted.error ? (
                          <p className="mt-1 break-words text-xs font-normal opacity-90">
                            Помилка НП: {formatted.error}
                          </p>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['all', 'Оновити все'],
                ['settlements', 'Міста'],
                ['warehouses', 'Відділення'],
                ['warehouse_types', 'Типи відділень'],
              ] as const
            ).map(([target, label]) => (
              <Button
                key={target}
                type="button"
                variant="outline"
                disabled={Boolean(syncing) || status?.isRunning}
                onClick={() => void runSync(target)}
              >
                {syncing === target ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {label}
              </Button>
            ))}
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling}
              onClick={() => void cancelSync()}
            >
              {cancelling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Скасувати / скинути
            </Button>
            <Button type="button" variant="ghost" onClick={() => void load()}>
              Оновити статус
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
