'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search } from 'lucide-react'

import { AdminLayout } from '@/components/admin/admin-layout'
import { OrderDetailsDialog } from '@/components/backstage/order-details-dialog'
import { OrderRowStatusCell } from '@/components/backstage/order-row-status-cell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatOrderCustomerName } from '@/lib/backstage/order-display'
import {
  fetchBackstageOrders,
  type BackstageOrderListItem,
} from '@/lib/backstage/orders'
import {
  fetchOrderStatuses,
  type OrderStatusDefinition,
} from '@/lib/backstage/order-statuses'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { getVisiblePageNumbers } from '@/lib/catalog/pagination'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

function formatMoney(amount: number, currency = 'UAH') {
  if (currency === 'UAH') return `${amount.toLocaleString('uk-UA')} ₴`
  return `${amount.toLocaleString('uk-UA')} ${currency}`
}

export default function OrdersPage() {
  const { locale } = useBackstageUiLocale()
  const [orders, setOrders] = useState<BackstageOrderListItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusDefs, setStatusDefs] = useState<OrderStatusDefinition[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchOrderStatuses(false)
      .then(setStatusDefs)
      .catch(() => setStatusDefs([]))
  }, [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageOrders({
        search: search.trim() || undefined,
        status: statusFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      setOrders(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setOrders([])
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders()
    }, search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadOrders, search])

  const handleStatusUpdated = useCallback((updated: BackstageOrderListItem) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)))
  }, [])

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (error) return null
    if (orders.length === 0) return 'Замовлень поки немає.'
    return null
  }, [loading, error, orders.length])

  const pageNumbers = getVisiblePageNumbers(page, totalPages)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Замовлення</h1>
            <p className="text-muted-foreground">Відстежуйте та керуйте замовленнями</p>
          </div>
          <Button variant="outline" onClick={() => void loadOrders()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Оновити
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Номер, клієнт, телефон, email або сума..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  {statusDefs.map((row) => (
                    <SelectItem key={row.code} value={row.code.toLowerCase()}>
                      {row.nameUk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Замовлення ({total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Завантаження...
              </div>
            ) : emptyMessage ? (
              <p className="py-12 text-center text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Номер
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Клієнт
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Товарів
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Сума
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Статус
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Дата
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{formatOrderCustomerName(order)}</p>
                            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{order.itemCount} шт.</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatMoney(order.totalAmount, order.currency)}
                        </td>
                        <td className="px-4 py-3">
                          <OrderRowStatusCell order={order} onUpdated={handleStatusUpdated} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDateTime(order.createdAt, locale, 'date')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <OrderDetailsDialog
                            orderId={order.id}
                            onStatusUpdated={handleStatusUpdated}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && totalPages > 1 ? (
                  <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                      Сторінка {page} з {totalPages} · усього {total}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Назад
                      </Button>
                      {pageNumbers.map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={pageNumber === page ? 'default' : 'outline'}
                          size="sm"
                          className={cn('min-w-9', pageNumber === page && 'pointer-events-none')}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Далі
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
