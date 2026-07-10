'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  createCurrency,
  createUnit,
  deleteCurrency,
  deleteUnit,
  fetchCommerceDefaults,
  fetchCurrencies,
  fetchUnitsOfMeasure,
  updateCommerceDefaults,
  updateCurrency,
  updateUnit,
  type UpsertCurrencyPayload,
  type UpsertUnitPayload,
} from '@/lib/backstage/reference-data'
import type { CommerceDefaultsSettings, CurrencyInfo, UnitOfMeasureInfo } from '@/lib/commerce/types'

const UNIT_TYPES: UpsertUnitPayload['type'][] = ['COUNT', 'WEIGHT', 'VOLUME', 'LENGTH', 'AREA']

function translationName(row: { translations: Array<{ locale: string; name: string }> }, locale = 'uk') {
  return row.translations.find((t) => t.locale === locale)?.name ?? row.translations[0]?.name ?? ''
}

export default function ReferenceDataPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [defaults, setDefaults] = useState<CommerceDefaultsSettings | null>(null)
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([])
  const [units, setUnits] = useState<UnitOfMeasureInfo[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [defaultsData, currenciesData, unitsData] = await Promise.all([
        fetchCommerceDefaults(),
        fetchCurrencies(),
        fetchUnitsOfMeasure(),
      ])
      setDefaults(defaultsData)
      setCurrencies(currenciesData)
      setUnits(unitsData)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити довідники')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveDefaults = async () => {
    if (!defaults) return
    setSaving(true)
    try {
      const next = await updateCommerceDefaults(defaults)
      setDefaults(next)
      toast.success('Налаштування збережено')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти')
    } finally {
      setSaving(false)
    }
  }

  const addCurrency = async () => {
    const code = window.prompt('Код валюти (ISO 4217), напр. USD')?.trim().toUpperCase()
    if (!code || code.length !== 3) return
    const symbol = window.prompt('Символ, напр. $')?.trim()
    const nameUk = window.prompt('Назва (uk)')?.trim()
    if (!symbol || !nameUk) return
    const payload: UpsertCurrencyPayload = {
      code,
      symbol,
      decimals: 2,
      isActive: true,
      sortOrder: currencies.length + 1,
      translations: [
        { locale: 'uk', name: nameUk },
        { locale: 'en', name: nameUk },
      ],
    }
    try {
      await createCurrency(payload)
      toast.success('Валюту додано')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const editCurrency = async (row: CurrencyInfo) => {
    const symbol = window.prompt('Символ', row.symbol)?.trim()
    const nameUk = window.prompt('Назва (uk)', translationName(row))?.trim()
    if (!symbol || !nameUk) return
    const payload: UpsertCurrencyPayload = {
      code: row.code,
      symbol,
      isoNumericCode: row.isoNumericCode,
      decimals: row.decimals,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      translations: row.translations.map((t) =>
        t.locale === 'uk' ? { ...t, name: nameUk } : t,
      ),
    }
    try {
      await updateCurrency(row.code, payload)
      toast.success('Валюту оновлено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const removeCurrency = async (code: string) => {
    if (!window.confirm(`Видалити валюту ${code}?`)) return
    try {
      await deleteCurrency(code)
      toast.success('Валюту видалено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const addUnit = async () => {
    const code = window.prompt('Код одиниці, напр. pcs')?.trim().toLowerCase()
    const symbol = window.prompt('Символ, напр. шт')?.trim()
    const nameUk = window.prompt('Назва (uk)')?.trim()
    if (!code || !symbol || !nameUk) return
    const payload: UpsertUnitPayload = {
      code,
      symbol,
      type: 'COUNT',
      decimals: 0,
      isActive: true,
      sortOrder: units.length + 1,
      translations: [
        { locale: 'uk', name: nameUk },
        { locale: 'en', name: nameUk },
      ],
    }
    try {
      await createUnit(payload)
      toast.success('Одиницю додано')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const editUnit = async (row: UnitOfMeasureInfo) => {
    const symbol = window.prompt('Символ', row.symbol)?.trim()
    const nameUk = window.prompt('Назва (uk)', translationName(row))?.trim()
    if (!symbol || !nameUk) return
    const payload: UpsertUnitPayload = {
      code: row.code,
      symbol,
      type: row.type as UpsertUnitPayload['type'],
      decimals: row.decimals,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      translations: row.translations.map((t) =>
        t.locale === 'uk' ? { ...t, name: nameUk } : t,
      ),
    }
    try {
      await updateUnit(row.id, payload)
      toast.success('Одиницю оновлено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  const removeUnit = async (id: string) => {
    if (!window.confirm('Видалити одиницю виміру?')) return
    try {
      await deleteUnit(id)
      toast.success('Одиницю видалено')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Помилка')
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Довідники</h1>
          <p className="text-sm text-muted-foreground">Валюти та одиниці виміру для каталогу й цін.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>За замовчуванням</CardTitle>
                <CardDescription>Валюта та одиниця продажу для нових варіантів товарів.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Валюта</Label>
                  <Select
                    value={defaults?.defaultCurrencyCode ?? 'UAH'}
                    onValueChange={(value) =>
                      setDefaults((prev) => (prev ? { ...prev, defaultCurrencyCode: value } : prev))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.filter((c) => c.isActive).map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.symbol} ({translationName(c)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Одиниця виміру</Label>
                  <Select
                    value={defaults?.defaultSalesUnitCode ?? 'pcs'}
                    onValueChange={(value) =>
                      setDefaults((prev) => (prev ? { ...prev, defaultSalesUnitCode: value } : prev))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.filter((u) => u.isActive).map((u) => (
                        <SelectItem key={u.id} value={u.code}>
                          {u.symbol} — {translationName(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="button" onClick={() => void saveDefaults()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Зберегти налаштування
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="currencies">
              <TabsList>
                <TabsTrigger value="currencies">Валюти</TabsTrigger>
                <TabsTrigger value="units">Одиниці виміру</TabsTrigger>
              </TabsList>

              <TabsContent value="currencies" className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => void addCurrency()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати валюту
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Код</th>
                        <th className="px-4 py-3 font-medium">Символ</th>
                        <th className="px-4 py-3 font-medium">Назва</th>
                        <th className="px-4 py-3 font-medium">Активна</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {currencies.map((row) => (
                        <tr key={row.code} className="border-t">
                          <td className="px-4 py-3 font-mono">{row.code}</td>
                          <td className="px-4 py-3">{row.symbol}</td>
                          <td className="px-4 py-3">{translationName(row)}</td>
                          <td className="px-4 py-3">{row.isActive ? 'Так' : 'Ні'}</td>
                          <td className="px-4 py-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => void editCurrency(row)}>
                              Редагувати
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => void removeCurrency(row.code)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="units" className="mt-4 space-y-4">
                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={() => void addUnit()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати одиницю
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-4 py-3 font-medium">Код</th>
                        <th className="px-4 py-3 font-medium">Символ</th>
                        <th className="px-4 py-3 font-medium">Тип</th>
                        <th className="px-4 py-3 font-medium">Назва</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-4 py-3 font-mono">{row.code}</td>
                          <td className="px-4 py-3">{row.symbol}</td>
                          <td className="px-4 py-3">{row.type}</td>
                          <td className="px-4 py-3">{translationName(row)}</td>
                          <td className="px-4 py-3 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => void editUnit(row)}>
                              Редагувати
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => void removeUnit(row.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Типи: {UNIT_TYPES.join(', ')}
                </p>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
