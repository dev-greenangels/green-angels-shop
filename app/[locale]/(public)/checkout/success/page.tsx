'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  Home,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { BrandLogo } from '@/components/brand-logo'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DELIVERY_METHOD_BACKSTAGE_LABELS, PAYMENT_METHOD_BACKSTAGE_LABELS } from '@/lib/checkout/methods'
import { useCartActions } from '@/lib/cart-store'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { downloadOrderConfirmationPdf } from '@/lib/orders/build-order-confirmation-pdf'
import {
  fetchOrderConfirmation,
  type PublicOrderConfirmation,
} from '@/lib/orders/fetch-order-confirmation'
import {
  formatPaymentPurpose,
  normalizeCartCheckoutSettings,
} from '@/lib/settings/cart-checkout.normalize'
import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import { fetchPublicSiteSettingsFromApiRoute, getCartCheckoutSettings } from '@/lib/settings/fetch'
import type { CartCheckoutSettings } from '@/lib/settings/types'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

function formatPersonName(last: string, first: string, patronymic?: string | null) {
  return [last, first, patronymic?.trim()].filter(Boolean).join(' ')
}

function formatDeliveryAddress(order: PublicOrderConfirmation): string {
  if (order.deliveryMethod === 'pickup') return 'Самовивіз'
  if (order.deliveryMethod === 'nova-poshta-branch') {
    return [order.deliveryCity, order.deliveryBranch].filter(Boolean).join(', ')
  }
  if (order.deliveryMethod === 'nova-poshta-address') {
    return [
      order.deliveryCity,
      order.deliveryStreet,
      order.deliveryHouseNumber ? `буд. ${order.deliveryHouseNumber}` : null,
    ]
      .filter(Boolean)
      .join(', ')
  }
  return [order.deliveryCity, order.deliveryBranch, order.deliveryStreet].filter(Boolean).join(', ')
}

function isBankTransfer(paymentMethod: string) {
  return paymentMethod === 'bank-transfer' || paymentMethod === 'bank-transfer-legal'
}

function hasBankDetails(bank: CartCheckoutSettings['bankDetails']) {
  return Boolean(
    bank.organizationName || bank.edrpou || bank.iban || bank.bankName || bank.mfo,
  )
}

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} скопійовано`)
  } catch {
    toast.error('Не вдалося скопіювати')
  }
}

function CopyableRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-medium text-foreground">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => void copyText(value, label)}
        aria-label={`Копіювати ${label}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}

