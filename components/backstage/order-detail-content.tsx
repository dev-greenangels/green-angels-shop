'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Copy,
  Loader2,
  MoreHorizontal,
  Package,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { useTranslations } from 'next-intl'

import { CancelOrderDialog } from '@/components/backstage/cancel-order-dialog'
import { OrderStatusBadge, OrderStatusSelect } from '@/components/backstage/order-status-select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resolveBackstageThumbnailSrc } from '@/lib/category-image'
import { ProductLatinName } from '@/components/product/product-latin-name'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import {
  formatOrderCustomerName,
  formatOrderDeliveryLines,
  formatOrderReceiverName,
  isOrderReceiverDifferent,
} from '@/lib/backstage/order-display'
import {
  buildOrderTimeline,
  buyerTypeLabel,
  canManualErpSync,
  copyText,
  countryCodeLabel,
  formatOrderMoney,
  taxRegimeLabel,
} from '@/lib/backstage/order-detail-helpers'
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
} from '@/lib/backstage/order-status'
import {
  deleteBackstageOrder,
  fetchBackstageOrder,
  patchBackstageOrder,
  patchBackstageOrderStatus,
  syncBackstageOrderErp,
  syncBackstageOrderTracking,
  type BackstageOrderDetail,
} from '@/lib/backstage/orders'
import { formatDateTime, formatDateTimeOrDash } from '@/lib/i18n/format-datetime'
import { formatStoreAddress } from '@/lib/settings/store-helpers'

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-1 text-sm sm:grid-cols-[9rem_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-foreground">{children}</dd>
    </div>
  )
}

function Copyable({ value }: { value: string }) {
  return (
    <button
      type="button"
      className="inline-flex max-w-full items-center gap-1 font-mono text-xs hover:underline"
      onClick={() => {
        void copyText(value).then((ok) => {
          if (ok) toast.success('Скопійовано')
        })
      }}
    >
      <span className="truncate">{value}</span>
      <Copy className="h-3 w-3 shrink-0 opacity-60" />
    </button>
  )
}

