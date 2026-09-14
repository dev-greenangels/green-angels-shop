'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchBackstageContractWithdrawals,
  updateBackstageContractWithdrawal,
  type ContractWithdrawalListItem,
  type ContractWithdrawalRefundMethod,
  type ContractWithdrawalStatus,
} from '@/lib/backstage/contract-withdrawals'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { cn } from '@/lib/utils'

function statusVariant(
  status: ContractWithdrawalStatus,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'SUBMITTED' || status === 'REFUND_PENDING') return 'default'
  if (status === 'UNDER_REVIEW' || status === 'WAITING_FOR_RETURN') return 'secondary'
  if (status === 'REJECTED' || status === 'CANCELLED') return 'destructive'
  return 'outline'
}

const WORKFLOW_STATUSES: ContractWithdrawalStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'WAITING_FOR_RETURN',
  'RETURN_RECEIVED',
  'REFUND_PENDING',
  'REFUNDED',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'CLOSED',
]

const REFUND_METHODS: ContractWithdrawalRefundMethod[] = [
  'ORIGINAL_PAYMENT_METHOD',
  'BANK_TRANSFER',
  'CASH_OR_COD_MANUAL',
  'OTHER',
]

type Draft = {
  refundAmount: string
  refundCurrency: string
  refundMethod: ContractWithdrawalRefundMethod | ''
  refundReference: string
  internalNote: string
}

function draftFromItem(item: ContractWithdrawalListItem): Draft {
  return {
    refundAmount:
      item.refundAmount != null
        ? String(item.refundAmount)
        : item.scope === 'ENTIRE_ORDER' && item.orderTotals
          ? String(item.orderTotals.totalAmount)
          : '',
    refundCurrency: item.refundCurrency || item.orderTotals?.currency || '',
    refundMethod: item.refundMethod || '',
    refundReference: item.refundReference || '',
    internalNote: item.internalNote || '',
  }
}

