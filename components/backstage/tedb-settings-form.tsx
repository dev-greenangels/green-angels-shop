'use client'

import { useCallback, useEffect, useState } from 'react'

import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  fetchTedbRates,
  fetchTedbSettings,
  patchTedbSettings,
  runTedbSync,
  type TedbSyncSettings,
  type VatCountryRateRow,
} from '@/lib/backstage/tedb'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTimeOrDash } from '@/lib/i18n/format-datetime'

export function TedbSettingsForm() {
  const { locale } = useBackstageUiLocale()
  const [settings, setSettings] = useState<TedbSyncSettings | null>(null)
  const [rates, setRates] = useState<VatCountryRateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r] = await Promise.all([fetchTedbSettings(), fetchTedbRates(1)])
      setSettings(s)
      setRates(r.items)
      setDirty(false)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    setMessage(null)
    try {
      const next = await patchTedbSettings({
        enabledAuto: settings.enabledAuto,
        cron: settings.cron,
      })
      setSettings(next)
      setDirty(false)
      setMessage('Збережено')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const syncNow = async () => {
    setSyncing(true)
    setMessage(null)
    try {
      const result = await runTedbSync()
      setMessage(result.message)
      await load()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Помилка синхронізації')
    } finally {
      setSyncing(false)
    }
  }

  if (loading || !settings) {
    return <p className="text-sm text-muted-foreground">Завантаження…</p>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>EU TEDB — ставки ПДВ</CardTitle>
          <CardDescription>
            Оновлення довідника VatCountryRate з офіційного SOAP API ЄС. Рядки з source=manual не
            перезаписуються. Авто-оновлення можна вимкнути.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Авто-оновлення за розкладом</p>
              <p className="text-xs text-muted-foreground">Cron (UTC), напр. 0 6 * * 1 — щопонеділка</p>
            </div>
            <Switch
              checked={settings.enabledAuto}
              onCheckedChange={(checked) => {
                setSettings({ ...settings, enabledAuto: checked })
                setDirty(true)
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Cron</Label>
            <Input
              value={settings.cron}
              onChange={(e) => {
                setSettings({ ...settings, cron: e.target.value })
                setDirty(true)
              }}
              disabled={!settings.enabledAuto}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void syncNow()} disabled={syncing}>
              {syncing ? 'Синхронізація…' : 'Оновити зараз'}
            </Button>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>Останній запуск: {formatDateTimeOrDash(settings.lastRunAt, locale, 'datetimeSeconds')}</p>
            <p>Синхронізовано рядків: {settings.lastSyncedCount}</p>
            {settings.lastError ? (
              <p className="text-destructive">{settings.lastError}</p>
            ) : null}
            {message ? <p className="text-foreground">{message}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ставки в БД</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-2 pr-3">Країна</th>
                  <th className="py-2 pr-3">Тип</th>
                  <th className="py-2 pr-3">%</th>
                  <th className="py-2 pr-3">CN</th>
                  <th className="py-2">Джерело</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((r) => (
                  <tr key={r.id} className="border-b border-border/40">
                    <td className="py-2 pr-3 uppercase">{r.countryCode}</td>
                    <td className="py-2 pr-3">{r.rateType}</td>
                    <td className="py-2 pr-3">{r.percent}</td>
                    <td className="py-2 pr-3">{r.cnPrefixes?.join(', ') || '—'}</td>
                    <td className="py-2">{r.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <FormSaveBar onSave={() => void save()} saving={saving} isDirty={dirty} sticky />
    </div>
  )
}
