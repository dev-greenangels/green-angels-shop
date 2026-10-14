'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { FormSaveBar } from '@/components/backstage/form-save-bar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchPlantStockSettings,
  formatSyncAt,
  syncPlantStockCatalog,
  syncPlantStockStock,
  syncPlantStockWarehouses,
  updatePlantStockSettings,
  type PlantStockSettings,
} from '@/lib/backstage/plant-stock'

function snapshot(s: PlantStockSettings) {
  return JSON.stringify({
    integrationEnabled: s.integrationEnabled,
    serviceReservationCompanyCode: s.serviceReservationCompanyCode,
    serviceReservationComment: s.serviceReservationComment,
    allowedWarehouseCodes: s.allowedWarehouseCodes,
    inventoryTypDoklId: s.inventoryTypDoklId,
  })
}

export function PlantStockSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingCatalog, setSyncingCatalog] = useState(false)
  const [syncingWh, setSyncingWh] = useState(false)
  const [syncingStock, setSyncingStock] = useState(false)
  const [settings, setSettings] = useState<PlantStockSettings | null>(null)
  const [baseline, setBaseline] = useState<string | null>(null)
  const [warehousesText, setWarehousesText] = useState('WHMAIN')

  const apply = useCallback((next: PlantStockSettings) => {
    setSettings(next)
    setWarehousesText(next.allowedWarehouseCodes.join(', '))
    setBaseline(snapshot(next))
  }, [])

  const load = useCallback(async () => {
    try {
      const next = await fetchPlantStockSettings()
      apply(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити PlantStock')
    } finally {
      setLoading(false)
    }
  }, [apply])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => {
    if (!settings || !baseline) return false
    const draft: PlantStockSettings = {
      ...settings,
      allowedWarehouseCodes: warehousesText
        .split(/[,;\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
    }
    return snapshot(draft) !== baseline
  }, [settings, baseline, warehousesText])

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const next = await updatePlantStockSettings({
        integrationEnabled: settings.integrationEnabled,
        serviceReservationCompanyCode: settings.serviceReservationCompanyCode.trim(),
        serviceReservationComment: settings.serviceReservationComment,
        allowedWarehouseCodes: warehousesText
          .split(/[,;\s]+/)
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean),
        inventoryTypDoklId: settings.inventoryTypDoklId?.trim() || null,
      })
      apply(next)
      toast.success('PlantStock налаштування збережено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const runCatalogSync = async () => {
    setSyncingCatalog(true)
    try {
      const res = await syncPlantStockCatalog()
      toast.success(res.message || `Оновлено ${res.upserted}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка sync каталогу')
    } finally {
      setSyncingCatalog(false)
    }
  }

  const runWhSync = async () => {
    setSyncingWh(true)
    try {
      const res = await syncPlantStockWarehouses()
      toast.success(res.message || `Склади: ${res.upserted} з ABRA`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка sync складів')
    } finally {
      setSyncingWh(false)
    }
  }

  const runStockSync = async () => {
    setSyncingStock(true)
    try {
      const res = await syncPlantStockStock()
      toast.success(res.message || `Залишки: ${res.rows}`)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка sync залишків')
    } finally {
      setSyncingStock(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Завантаження PlantStock…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PlantStock SK</CardTitle>
          <CardDescription>
            Налаштування інвентаризації та службових резервів ABRA. Запис резервів і проведення
            inventura на цьому етапі вимкнені. Каталог і залишки оновлюються автоматично (Nest
            scheduler); PWA читає лише PostgreSQL-кеш.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Інтеграцію увімкнено</Label>
              <p className="text-sm text-muted-foreground">Вимикає PlantStock API на Nest.</p>
            </div>
            <Switch
              checked={settings.integrationEnabled}
              onCheckedChange={(v) => setSettings({ ...settings, integrationEnabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-company">Код службової компанії (adresar)</Label>
            <Input
              id="ps-company"
              value={settings.serviceReservationCompanyCode}
              onChange={(e) =>
                setSettings({ ...settings, serviceReservationCompanyCode: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-comment">Коментар резерву за замовчуванням</Label>
            <Textarea
              id="ps-comment"
              value={settings.serviceReservationComment}
              onChange={(e) =>
                setSettings({ ...settings, serviceReservationComment: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-wh">Дозволені склади (коди через кому)</Label>
            <Input
              id="ps-wh"
              value={warehousesText}
              onChange={(e) => setWarehousesText(e.target.value)}
              placeholder="WHMAIN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ps-typ">inventoryTypDoklId (поки порожньо)</Label>
            <Input
              id="ps-typ"
              value={settings.inventoryTypDoklId ?? ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  inventoryTypDoklId: e.target.value.trim() || null,
                })
              }
              placeholder="напр. 1 — після підтвердження"
            />
            <p className="text-sm text-muted-foreground">
              Проведення inventura заблоковане: inventoryPostingEnabled = false.
            </p>
          </div>

          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground space-y-1">
            <p>inventoryPostingEnabled: {String(settings.inventoryPostingEnabled)} (forced off)</p>
            <p>legacyCreateSizeEnabled: {String(settings.legacyCreateSizeEnabled)} (forced off)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Кеш ABRA (read)</CardTitle>
          <CardDescription>
            Автосинхронізація: каталог+strom+склади кожні 6 год; залишки дозволених складів кожні
            20 хв. Ручний Sync лише для форс-оновлення. Магазинний Flexi stock sync не змінюється.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <p>
              Каталог (останній успішний):{' '}
              <span className="font-medium text-foreground">
                {formatSyncAt(settings.lastCatalogSyncAt)}
              </span>
            </p>
            <p>
              Залишки (останній успішний):{' '}
              <span className="font-medium text-foreground">
                {formatSyncAt(settings.lastStockSyncAt)}
              </span>
            </p>
            <p>
              Статус:{' '}
              <span className="font-medium text-foreground">
                {settings.lastSyncOk === true
                  ? 'ok'
                  : settings.lastSyncOk === false
                    ? 'помилка'
                    : '—'}
              </span>
            </p>
            {settings.lastSyncMessage ? (
              <p className="text-muted-foreground">{settings.lastSyncMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => void runCatalogSync()}
              disabled={syncingCatalog}
            >
              {syncingCatalog ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Sync cenik + strom</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runWhSync()}
              disabled={syncingWh}
            >
              {syncingWh ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Sync склади</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void runStockSync()}
              disabled={syncingStock}
            >
              {syncingStock ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Sync залишки</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <FormSaveBar isDirty={dirty} saving={saving} onSave={() => void save()} />
    </div>
  )
}
