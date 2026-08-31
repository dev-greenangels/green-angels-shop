'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchBackstageContractWithdrawals,
  updateBackstageContractWithdrawalStatus,
  type ContractWithdrawalListItem,
  type ContractWithdrawalStatus,
} from '@/lib/backstage/contract-withdrawals'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: Array<{ value: ContractWithdrawalStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Усі' },
  { value: 'SUBMITTED', label: 'Nové' },
  { value: 'UNDER_REVIEW', label: 'V posudzovaní' },
  { value: 'ACCEPTED', label: 'Prijaté' },
  { value: 'REJECTED', label: 'Zamietnuté' },
  { value: 'CLOSED', label: 'Uzavreté' },
]

function statusLabel(status: ContractWithdrawalStatus): string {
  const map: Record<ContractWithdrawalStatus, string> = {
    SUBMITTED: 'Nové',
    UNDER_REVIEW: 'V posudzovaní',
    ACCEPTED: 'Prijaté',
    REJECTED: 'Zamietnuté',
    CLOSED: 'Uzavreté',
  }
  return map[status]
}

function statusVariant(status: ContractWithdrawalStatus): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'SUBMITTED') return 'default'
  if (status === 'UNDER_REVIEW') return 'secondary'
  if (status === 'REJECTED') return 'destructive'
  return 'outline'
}

function scopeLabel(scope: ContractWithdrawalListItem['scope']): string {
  return scope === 'ENTIRE_ORDER' ? 'Celá objednávka' : 'Čiastočné'
}

export default function BackstageContractWithdrawalsPage() {
  const { locale } = useBackstageUiLocale()
  const [items, setItems] = useState<ContractWithdrawalListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ContractWithdrawalStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageContractWithdrawals({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
      })
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити žiadosti.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  const changeStatus = async (id: string, status: ContractWithdrawalStatus) => {
    try {
      const updated = await updateBackstageContractWithdrawalStatus(id, status)
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
            <h1 className="font-serif text-2xl font-bold md:text-3xl">Odstúpenia od zmluvy</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Online oznámenia zo stránky a z účtu. {total} záznam.
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
              Žiadosti zatiaľ nie sú.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{item.referenceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.customerName} · obj. {item.submittedOrderNumber}
                      </p>
                    </div>
                    <Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
                  </div>
                  <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${item.customerEmail}`}>
                        {item.customerEmail}
                      </a>
                    </p>
                    {item.customerPhone ? (
                      <p>
                        <a className="text-primary underline-offset-4 hover:underline" href={`tel:${item.customerPhone}`}>
                          {item.customerPhone}
                        </a>
                      </p>
                    ) : null}
                    <p>Rozsah: {scopeLabel(item.scope)}</p>
                    <p>Zdroj: {item.source === 'ACCOUNT' ? 'Účet' : 'Verejný formulár'}</p>
                  </div>
                  {item.partialItemsText ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground">{item.partialItemsText}</p>
                  ) : null}
                  {item.lineItems.length > 0 ? (
                    <ul className="list-inside list-disc text-sm text-foreground">
                      {item.lineItems.map((line, index) => (
                        <li key={`${line.orderItemId ?? index}`}>
                          {line.titleSnapshot} — {line.quantity}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(item.submittedAt, locale)} · {item.locale}
                    {item.acknowledgementSentAt
                      ? ` · e-mail ${formatDateTime(item.acknowledgementSentAt, locale)}`
                      : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.status !== 'UNDER_REVIEW' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void changeStatus(item.id, 'UNDER_REVIEW')}
                      >
                        V posudzovaní
                      </Button>
                    ) : null}
                    {item.status !== 'ACCEPTED' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void changeStatus(item.id, 'ACCEPTED')}
                      >
                        Prijať
                      </Button>
                    ) : null}
                    {item.status !== 'REJECTED' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void changeStatus(item.id, 'REJECTED')}
                      >
                        Zamietnuť
                      </Button>
                    ) : null}
                    {item.status !== 'CLOSED' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void changeStatus(item.id, 'CLOSED')}
                      >
                        Uzavrieť
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
