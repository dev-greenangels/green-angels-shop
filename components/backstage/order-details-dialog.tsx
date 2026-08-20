'use client'

import { useEffect, useState } from 'react'
import { Eye, Loader2, Package, RefreshCw } from 'lucide-react'
import { toast } from '@/lib/toast'

import { CancelOrderDialog } from '@/components/backstage/cancel-order-dialog'
import { OrderStatusBadge, OrderStatusSelect } from '@/components/backstage/order-status-select'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
} from '@/lib/backstage/order-status'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import {
  formatOrderCustomerName,
  formatOrderDeliveryLines,
  isOrderReceiverDifferent,
} from '@/lib/backstage/order-display'
import { formatDateTime, formatDateTimeOrDash } from '@/lib/i18n/format-datetime'
import { formatStoreAddress } from '@/lib/settings/store-helpers'
import {
  fetchBackstageOrder,
  patchBackstageOrder,
  patchBackstageOrderStatus,
  syncBackstageOrderTracking,
  type BackstageOrderDetail,
  type BackstageOrderListItem,
} from '@/lib/backstage/orders'

function formatMoney(amount: number, currency = 'UAH') {
  if (currency === 'UAH') return `${amount.toLocaleString('uk-UA')} ₴`
  return `${amount.toLocaleString('uk-UA')} ${currency}`
}