export default function BackstageContractWithdrawalsPage() {
  const { locale } = useBackstageUiLocale()
  const t = useTranslations('pages.contractWithdrawals')
  const [items, setItems] = useState<ContractWithdrawalListItem[]>([])
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<ContractWithdrawalStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const statusFilters = useMemo(
    () =>
      (
        [
          'ALL',
          'SUBMITTED',
          'UNDER_REVIEW',
          'WAITING_FOR_RETURN',
          'RETURN_RECEIVED',
          'REFUND_PENDING',
          'REFUNDED',
          'REJECTED',
          'CANCELLED',
          'CLOSED',
        ] as const
      ).map((value) => ({
        value,
        label: value === 'ALL' ? t('filterAll') : statusLabelKey(t, value),
      })),
    [t],
  )

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
      setDrafts(Object.fromEntries(data.items.map((item) => [item.id, draftFromItem(item)])))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, t])

  useEffect(() => {
    void load()
  }, [load])

  const patchDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] ?? draftFromItem(items.find((i) => i.id === id)!)), ...patch },
    }))
  }

  const applyStatus = async (item: ContractWithdrawalListItem, status: ContractWithdrawalStatus) => {
    const draft = drafts[item.id] ?? draftFromItem(item)
    if (status === 'REFUNDED') {
      const ok = window.confirm(t('confirmRefunded'))
      if (!ok) return
    }

    const amountRaw = draft.refundAmount.trim()
    const amount = amountRaw === '' ? null : Number(amountRaw)
    if (amountRaw !== '' && (Number.isNaN(amount) || (amount as number) < 0)) {
      toast.error(t('invalidRefundAmount'))
      return
    }

    setSavingId(item.id)
    try {
      const updated = await updateBackstageContractWithdrawal(item.id, {
        status,
        refundAmount: amount,
        refundCurrency: draft.refundCurrency.trim() || null,
        refundMethod: draft.refundMethod || null,
        refundReference: draft.refundReference.trim() || null,
        internalNote: draft.internalNote.trim() || null,
        confirmRefundCompleted: status === 'REFUNDED' ? true : undefined,
      })
      setItems((current) => current.map((row) => (row.id === item.id ? updated : row)))
      setDrafts((current) => ({ ...current, [item.id]: draftFromItem(updated) }))
      toast.success(t('statusUpdated'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('statusUpdateError'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('subtitle', { total })}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('manualRefundHint')}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
            {t('refresh')}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
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
            {t('loading')}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('empty')}</CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const draft = drafts[item.id] ?? draftFromItem(item)
              const busy = savingId === item.id
              return (
                <Card key={item.id}>
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.referenceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.customerName} · {t('orderNumber', { number: item.submittedOrderNumber })}
                        </p>
                      </div>
                      <Badge variant={statusVariant(item.status)}>
                        {statusLabelKey(t, item.status)}
                      </Badge>
                    </div>

                    <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        <a
                          className="text-primary underline-offset-4 hover:underline"
                          href={`mailto:${item.customerEmail}`}
                        >
                          {item.customerEmail}
                        </a>
                      </p>
                      {item.customerPhone ? (
                        <p>
                          <a
                            className="text-primary underline-offset-4 hover:underline"
                            href={`tel:${item.customerPhone}`}
                          >
                            {item.customerPhone}
                          </a>
                        </p>
                      ) : null}
                      <p>
                        {t('fieldScope')}:{' '}
                        {item.scope === 'ENTIRE_ORDER' ? t('scopeEntireOrder') : t('scopePartial')}
                      </p>
                      <p>
                        {t('fieldSource')}:{' '}
                        {item.source === 'ACCOUNT' ? t('sourceAccount') : t('sourcePublic')}
                      </p>
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

                    {item.orderTotals ? (
                      <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm">
                        <p className="font-medium text-foreground">{t('orderBreakdownTitle')}</p>
                        <p className="text-muted-foreground">
                          {t('orderBreakdownTotal', {
                            amount: item.orderTotals.totalAmount,
                            currency: item.orderTotals.currency,
                          })}
                        </p>
                        {item.orderTotals.productsSubtotal != null ? (
                          <p className="text-muted-foreground">
                            {t('orderBreakdownProducts', {
                              amount: item.orderTotals.productsSubtotal,
                              currency: item.orderTotals.currency,
                            })}
                          </p>
                        ) : null}
                        {item.orderTotals.deliveryAmount != null ? (
                          <p className="text-muted-foreground">
                            {t('orderBreakdownDelivery', {
                              amount: item.orderTotals.deliveryAmount,
                              currency: item.orderTotals.currency,
                            })}
                          </p>
                        ) : null}
                        <p className="text-muted-foreground">
                          {t('orderBreakdownPayment', { method: item.orderTotals.paymentMethod })}
                        </p>
                        {item.scope === 'PARTIAL' ? (
                          <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                            {t('partialRefundManualHint')}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="space-y-3 rounded-md border border-border/60 p-3">
                      <p className="text-sm font-medium text-foreground">{t('refundSectionTitle')}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`amount-${item.id}`}>{t('refundAmount')}</Label>
                          <Input
                            id={`amount-${item.id}`}
                            inputMode="decimal"
                            value={draft.refundAmount}
                            onChange={(e) => patchDraft(item.id, { refundAmount: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`currency-${item.id}`}>{t('refundCurrency')}</Label>
                          <Input
                            id={`currency-${item.id}`}
                            maxLength={3}
                            value={draft.refundCurrency}
                            onChange={(e) =>
                              patchDraft(item.id, { refundCurrency: e.target.value.toUpperCase() })
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label>{t('refundMethod')}</Label>
                          <Select
                            value={draft.refundMethod || undefined}
                            onValueChange={(value) =>
                              patchDraft(item.id, {
                                refundMethod: value as ContractWithdrawalRefundMethod,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t('refundMethodPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {REFUND_METHODS.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {t(`refundMethod_${method}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor={`ref-${item.id}`}>{t('refundReference')}</Label>
                          <Input
                            id={`ref-${item.id}`}
                            value={draft.refundReference}
                            onChange={(e) => patchDraft(item.id, { refundReference: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor={`note-${item.id}`}>{t('internalNote')}</Label>
                          <Textarea
                            id={`note-${item.id}`}
                            rows={2}
                            value={draft.internalNote}
                            onChange={(e) => patchDraft(item.id, { internalNote: e.target.value })}
                          />
                        </div>
                      </div>
                      {item.returnReceivedAt ? (
                        <p className="text-xs text-muted-foreground">
                          {t('returnReceivedAt', {
                            date: formatDateTime(item.returnReceivedAt, locale),
                          })}
                        </p>
                      ) : null}
                      {item.refundedAt ? (
                        <p className="text-xs text-muted-foreground">
                          {t('refundedAt', { date: formatDateTime(item.refundedAt, locale) })}
                        </p>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.submittedAt, locale)} · {item.locale}
                      {item.acknowledgementSentAt
                        ? ` ${t('emailAck', {
                            date: formatDateTime(item.acknowledgementSentAt, locale),
                          })}`
                        : ''}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {WORKFLOW_STATUSES.filter((status) => status !== item.status).map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={status === 'REFUNDED' ? 'default' : 'outline'}
                          disabled={busy}
                          onClick={() => void applyStatus(item, status)}
                        >
                          {actionLabel(t, status)}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {totalPages > 1 ? (
              <div className="flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((n) => n - 1)}
                >
                  {t('paginationPrev')}
                </Button>
                <span className="self-center text-sm text-muted-foreground">
                  {t('paginationPage', { page, totalPages })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((n) => n + 1)}
                >
                  {t('paginationNext')}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function statusLabelKey(
  t: ReturnType<typeof useTranslations<'pages.contractWithdrawals'>>,
  status: ContractWithdrawalStatus,
) {
  const map: Record<ContractWithdrawalStatus, string> = {
    SUBMITTED: t('statusSubmitted'),
    UNDER_REVIEW: t('statusUnderReview'),
    ACCEPTED: t('statusAccepted'),
    REJECTED: t('statusRejected'),
    CLOSED: t('statusClosed'),
    WAITING_FOR_RETURN: t('statusWaitingForReturn'),
    RETURN_RECEIVED: t('statusReturnReceived'),
    REFUND_PENDING: t('statusRefundPending'),
    REFUNDED: t('statusRefunded'),
    CANCELLED: t('statusCancelled'),
  }
  return map[status]
}

function actionLabel(
  t: ReturnType<typeof useTranslations<'pages.contractWithdrawals'>>,
  status: ContractWithdrawalStatus,
) {
  const map: Partial<Record<ContractWithdrawalStatus, string>> = {
    UNDER_REVIEW: t('actionUnderReview'),
    WAITING_FOR_RETURN: t('actionWaitingForReturn'),
    RETURN_RECEIVED: t('actionReturnReceived'),
    REFUND_PENDING: t('actionRefundPending'),
    REFUNDED: t('actionRefunded'),
    ACCEPTED: t('actionAccept'),
    REJECTED: t('actionReject'),
    CANCELLED: t('actionCancel'),
    CLOSED: t('actionClose'),
    SUBMITTED: t('actionSubmitted'),
  }
  return map[status] ?? statusLabelKey(t, status)
}
