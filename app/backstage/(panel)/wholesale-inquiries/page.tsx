'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchBackstageWholesaleInquiries,
  updateBackstageWholesaleInquiryStatus,
  type WholesaleInquiryListItem,
  type WholesaleInquiryStatus,
} from '@/lib/backstage/wholesale-inquiries'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: Array<{ value: WholesaleInquiryStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Усі' },
  { value: 'NEW', label: 'Нові' },
  { value: 'IN_PROGRESS', label: 'В роботі' },
  { value: 'CLOSED', label: 'Закриті' },
]

function statusLabel(status: WholesaleInquiryStatus): string {
  if (status === 'NEW') return 'Нова'
  if (status === 'IN_PROGRESS') return 'В роботі'
  return 'Закрита'
}

function statusVariant(status: WholesaleInquiryStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'NEW') return 'default'
  if (status === 'IN_PROGRESS') return 'secondary'
  return 'outline'
}

export default function BackstageWholesaleInquiriesPage() {
  const { locale } = useBackstageUiLocale()
  const [items, setItems] = useState<WholesaleInquiryListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<WholesaleInquiryStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageWholesaleInquiries({ status: statusFilter, page })
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити заявки.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  const changeStatus = async (id: string, status: WholesaleInquiryStatus) => {
    try {
      const updated = await updateBackstageWholesaleInquiryStatus(id, status)
      setItems((current) => current.map((row) => (row.id === id ? updated : row)))
      toast.success('Статус оновлено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося оновити статус.')
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">Заявки гурту</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Запити зі сторінки співпраці. {total} запис.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            Оновити
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              onClick={() => {
                setStatusFilter(filter.value)
                setPage(1)
              }}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Завантаження…
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Заявок поки немає.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.companyName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.fullName} · {item.city}
                      </p>
                    </div>
                    <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                  <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${item.email}`}>
                        {item.email}
                      </a>
                    </p>
                    <p>
                      <a className="text-primary underline-offset-4 hover:underline" href={`tel:${item.phone}`}>
                        {item.phone}
                      </a>
                    </p>
                    {item.website ? (
                      <p className="sm:col-span-2 break-all">
                        <a
                          className="text-primary underline-offset-4 hover:underline"
                          href={item.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.website}
                        </a>
                      </p>
                    ) : null}
                    {item.companyIco ? <p>IČO: {item.companyIco}</p> : null}
                    {item.companyVatId ? <p>IČ DPH: {item.companyVatId}</p> : null}
                  </div>
                  {item.message ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground">{item.message}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.createdAt, locale)} · {item.marketRegion.toUpperCase()} ·{' '}
                    {item.locale}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.status !== 'IN_PROGRESS' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void changeStatus(item.id, 'IN_PROGRESS')}
                      >
                        В роботу
                      </Button>
                    ) : null}
                    {item.status !== 'CLOSED' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void changeStatus(item.id, 'CLOSED')}
                      >
                        Закрити
                      </Button>
                    ) : null}
                    {item.status !== 'NEW' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void changeStatus(item.id, 'NEW')}
                      >
                        Нова
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
            {totalPages > 1 ? (
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((n) => n - 1)}
                >
                  Назад
                </Button>
                <span className="self-center text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((n) => n + 1)}
                >
                  Далі
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