export function OrderDetailContent({ orderId }: { orderId: string }) {
  const { locale } = useBackstageUiLocale()
  const tPacketa = useTranslations('packetaOrderSnapshot')
  const store = useStoreSettings()
  const pickupAddress = formatStoreAddress(store)

  const [order, setOrder] = useState<BackstageOrderDetail | null>(null)
  const [status, setStatus] = useState<OrderStatus>('PENDING')
  const [ttn, setTtn] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [erpSyncing, setErpSyncing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchBackstageOrder(orderId)
      setOrder(detail)
      setStatus(detail.status)
      setTtn(detail.trackingNumber ?? '')
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити замовлення.')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  const applyOrder = (detail: BackstageOrderDetail) => {
    setOrder(detail)
    setStatus(detail.status)
    setTtn(detail.trackingNumber ?? '')
  }

  const handleSaveStatus = async () => {
    if (!order || status === order.status) return
    if (status === 'CANCELLED') {
      setCancelOpen(true)
      return
    }
    setSaving(true)
    try {
      const updated = await patchBackstageOrderStatus(order.id, status)
      applyOrder(updated as BackstageOrderDetail)
      toast.success(`Статус ${order.orderNumber} оновлено.`)
    } catch (err) {
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
    try {
      const updated = await patchBackstageOrder(order.id, {
        trackingNumber: next || null,
        trackingCarrier: next ? 'nova-poshta' : null,
      })
      applyOrder(updated as BackstageOrderDetail)
      toast.success('ТТН збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти ТТН.')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncTtn = async () => {
    if (!order) return
    setSyncing(true)
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
      toast.error(err instanceof Error ? err.message : 'Не вдалося синхронізувати ТТН.')
    } finally {
      setSyncing(false)
    }
  }

  const handleErpSync = async () => {
    if (!order) return
    setErpSyncing(true)
    try {
      const updated = await syncBackstageOrderErp(order.id)
      applyOrder(updated)
      toast.success(
        updated.erpSyncStatus === 'SYNCED'
          ? 'Замовлення синхронізовано з ABRA.'
          : 'Стан ERP оновлено.',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося синхронізувати з ABRA.')
      try {
        applyOrder(await fetchBackstageOrder(order.id))
      } catch {
        /* keep */
      }
    } finally {
      setErpSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    setDeleting(true)
    try {
      await deleteBackstageOrder(order.id)
      toast.success('Замовлення видалено')
      window.location.assign('/backstage/orders')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити замовлення.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Завантаження замовлення…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <a href="/backstage/orders">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Назад до замовлень
          </a>
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {error ?? 'Замовлення не знайдено.'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const erpSynced = (order.erpSyncStatus ?? '').trim() === 'SYNCED'
  const hasPayment = order.paymentStatus === 'success'
  const hasTracking = Boolean(order.trackingNumber?.trim())
  const showErpRetry = canManualErpSync(order)
  const timeline = buildOrderTimeline(order)
  const money = (n: number | null | undefined) =>
    n == null ? '—' : formatOrderMoney(n, order.currency)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <a href="/backstage/orders">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Назад до замовлень
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Замовлення {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(order.createdAt, locale, 'datetime')}
            {order.locale ? ` · locale ${order.locale}` : ''}
            {order.countrySiteCode ? ` · site ${order.countrySiteCode.toUpperCase()}` : ''}
            {` · ${order.currency}`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} label={order.statusLabel} />
            {order.paymentStatus ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                Оплата: {order.paymentStatus}
              </span>
            ) : null}
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              ERP: {order.erpSyncStatus ?? 'NOT_REQUIRED'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Статус</Label>
            <OrderStatusSelect
              value={status}
              onValueChange={setStatus}
              disabled={saving || deleting}
            />
          </div>
          <Button
            type="button"
            disabled={saving || deleting || status === order.status}
            onClick={() => void handleSaveStatus()}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Зберегти статус
          </Button>
          {showErpRetry ? (
            <Button
              type="button"
              variant="outline"
              disabled={erpSyncing}
              onClick={() => void handleErpSync()}
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${erpSyncing ? 'animate-spin' : ''}`} />
              {order.erpSyncStatus === 'FAILED'
                ? 'Повторити синхронізацію з ABRA'
                : 'Синхронізувати з ABRA'}
            </Button>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" aria-label="Інші дії">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Видалити замовлення
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Товари ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_4rem_6rem_6rem] md:gap-3 md:border-b md:pb-2 md:text-xs md:font-medium md:text-muted-foreground">
                <span>Товар</span>
                <span className="text-center">К-сть</span>
                <span className="text-right">Ціна</span>
                <span className="text-right">Сума</span>
              </div>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 border-b border-border/60 py-3 last:border-0 md:grid-cols-[minmax(0,1fr)_4rem_6rem_6rem] md:items-center md:gap-3"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                      {item.imageUrl ? (
                        // External catalog CDN URLs — plain img avoids next/image host config.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveBackstageThumbnailSrc(item.imageUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.productName}</p>
                      <ProductLatinName latinName={item.latinName} />
                      {item.variantLabel ? (
                        <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {[item.sku ? `SKU ${item.sku}` : null, item.ean ? `EAN ${item.ean}` : null]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm md:text-center">{item.quantity}</p>
                  <p className="text-sm md:text-right">
                    {formatOrderMoney(item.priceAtPurchase, order.currency)}
                  </p>
                  <p className="text-sm font-medium md:text-right">
                    {formatOrderMoney(item.lineTotal, order.currency)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Підсумки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Товари</span>
                <span>{money(order.productsSubtotal)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Доставка</span>
                <span>{money(order.deliveryAmount)}</span>
              </div>
              {order.packagingAmount != null && order.packagingAmount > 0 ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Пакування</span>
                  <span>{money(order.packagingAmount)}</span>
                </div>
              ) : null}
              {order.codFeeAmount != null && order.codFeeAmount > 0 ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Комісія COD</span>
                  <span>{money(order.codFeeAmount)}</span>
                </div>
              ) : null}
              {order.pointsDiscountAmount != null && order.pointsDiscountAmount > 0 ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Знижка (бали)</span>
                  <span>−{money(order.pointsDiscountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">ПДВ (у сумі / окремо)</span>
                <span>{money(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
                <span>Разом</span>
                <span>{formatOrderMoney(order.totalAmount, order.currency)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Оплата</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <MetaRow label="Метод">
                    {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </MetaRow>
                  <MetaRow label="Провайдер">{order.paymentProvider ?? '—'}</MetaRow>
                  <MetaRow label="Статус">{order.paymentStatus ?? '—'}</MetaRow>
                  <MetaRow label="Сума">
                    {formatOrderMoney(order.totalAmount, order.currency)}
                  </MetaRow>
                  <MetaRow label="Оплачено">
                    {formatDateTimeOrDash(order.paidAt, locale, 'datetime')}
                  </MetaRow>
                  {order.stripePaymentId ? (
                    <MetaRow label="Stripe">
                      <Copyable value={order.stripePaymentId} />
                    </MetaRow>
                  ) : null}
                  {order.monopayInvoiceId ? (
                    <MetaRow label="MonoPay">
                      <Copyable value={order.monopayInvoiceId} />
                    </MetaRow>
                  ) : null}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Податки</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <MetaRow label="Доставка">
                    {countryCodeLabel(order.deliveryCountryCode)}
                  </MetaRow>
                  <MetaRow label="Оподаткування">
                    {countryCodeLabel(order.taxCountryCode)}
                  </MetaRow>
                  <MetaRow label="Режим">{taxRegimeLabel(order.taxRegime)}</MetaRow>
                  <MetaRow label="Ставка">
                    {order.taxRatePercent != null ? `${order.taxRatePercent}%` : '—'}
                  </MetaRow>
                  <MetaRow label="Тип покупця">{buyerTypeLabel(order.buyerType)}</MetaRow>
                  {order.companyVatId ? (
                    <MetaRow label="VAT ID">
                      {order.vatCountryCode
                        ? `${order.vatCountryCode}${order.companyVatId}`
                        : order.companyVatId}
                    </MetaRow>
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          </div>

          {timeline.length > 1 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Хронологія</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm">
                  {timeline.map((ev) => (
                    <li key={ev.key} className="flex justify-between gap-4 border-b border-border/50 py-1.5 last:border-0">
                      <span>{ev.label}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatDateTime(ev.at, locale, 'datetime')}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Клієнт</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <MetaRow label="Імʼя">{formatOrderCustomerName(order)}</MetaRow>
                <MetaRow label="Email">
                  {order.customerEmail ? (
                    <a className="hover:underline" href={`mailto:${order.customerEmail}`}>
                      {order.customerEmail}
                    </a>
                  ) : (
                    '—'
                  )}
                </MetaRow>
                <MetaRow label="Телефон">
                  <a className="hover:underline" href={`tel:${order.customerPhone}`}>
                    {order.customerPhone}
                  </a>
                </MetaRow>
                {order.companyLegalName ? (
                  <MetaRow label="Компанія">{order.companyLegalName}</MetaRow>
                ) : null}
                {order.companyIco ? <MetaRow label="IČO">{order.companyIco}</MetaRow> : null}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Доставка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">
                {DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod}
              </p>
              <p className="text-muted-foreground">
                Країна: {countryCodeLabel(order.deliveryCountryCode)}
              </p>
              {formatOrderDeliveryLines(order, pickupAddress).map((line) => (
                <p key={line}>{line}</p>
              ))}
              {order.deliveryPostalCode ? <p>PSČ: {order.deliveryPostalCode}</p> : null}
              {order.deliveryBranchLabel ? (
                <p className="text-muted-foreground">{order.deliveryBranchLabel}</p>
              ) : null}
              {order.deliveryMethod?.startsWith('packeta') ? (
                <div className="space-y-1 border-t border-border/60 pt-3 text-muted-foreground">
                  <p>
                    {tPacketa('serviceKey')}:{' '}
                    <span className="font-mono text-foreground">
                      {order.packetaServiceKey?.trim() || tPacketa('legacyUnset')}
                    </span>
                  </p>
                  {order.packetaCarrierId ? (
                    <p>
                      {tPacketa('carrierId')}:{' '}
                      <span className="font-mono text-foreground">{order.packetaCarrierId}</span>
                    </p>
                  ) : null}
                  {order.packetaPickupPointKind ? (
                    <p>
                      {tPacketa('pickupKind')}:{' '}
                      {order.packetaPickupPointKind === 'branch'
                        ? tPacketa('pickupKindBranch')
                        : order.packetaPickupPointKind === 'box'
                          ? tPacketa('pickupKindBox')
                          : order.packetaPickupPointKind === 'carrier'
                            ? tPacketa('pickupKindCarrier')
                            : order.packetaPickupPointKind}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {order.deliveryAmount != null ? (
                <p>Вартість: {money(order.deliveryAmount)}</p>
              ) : null}
              {isOrderReceiverDifferent(order) ? (
                <div className="border-t pt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Отримувач
                  </p>
                  <p>{formatOrderReceiverName(order)}</p>
                  <p>{order.receiverPhone}</p>
                  {order.receiverCompanyName ? <p>{order.receiverCompanyName}</p> : null}
                </div>
              ) : null}
              {(order.billingStreet ||
                order.billingCity ||
                order.billingPostalCode ||
                ((order.companyStreet || order.companyCity || order.companyPostalCode) &&
                  (order.companyStreet !== order.deliveryStreet ||
                    order.companyCity !== order.deliveryCity))) ? (
                <div className="border-t pt-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Billing
                  </p>
                  <p>
                    {order.billingStreet || order.billingCity || order.billingPostalCode
                      ? [
                          [order.billingStreet, order.billingHouseNumber].filter(Boolean).join(' '),
                          order.billingCity,
                          order.billingPostalCode,
                          order.billingCountryCode,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : [order.companyStreet, order.companyCity, order.companyPostalCode]
                          .filter(Boolean)
                          .join(', ')}
                  </p>
                </div>
              ) : null}
              {order.comment ? (
                <p className="border-t pt-3 text-muted-foreground">Коментар: {order.comment}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Відправлення / ТТН</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="order-detail-ttn">Номер ТТН</Label>
                <Input
                  id="order-detail-ttn"
                  value={ttn}
                  onChange={(e) => setTtn(e.target.value)}
                  placeholder="2045xxxxxxxx"
                />
              </div>
              <dl className="space-y-2">
                <MetaRow label="Carrier">{order.trackingCarrier ?? '—'}</MetaRow>
                <MetaRow label="NP ref">{order.npDocumentRef ?? '—'}</MetaRow>
                <MetaRow label="Sync">
                  {formatDateTimeOrDash(order.trackingSyncedAt, locale, 'datetime')}
                </MetaRow>
              </dl>
              {!ttn.trim() ? (
                <p className="text-xs text-muted-foreground">
                  Спочатку вкажіть і збережіть ТТН, щоб синхронізувати статус з НП.
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ABRA / ERP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <dl className="space-y-2">
                <MetaRow label="Статус">{order.erpSyncStatus ?? 'NOT_REQUIRED'}</MetaRow>
                <MetaRow label="ext:GA">
                  {order.externalErpId ? <Copyable value={order.externalErpId} /> : '—'}
                </MetaRow>
                <MetaRow label="Native ID">{order.erpNativeId ?? '—'}</MetaRow>
                <MetaRow label="Документ">{order.erpNativeKod ?? '—'}</MetaRow>
                <MetaRow label="Attempts">{order.erpSyncAttempts ?? 0}</MetaRow>
                <MetaRow label="Synced">
                  {formatDateTimeOrDash(order.erpSyncedAt, locale, 'datetime')}
                </MetaRow>
              </dl>
              {order.erpLastErrorCode || order.erpLastErrorMessage ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-medium text-destructive">
                    {order.erpLastErrorCode ?? 'Error'}
                  </p>
                  {order.erpLastErrorMessage ? (
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {order.erpLastErrorMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {showErpRetry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={erpSyncing}
                  onClick={() => void handleErpSync()}
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${erpSyncing ? 'animate-spin' : ''}`} />
                  {order.erpSyncStatus === 'FAILED'
                    ? 'Повторити синхронізацію з ABRA'
                    : 'Синхронізувати з ABRA'}
                </Button>
              ) : null}

              <div className="border-t pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Online withdrawal CTA</p>
                    <p className="text-xs text-muted-foreground">Лише account UI</p>
                  </div>
                  <Switch
                    checked={order.onlineWithdrawalActionEnabled !== false}
                    disabled={saving}
                    onCheckedChange={(checked) => {
                      void patchBackstageOrder(order.id, {
                        onlineWithdrawalActionEnabled: checked,
                      })
                        .then((updated) => {
                          applyOrder(updated as BackstageOrderDetail)
                          toast.success('Налаштування odstúpenia оновлено.')
                        })
                        .catch((err: unknown) => {
                          toast.error(
                            err instanceof Error ? err.message : 'Помилка збереження.',
                          )
                        })
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити замовлення?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Замовлення №{order.orderNumber} буде назавжди видалено з бази сайту.
                </p>
                <p>
                  Ця дія НЕ видаляє документ в ABRA, НЕ повертає оплату і НЕ скасовує
                  відправлення.
                </p>
                <p>Дію неможливо скасувати.</p>
                {erpSynced ? (
                  <p className="font-medium text-foreground">
                    Документ ABRA
                    {order.erpNativeKod ? ` ${order.erpNativeKod}` : ''} залишиться без змін.
                  </p>
                ) : null}
                {hasPayment ? (
                  <p className="font-medium text-foreground">
                    Замовлення має оплату. Видалення запису не повертає кошти клієнту.
                  </p>
                ) : null}
                {hasTracking ? (
                  <p className="font-medium text-foreground">
                    Є ТТН {order.trackingNumber}. Відправлення в перевізника не скасовується.
                  </p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Видалити замовлення
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
