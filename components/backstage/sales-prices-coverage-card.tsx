'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  fetchSalesPricesCoverage,
  fetchSalesPricesMissing,
  runFlexiSalesPricesSync,
  type SalesPricesCoverage,
  type SalesPricesMissingPage,
} from '@/lib/backstage/flexi'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTimeOrDash } from '@/lib/i18n/format-datetime'

export function SalesPricesCoverageCard() {
  const { locale: uiLocale } = useBackstageUiLocale()
  const [coverage, setCoverage] = useState<SalesPricesCoverage | null>(null)
  const [missing, setMissing] = useState<SalesPricesMissingPage | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async (nextPage = page, nextSearch = search) => {
    setLoading(true)
    try {
      const [cov, miss] = await Promise.all([
        fetchSalesPricesCoverage(),
        fetchSalesPricesMissing({ search: nextSearch || undefined, page: nextPage, pageSize: 20 }),
      ])
      setCoverage(cov)
      setMissing(miss)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не вдалося завантажити coverage')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    void load(1, '')
  }, [])

  const pickName = (rows: Array<{ locale: string; name: string }>) =>
    rows.find((r) => r.locale === uiLocale)?.name ??
    rows.find((r) => r.locale === 'uk')?.name ??
    rows[0]?.name ??
    '—'

  return (
    <Card>
      <CardHeader>
        <CardTitle>ABRA Sales Prices</CardTitle>
        <CardDescription>
          Синхронізація `/odberatel` і `/cenikova-skupina` для гуртових цін. Не змінює Product
          Card для роздробу. Перемикач джерела базової ціни WHOLESALER — у Market settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true)
              try {
                const r = await runFlexiSalesPricesSync()
                if (r.ok) toast.success(r.message)
                else toast.error(r.message)
                await load(page, search)
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Sync failed')
              } finally {
                setSyncing(false)
              }
            }}
          >
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-2">Синхронізувати Sales Prices</span>
          </Button>
          <Button type="button" variant="outline" disabled={loading} onClick={() => void load()}>
            Оновити coverage
          </Button>
        </div>

        {coverage ? (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              Валюта: <strong>{coverage.currency}</strong>
            </p>
            <p>
              Остання успішна синхронізація:{' '}
              <strong>
                {formatDateTimeOrDash(coverage.lastSync.lastSuccessAt, uiLocale)}
              </strong>
            </p>
            <p>
              Варіантів без загальної Sales Price:{' '}
              <strong>{coverage.missingGeneralSalesPrice}</strong> /{' '}
              {coverage.publishedVariantCount}
            </p>
            <p>
              Лише спеціальні (GROUP/COMPANY):{' '}
              <strong>{coverage.onlySpecialSalesPrice}</strong>
            </p>
            {coverage.lastSync.lastMessage ? (
              <p className="sm:col-span-2 text-muted-foreground">{coverage.lastSync.lastMessage}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Пошук проблемних варіантів</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SKU / EAN / назва"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPage(1)
              void load(1, search)
            }}
          >
            Шукати
          </Button>
        </div>

        {missing ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Сторінка {missing.page} / {missing.totalPages} · всього {missing.total}
            </p>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">Товар</th>
                    <th className="px-2 py-1.5 font-medium">SKU</th>
                    <th className="px-2 py-1.5 font-medium">Розмір</th>
                    <th className="px-2 py-1.5 font-medium">Категорія</th>
                    <th className="px-2 py-1.5 font-medium">Причина</th>
                  </tr>
                </thead>
                <tbody>
                  {missing.items.map((row) => (
                    <tr key={row.variantId} className="border-b last:border-0">
                      <td className="px-2 py-1.5">{pickName(row.productNames)}</td>
                      <td className="px-2 py-1.5 font-mono text-xs">{row.sku ?? '—'}</td>
                      <td className="px-2 py-1.5">{row.sizeLabel ?? '—'}</td>
                      <td className="px-2 py-1.5">{pickName(row.categoryNames)}</td>
                      <td className="px-2 py-1.5">
                        {row.reason === 'ONLY_SPECIAL'
                          ? 'Лише GROUP/COMPANY'
                          : 'Немає актуальної ALL'}
                      </td>
                    </tr>
                  ))}
                  {!missing.items.length ? (
                    <tr>
                      <td className="px-2 py-3 text-muted-foreground" colSpan={5}>
                        Немає проблемних варіантів за цим фільтром.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => {
                  const next = Math.max(1, page - 1)
                  setPage(next)
                  void load(next, search)
                }}
              >
                Назад
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!missing || page >= missing.totalPages || loading}
                onClick={() => {
                  const next = page + 1
                  setPage(next)
                  void load(next, search)
                }}
              >
                Далі
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