function OrderCard({
  order,
  formatMoney,
}: {
  order: PublicOrderConfirmation
  formatMoney: (amount: number) => string
}) {
  return (
    <div className="space-y-4 rounded-xl bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Номер замовлення</p>
          <p className="font-mono text-lg font-bold text-foreground">{order.orderNumber}</p>
        </div>
        <Package className="h-5 w-5 text-primary" />
      </div>

      <ul className="space-y-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.productName}</p>
              {item.variantLabel ? (
                <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">× {item.quantity}</p>
            </div>
            <span className="shrink-0 tabular-nums">{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-1 text-sm">
        {order.productsSubtotal != null ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Товари</span>
            <span className="tabular-nums">{formatMoney(order.productsSubtotal)}</span>
          </div>
        ) : null}
        {order.packagingAmount != null && order.packagingAmount > 0 ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Пакування</span>
            <span className="tabular-nums">{formatMoney(order.packagingAmount)}</span>
          </div>
        ) : null}
        {order.deliveryAmount != null && order.deliveryAmount > 0 ? (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Доставка</span>
            <span className="tabular-nums">{formatMoney(order.deliveryAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 font-semibold">
          <span>Разом</span>
          <span className="tabular-nums text-primary">{formatMoney(order.totalAmount)}</span>
        </div>
      </div>

      <Separator />

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Отримувач
          </p>
          <p className="mt-1 font-medium text-foreground">
            {formatPersonName(
              order.receiverLastName,
              order.receiverFirstName,
              order.receiverPatronymic,
            )}
          </p>
          <p className="text-muted-foreground">{order.receiverPhone}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Доставка
          </p>
          <p className="mt-1 font-medium text-foreground">
            {DELIVERY_METHOD_BACKSTAGE_LABELS[
              order.deliveryMethod as keyof typeof DELIVERY_METHOD_BACKSTAGE_LABELS
            ] ?? order.deliveryMethod}
          </p>
          <p className="text-muted-foreground">{formatDeliveryAddress(order)}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Оплата
          </p>
          <p className="mt-1 font-medium text-foreground">
            {PAYMENT_METHOD_BACKSTAGE_LABELS[
              order.paymentMethod as keyof typeof PAYMENT_METHOD_BACKSTAGE_LABELS
            ] ?? order.paymentMethod}
          </p>
        </div>
      </div>
    </div>
  )
}

function SuccessContent() {
  const t = useTranslations('checkout')
  const catalogHref = useCatalogHref()
  const searchParams = useSearchParams()
  const { user } = useSession()
  const { clearCart } = useCartActions()
  const formatMoney = useFormatPrice()

  const orderNumbers = useMemo(
    () => searchParams.getAll('order').filter(Boolean),
    [searchParams],
  )

  const [orders, setOrders] = useState<PublicOrderConfirmation[]>([])
  const [cartSettings, setCartSettings] = useState<CartCheckoutSettings>(
    DEFAULT_CART_CHECKOUT_SETTINGS,
  )
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const [settingsResult, confirmations] = await Promise.all([
          fetchPublicSiteSettingsFromApiRoute(),
          Promise.all(orderNumbers.map((number) => fetchOrderConfirmation(number))),
        ])
        if (cancelled) return
        setCartSettings(
          normalizeCartCheckoutSettings(getCartCheckoutSettings(settingsResult)),
        )
        setOrders(
          confirmations.filter((item): item is PublicOrderConfirmation => Boolean(item)),
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderNumbers])

  const nextSteps = cartSettings.nextSteps?.length
    ? cartSettings.nextSteps
    : DEFAULT_CART_CHECKOUT_SETTINGS.nextSteps

  const showBankBlock =
    orders.some((order) => isBankTransfer(order.paymentMethod)) &&
    hasBankDetails(cartSettings.bankDetails)

  const paymentPurpose = formatPaymentPurpose(
    cartSettings.paymentPurposeTemplate,
    orders.map((order) => order.orderNumber),
  )

  const handleDownloadPdf = async () => {
    if (!orders.length) {
      toast.error('Немає даних замовлення для PDF')
      return
    }
    setPdfLoading(true)
    try {
      await downloadOrderConfirmationPdf(orders, cartSettings)
    } catch {
      toast.error('Не вдалося сформувати PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className={cn(siteContentShellClassName, 'py-4')}>
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo alt="Зелені Янголи" />
          </Link>
        </div>
      </header>

      <div className={cn(siteContentShellClassName, 'py-8 lg:py-16')}>
        <ClientPublicPageBreadcrumbs
          className="mb-6"
          items={[
            { label: t('pageTitle'), href: '/checkout' },
            { label: t('orderPlaced') },
          ]}
        />
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h1 className="mb-3 font-serif text-2xl font-bold text-foreground lg:text-4xl">
              Замовлення оформлено!
            </h1>
            <p className="text-lg text-muted-foreground">
              Дякуємо за ваше замовлення. Очікуйте на відвантаження.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pdfLoading || loading || !orders.length}
              onClick={() => void handleDownloadPdf()}
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Завантажити PDF
            </Button>
          </div>

          <div className="mb-8 space-y-4 rounded-xl border bg-background p-6 lg:p-8">
            {loading ? (
              <p className="text-sm text-muted-foreground">Завантажуємо деталі замовлення…</p>
            ) : orders.length ? (
              orders.map((order) => (
                <OrderCard key={order.id} order={order} formatMoney={formatMoney} />
              ))
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  {orderNumbers.length > 1 ? 'Номери замовлень' : 'Номер замовлення'}
                </p>
                <div className="space-y-1">
                  {(orderNumbers.length ? orderNumbers : ['ZY-00000000']).map((orderNumber) => (
                    <p key={orderNumber} className="font-mono text-xl font-bold text-foreground">
                      {orderNumber}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showBankBlock ? (
            <div className="mb-8 space-y-3 rounded-xl border bg-background p-6">
              <h2 className="font-serif text-lg font-semibold text-foreground">
                Реквізити для оплати
              </h2>
              <CopyableRow
                label="Одержувач"
                value={cartSettings.bankDetails.organizationName}
              />
              <CopyableRow label="ЄДРПОУ / ІПН" value={cartSettings.bankDetails.edrpou} />
              <CopyableRow label="IBAN" value={cartSettings.bankDetails.iban} />
              <CopyableRow label="Банк" value={cartSettings.bankDetails.bankName} />
              <CopyableRow label="МФО" value={cartSettings.bankDetails.mfo} />
              <CopyableRow
                label="Юридична адреса"
                value={cartSettings.bankDetails.legalAddress}
              />
              <CopyableRow
                label="Податковий статус"
                value={cartSettings.bankDetails.taxStatus}
              />
              <CopyableRow label="Призначення платежу" value={paymentPurpose} />
            </div>
          ) : null}

          <div className="mb-8 rounded-xl border bg-background p-6 lg:p-8">
            <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">Що далі?</h2>
            <div className="space-y-4">
              {nextSteps.map((step, index) => (
                <div key={`${step.title}-${index}`} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8 rounded-xl border bg-background p-6">
            <div className="mb-4 flex items-center gap-3">
              <Truck className="h-5 w-5 text-primary" />
              <h3 className="font-medium text-foreground">Інформація про доставку</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Рослини ретельно пакуються для безпечної доставки у картонні коробки з
                маркуванням верх / низ / крихке або палети чи обрешетування.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Доставка здійснюється Новою Поштою.
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                При отриманні огляньте рослини та перевірте комплектацію
              </li>
            </ul>
          </div>

          {!user ? (
            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h3 className="mb-1 font-serif font-semibold text-foreground">
                    Створіть акаунт
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Відстежуйте замовлення, зберігайте улюблені рослини та отримуйте
                    персональні знижки
                  </p>
                </div>
                <Button asChild>
                  <Link href="/auth/login">Увійти або зареєструватися</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                На головну
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href={catalogHref}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                Продовжити покупки
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <div className="text-center">
            <BrandLogo
              alt="Зелені Янголи"
              className="mx-auto mb-4 animate-pulse"
              imgClassName="opacity-70"
            />
            <p className="text-muted-foreground">Завантаження...</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