export function OrderDetailsDialog({
  orderId,
  onStatusUpdated,
}: {
  orderId: string
  onStatusUpdated: (order: BackstageOrderListItem) => void
}) {
  const store = useStoreSettings()
  const { locale } = useBackstageUiLocale()
  const pickupAddress = formatStoreAddress(store)
  const [open, setOpen] = useState(false)
  const [order, setOrder] = useState<BackstageOrderDetail | null>(null)
  const [status, setStatus] = useState<OrderStatus>('PENDING')
  const [ttn, setTtn] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchBackstageOrder(orderId)
      .then((detail) => {
        if (cancelled) return
        setOrder(detail)
        setStatus(detail.status)
        setTtn(detail.trackingNumber ?? '')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
        setOrder(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, orderId])

  const applyOrder = (detail: BackstageOrderDetail) => {
    setOrder(detail)
    setStatus(detail.status)
    setTtn(detail.trackingNumber ?? '')
    onStatusUpdated(detail)
  }

  const handleSaveStatus = async () => {
    if (!order || status === order.status) return
    if (status === 'CANCELLED') {
      setCancelOpen(true)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const updated = await patchBackstageOrderStatus(order.id, status)
      applyOrder(updated as BackstageOrderDetail)
      toast.success(`Статус ${order.orderNumber} оновлено.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти статус.')
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти статус.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTtn = async () => {
    if (!order) return
    const next = ttn.trim()
    if (next === (order.trackingNumber ?? '')) return
    setSaving(true)
    setError(null)
    try {
      const updated = await patchBackstageOrder(order.id, {
        trackingNumber: next || null,
        trackingCarrier: next ? 'nova-poshta' : null,
      })
      applyOrder(updated as BackstageOrderDetail)
      toast.success('ТТН збережено.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти ТТН.')
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти ТТН.')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncTtn = async () => {
    if (!order) return
    setSyncing(true)
    setError(null)
    try {
      if (ttn.trim() && ttn.trim() !== (order.trackingNumber ?? '')) {
        await patchBackstageOrder(order.id, {
          trackingNumber: ttn.trim(),
          trackingCarrier: 'nova-poshta',
        })
      }
      const updated = await syncBackstageOrderTracking(order.id)
      applyOrder(updated)
      toast.success('ТТН синхронізовано з Новою Поштою.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося синхронізувати ТТН.')
      toast.error(err instanceof Error ? err.message : 'Не вдалося синхронізувати ТТН.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Переглянути замовлення">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
          <DialogTitle className="font-serif text-xl">
            {order ? `Замовлення ${order.orderNumber}` : 'Замовлення'}
          </DialogTitle>
          {order ? (
            <p className="text-sm text-muted-foreground">
              {formatOrderCustomerName(order)} ·{' '}
              {formatDateTime(order.createdAt, locale, 'datetime')}
            </p>
          ) : null}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Завантаження...
          </div>
        ) : order ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Статус замовлення</span>
                  <OrderStatusBadge
                    status={order.status}
                    label={order.statusLabel}
                    className="px-3 py-1 text-sm"
                  />
                </div>

                {order.status === 'CANCELLED' && order.cancellationReasonName ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                    <p>
                      <span className="text-red-700">Причина:</span> {order.cancellationReasonName}
                    </p>
                    {order.cancellationNote ? (
                      <p className="mt-1">
                        <span className="text-red-700">Коментар:</span> {order.cancellationNote}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h4 className="font-semibold">ТТН / відстеження</h4>
                  <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                    <div className="space-y-2">
                      <Label htmlFor="order-ttn">Номер ТТН</Label>
                      <Input
                        id="order-ttn"
                        value={ttn}
                        onChange={(e) => setTtn(e.target.value)}
                        placeholder="2045xxxxxxxx"
                      />
                    </div>
                    {order.trackingSyncedAt ? (
                      <p className="text-xs text-muted-foreground">
                        Синхронізовано:{' '}
                        {formatDateTimeOrDash(order.trackingSyncedAt, locale, 'datetime')}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={saving || ttn.trim() === (order.trackingNumber ?? '')}
                        onClick={() => void handleSaveTtn()}
                      >
                        Зберегти ТТН
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={syncing || !ttn.trim()}
                        onClick={() => void handleSyncTtn()}
                      >
                        <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                        Синхронізувати з НП
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Замовник</h4>
                  <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">Прізвище:</span> {order.customerLastName}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Ім&apos;я:</span> {order.customerFirstName}
                    </p>
                    {order.customerPatronymic ? (
                      <p>
                        <span className="text-muted-foreground">По батькові:</span>{' '}
                        {order.customerPatronymic}
                      </p>
                    ) : null}
                    {order.customerEmail ? (
                      <p>
                        <span className="text-muted-foreground">Email:</span> {order.customerEmail}
                      </p>
                    ) : null}
                    <p>
                      <span className="text-muted-foreground">Телефон:</span> {order.customerPhone}
                    </p>
                  </div>
                </div>

                {isOrderReceiverDifferent(order) ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Отримувач</h4>
                    <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                      <p>
                        <span className="text-muted-foreground">Прізвище:</span> {order.receiverLastName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Ім&apos;я:</span> {order.receiverFirstName}
                      </p>
                      {order.receiverPatronymic ? (
                        <p>
                          <span className="text-muted-foreground">По батькові:</span>{' '}
                          {order.receiverPatronymic}
                        </p>
                      ) : null}
                      <p>
                        <span className="text-muted-foreground">Телефон:</span> {order.receiverPhone}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h4 className="font-semibold">Доставка та оплата</h4>
                  <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">Спосіб:</span>{' '}
                      {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
                    </p>
                    {formatOrderDeliveryLines(order, pickupAddress).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    <p>
                      <span className="text-muted-foreground">Оплата:</span>{' '}
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </p>
                    {order.paymentStatus ? (
                      <p>
                        <span className="text-muted-foreground">Статус оплати:</span>{' '}
                        {order.paymentStatus}
                      </p>
                    ) : null}
                    {order.comment ? (
                      <p>
                        <span className="text-muted-foreground">Коментар:</span> {order.comment}
                      </p>
                    ) : null}
                  </div>
                </div>

                {order.buyerType === 'company' ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold">B2B / DPH</h4>
                    <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                      {order.companyLegalName ? (
                        <p>
                          <span className="text-muted-foreground">Компанія:</span>{' '}
                          {order.companyLegalName}
                        </p>
                      ) : null}
                      {order.companyIco ? (
                        <p>
                          <span className="text-muted-foreground">IČO:</span> {order.companyIco}
                        </p>
                      ) : null}
                      {order.companyDic ? (
                        <p>
                          <span className="text-muted-foreground">DIČ:</span> {order.companyDic}
                        </p>
                      ) : null}
                      {order.companyVatId ? (
                        <p>
                          <span className="text-muted-foreground">IČ DPH:</span>{' '}
                          {order.vatCountryCode ? `${order.vatCountryCode}${order.companyVatId}` : order.companyVatId}
                        </p>
                      ) : null}
                      {order.taxRegime ? (
                        <p>
                          <span className="text-muted-foreground">Податковий режим:</span>{' '}
                          {order.taxRegime}
                          {order.taxRatePercent != null ? ` (${order.taxRatePercent}%)` : ''}
                        </p>
                      ) : null}
                      {order.viesCheck ? (
                        <>
                          <p className="pt-2 font-medium">VIES (на момент замовлення)</p>
                          <p>
                            <span className="text-muted-foreground">Статус:</span>{' '}
                            {order.viesCheck.valid === true
                              ? 'дійсний'
                              : order.viesCheck.valid === false
                                ? 'недійсний'
                                : 'недоступний'}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Перевірено:</span>{' '}
                            {formatDateTime(order.viesCheck.checkedAt, locale, 'datetime')}
                          </p>
                          {order.viesCheck.requestIdentifier ? (
                            <p>
                              <span className="text-muted-foreground">Consultation №:</span>{' '}
                              {order.viesCheck.requestIdentifier}
                            </p>
                          ) : null}
                          {order.viesCheck.registeredName ? (
                            <p>
                              <span className="text-muted-foreground">Назва з VIES:</span>{' '}
                              {order.viesCheck.registeredName}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <h4 className="font-semibold">ERP sync</h4>
                  <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
                    <p>
                      <span className="text-muted-foreground">erpSyncStatus:</span>{' '}
                      {order.erpSyncStatus ?? 'NOT_REQUIRED'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Correlation (ext:GA):</span>{' '}
                      {order.externalErpId ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">erpNativeId:</span>{' '}
                      {order.erpNativeId ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">erpNativeKod:</span>{' '}
                      {order.erpNativeKod ?? '—'}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Attempts:</span>{' '}
                      {order.erpSyncAttempts ?? 0}
                    </p>
                    {order.erpLastErrorCode || order.erpLastErrorMessage ? (
                      <p>
                        <span className="text-muted-foreground">Last error:</span>{' '}
                        {[order.erpLastErrorCode, order.erpLastErrorMessage]
                          .filter(Boolean)
                          .join(' — ')}
                      </p>
                    ) : null}
                    {order.erpSyncedAt ? (
                      <p>
                        <span className="text-muted-foreground">Synced at:</span> {order.erpSyncedAt}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Товари ({order.items.length})</h4>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">Назва</th>
                            <th className="px-4 py-2 text-center text-sm font-medium">К-сть</th>
                            <th className="px-4 py-2 text-right text-sm font-medium">Сума</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr key={item.id} className="border-t border-border">
                              <td className="px-4 py-2 text-sm">
                                <p>{item.productName}</p>
                                {item.variantLabel ? (
                                  <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                                ) : null}
                              </td>
                              <td className="px-4 py-2 text-center text-sm">{item.quantity}</td>
                              <td className="px-4 py-2 text-right text-sm">
                                {formatMoney(item.lineTotal, order.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-border bg-muted/50 px-4 py-2 text-sm font-semibold">
                      <span>Разом</span>
                      <span>{formatMoney(order.totalAmount, order.currency)}</span>
                    </div>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full flex-col gap-1.5 sm:w-auto">
                <span className="text-xs font-medium text-muted-foreground">Новий статус</span>
                <OrderStatusSelect
                  value={status}
                  onValueChange={setStatus}
                  disabled={saving}
                />
              </div>
              <Button
                type="button"
                onClick={() => void handleSaveStatus()}
                disabled={saving || status === order.status}
                className="w-full sm:w-auto"
              >
                <Package className="mr-2 h-4 w-4" />
                {saving ? 'Збереження...' : 'Зберегти статус'}
              </Button>
            </DialogFooter>

            <CancelOrderDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              saving={saving}
              onConfirm={({ cancellationReasonId, cancellationNote }) => {
                setCancelOpen(false)
                setSaving(true)
                void patchBackstageOrderStatus(order.id, 'CANCELLED', {
                  cancellationReasonId,
                  cancellationNote,
                })
                  .then((updated) => {
                    applyOrder(updated as BackstageOrderDetail)
                    toast.success(`Замовлення ${order.orderNumber} скасовано.`)
                  })
                  .catch((err) => {
                    setStatus(order.status)
                    toast.error(err instanceof Error ? err.message : 'Не вдалося скасувати.')
                  })
                  .finally(() => setSaving(false))
              }}
            />
          </>
        ) : (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            {error ?? 'Замовлення не знайдено.'}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
