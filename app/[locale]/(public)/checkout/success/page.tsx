'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Home,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
  XCircle,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { BrandLogo } from '@/components/brand-logo'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { shopPublicBaseUrl } from '@/components/checkout/checkout-utils'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { clearCartAfterCheckout } from '@/lib/carts/clear-after-checkout'
import {
  checkoutResultChromeTone,
  isBankTransferPaymentMethod,
  isCardOnlinePaymentMethod,
  isCodPaymentMethod,
  resolveCheckoutResultStateWithPaymentQueryHint,
  type CheckoutResultState,
} from '@/lib/checkout/checkout-result-state'
import { resolvePaymentPurposeForMarket } from '@/lib/checkout/payment-purpose-display'
import { clearStripePendingPayments } from '@/lib/checkout/stripe-pending'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { downloadOrderConfirmationPdf } from '@/lib/orders/build-order-confirmation-pdf'
import { checkoutCancelledSearch, checkoutSuccessSearch } from '@/lib/orders/create-order'
import {
  cancelUnpaidOrder,
  fetchOrderConfirmation,
  retryOrderPayment,
  syncMonopayPayment,
  syncStripePayment,
  type PublicOrderConfirmation,
} from '@/lib/orders/fetch-order-confirmation'
import { normalizeCartCheckoutSettings } from '@/lib/settings/cart-checkout.normalize'
import {
  hasCompanyBankDetails,
  resolveCheckoutBankDetails,
} from '@/lib/settings/company-bank-details'
import { DEFAULT_CART_CHECKOUT_SETTINGS, UNAVAILABLE_STORE_SETTINGS } from '@/lib/settings/defaults'
import {
  fetchPublicSiteSettingsFromApiRoute,
  getCartCheckoutSettings,
  getMarketSettings,
  getStoreSettings,
} from '@/lib/settings/fetch'
import { DEFAULT_MARKET_SETTINGS } from '@/lib/settings/market'
import { formatStoreAddress } from '@/lib/settings/store-helpers'
import type { CartCheckoutSettings, MarketSettings, StoreContactSettings } from '@/lib/settings/types'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

function formatPersonName(last: string, first: string, patronymic?: string | null) {
  return [last, first, patronymic?.trim()].filter(Boolean).join(' ')
}

function hasBankDetails(bank: CartCheckoutSettings['bankDetails']) {
  return hasCompanyBankDetails(bank)
}

type SuccessTranslator = ReturnType<typeof useTranslations<'checkout'>>

function formatDeliveryAddress(order: PublicOrderConfirmation, t: SuccessTranslator): string {
  if (order.deliveryMethod === 'pickup') return t('pickup')
  if (order.deliveryMethod === 'nova-poshta-branch') {
    return [order.deliveryCity, order.deliveryBranch].filter(Boolean).join(', ')
  }
  if (order.deliveryMethod === 'nova-poshta-address') {
    return [
      order.deliveryCity,
      order.deliveryStreet,
      order.deliveryHouseNumber
        ? t('housePrefix', { n: order.deliveryHouseNumber })
        : null,
    ]
      .filter(Boolean)
      .join(', ')
  }
  return [order.deliveryCity, order.deliveryBranch, order.deliveryStreet].filter(Boolean).join(', ')
}

function paymentStatusLabel(paymentStatus: string | null | undefined, t: SuccessTranslator) {
  switch (paymentStatus) {
    case 'success':
      return t('paymentStatusPaid')
    case 'processing':
    case 'created':
      return t('paymentStatusPending')
    case 'failure':
    case 'expired':
    case 'reversed':
      return t('paymentStatusFailed')
    default:
      return null
  }
}

function deliveryMethodLabel(method: string, t: SuccessTranslator) {
  const key = `deliveryMethods.${method}`
  return t.has(key) ? t(key as Parameters<SuccessTranslator>[0]) : method
}

function paymentMethodLabel(method: string, t: SuccessTranslator) {
  const key = `paymentMethods.${method}.title`
  return t.has(key) ? t(key as Parameters<SuccessTranslator>[0]) : method
}

async function copyText(value: string, label: string, t: SuccessTranslator) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(t('copied', { label }))
  } catch {
    toast.error(t('copyFailed'))
  }
}

function CopyableRow({
  label,
  value,
  t,
}: {
  label: string
  value?: string | null
  t: SuccessTranslator
}) {
  if (!value?.trim()) return null
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
        onClick={() => void copyText(value, label, t)}
        aria-label={t('copyAria', { label })}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  )
}

function OrderCard({
  order,
  formatMoney,
  t,
  showAmountDueOnDelivery,
}: {
  order: PublicOrderConfirmation
  formatMoney: (amount: number) => string
  t: SuccessTranslator
  showAmountDueOnDelivery: boolean
}) {
  return (
    <div className="space-y-4 rounded-xl bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{t('orderNumber')}</p>
          <p className="font-mono text-lg font-bold text-foreground break-all">{order.orderNumber}</p>
          {isCardOnlinePaymentMethod(order.paymentMethod) ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {paymentStatusLabel(order.paymentStatus, t) ?? t('paymentStatusOnline')}
            </p>
          ) : null}
        </div>
        <Package className="h-5 w-5 shrink-0 text-primary" />
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
            <span className="text-muted-foreground">{t('products')}</span>
            <span className="tabular-nums">{formatMoney(order.productsSubtotal)}</span>
          </div>
        ) : null}
        {(() => {
          const shipping = (order.deliveryAmount ?? 0) + (order.packagingAmount ?? 0)
          if (shipping <= 0) return null
          return (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('shippingAndPackaging')}</span>
              <span className="tabular-nums">{formatMoney(shipping)}</span>
            </div>
          )
        })()}
        <div className="flex justify-between gap-3 font-semibold">
          <span>{t('total')}</span>
          <span className="tabular-nums text-primary">{formatMoney(order.totalAmount)}</span>
        </div>
        {showAmountDueOnDelivery ? (
          <div className="flex justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t('resultAmountDueOnDelivery')}</span>
            <span className="tabular-nums font-medium">{formatMoney(order.totalAmount)}</span>
          </div>
        ) : null}
      </div>

      <Separator />

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('recipient')}
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
            {t('delivery')}
          </p>
          <p className="mt-1 font-medium text-foreground">
            {deliveryMethodLabel(order.deliveryMethod, t)}
          </p>
          <p className="text-muted-foreground">{formatDeliveryAddress(order, t)}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('payment')}
          </p>
          <p className="mt-1 font-medium text-foreground">
            {paymentMethodLabel(order.paymentMethod, t)}
          </p>
        </div>
      </div>
    </div>
  )
}

type NextStep = { title: string; description: string }

function resolvePaymentNextSteps(
  orders: PublicOrderConfirmation[],
  state: CheckoutResultState,
  t: SuccessTranslator,
): NextStep[] {
  const primary = orders[0]
  if (!primary) {
    return [
      { title: t('nextGeneric1Title'), description: t('nextGeneric1Body') },
      { title: t('nextGeneric2Title'), description: t('nextGeneric2Body') },
    ]
  }

  if (state === 'PAYMENT_SUCCESS') {
    return [
      { title: t('nextCardPaid1Title'), description: t('nextCardPaid1Body') },
      { title: t('nextCardPaid2Title'), description: t('nextCardPaid2Body') },
      { title: t('nextCardPaid3Title'), description: t('nextCardPaid3Body') },
    ]
  }

  if (state === 'PAYMENT_NOT_COMPLETED' || state === 'PAYMENT_FAILED') {
    return [
      { title: t('nextCardPending1Title'), description: t('nextCardPending1Body') },
      { title: t('nextCardPending2Title'), description: t('nextCardPending2Body') },
    ]
  }

  if (state === 'PAYMENT_PROCESSING') {
    return [
      { title: t('resultPaymentProcessingStepTitle'), description: t('resultPaymentProcessingStepBody') },
    ]
  }

  if (isBankTransferPaymentMethod(primary.paymentMethod)) {
    return [
      { title: t('nextBank1Title'), description: t('nextBank1Body') },
      { title: t('nextBank2Title'), description: t('nextBank2Body') },
      { title: t('nextBank3Title'), description: t('nextBank3Body') },
    ]
  }

  if (isCodPaymentMethod(primary.paymentMethod)) {
    return [
      { title: t('nextCod1Title'), description: t('nextCod1Body') },
      { title: t('nextCod2Title'), description: t('nextCod2Body') },
      { title: t('nextCod3Title'), description: t('nextCod3Body') },
    ]
  }

  return [
    { title: t('nextGeneric1Title'), description: t('nextGeneric1Body') },
    { title: t('nextGeneric2Title'), description: t('nextGeneric2Body') },
  ]
}

function resolveTitleSubtitle(
  state: CheckoutResultState,
  primary: PublicOrderConfirmation | undefined,
  t: SuccessTranslator,
): { title: string; subtitle: string } {
  switch (state) {
    case 'PAYMENT_SUCCESS':
      return {
        title: t('resultPaymentSuccessTitle'),
        subtitle: t('resultPaymentSuccessSubtitle'),
      }
    case 'PAYMENT_PROCESSING':
      return {
        title: t('resultPaymentProcessingTitle'),
        subtitle: t('resultPaymentProcessingSubtitle'),
      }
    case 'PAYMENT_NOT_COMPLETED':
      return {
        title: t('resultPaymentNotCompletedTitle'),
        subtitle: t('resultPaymentNotCompletedSubtitle'),
      }
    case 'PAYMENT_FAILED':
      return {
        title: t('resultPaymentFailedTitle'),
        subtitle: t('resultPaymentFailedSubtitle'),
      }
    case 'ORDER_CANCELLED':
      return {
        title: t('resultOrderCancelledTitle'),
        subtitle: primary
          ? t('resultOrderCancelledSubtitle', { number: primary.orderNumber })
          : t('resultOrderCancelledSubtitleGeneric'),
      }
    case 'ORDER_RECEIVED':
    default: {
      if (primary && isBankTransferPaymentMethod(primary.paymentMethod)) {
        return {
          title: t('resultOrderReceivedTitle'),
          subtitle: t('resultOrderReceivedSubtitleBank'),
        }
      }
      if (primary && isCodPaymentMethod(primary.paymentMethod)) {
        return {
          title: t('resultOrderReceivedTitle'),
          subtitle: t('resultOrderReceivedSubtitleCod'),
        }
      }
      return {
        title: t('resultOrderReceivedTitle'),
        subtitle: t('resultOrderReceivedSubtitleGeneric'),
      }
    }
  }
}

function ResultChromeIcon({
  state,
  className,
}: {
  state: CheckoutResultState
  className?: string
}) {
  const tone = checkoutResultChromeTone(state)
  if (state === 'PAYMENT_PROCESSING') {
    return <Clock3 className={cn('h-10 w-10 text-muted-foreground', className)} />
  }
  if (tone === 'destructive') {
    return <XCircle className={cn('h-10 w-10 text-destructive', className)} />
  }
  if (tone === 'warning') {
    return <AlertTriangle className={cn('h-10 w-10 text-amber-600', className)} />
  }
  return <CheckCircle2 className={cn('h-10 w-10 text-primary', className)} />
}

function chromeWellClass(state: CheckoutResultState) {
  const tone = checkoutResultChromeTone(state)
  if (tone === 'destructive') return 'bg-destructive/10'
  if (tone === 'warning') return 'bg-amber-500/10'
  if (tone === 'neutral') return 'bg-muted'
  return 'bg-primary/10'
}

function formatPaymentDeadline(iso: string | null | undefined, locale: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

function SuccessContent() {
  const t = useTranslations('checkout')
  const tCommon = useTranslations('common')
  const catalogHref = useCatalogHref()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = useLocale()
  const { user } = useSession()
  const formatMoney = useFormatPrice('raw')

  const orderNumbers = useMemo(
    () => searchParams.getAll('order').filter(Boolean),
    [searchParams],
  )
  const confirmationTokens = useMemo(
    () => searchParams.getAll('confirmation').map((value) => value.trim()),
    [searchParams],
  )
  const syncToken = searchParams.get('sync')?.trim() ?? ''
  const paymentQueryHint = searchParams.get('payment')?.trim() ?? ''

  const [orders, setOrders] = useState<PublicOrderConfirmation[]>([])
  const [cartSettings, setCartSettings] = useState<CartCheckoutSettings>(
    DEFAULT_CART_CHECKOUT_SETTINGS,
  )
  const [storeSettings, setStoreSettings] = useState<StoreContactSettings>(
    UNAVAILABLE_STORE_SETTINGS,
  )
  const [marketSettings, setMarketSettings] = useState<MarketSettings>(DEFAULT_MARKET_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const reloadOrders = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const [settingsResult, confirmations] = await Promise.all([
        fetchPublicSiteSettingsFromApiRoute(),
        Promise.all(
          orderNumbers.map((number, index) =>
            fetchOrderConfirmation(number, confirmationTokens[index]),
          ),
        ),
      ])

      setCartSettings(normalizeCartCheckoutSettings(getCartCheckoutSettings(settingsResult)))
      setStoreSettings(getStoreSettings(settingsResult))
      setMarketSettings(getMarketSettings(settingsResult))

      const loaded = confirmations.filter(
        (item): item is PublicOrderConfirmation => Boolean(item),
      )

      if (!orderNumbers.length || !loaded.length) {
        setOrders([])
        setLoadFailed(true)
        return
      }

      const reconciled = await Promise.all(
        loaded.map(async (order) => {
          if (!isCardOnlinePaymentMethod(order.paymentMethod)) return order
          if (order.paymentStatus === 'success' || order.status === 'CANCELLED') return order

          if (syncToken) {
            const mono = await syncMonopayPayment(order.orderNumber, syncToken)
            if (mono) {
              return {
                ...order,
                status: mono.status,
                paymentStatus: mono.paymentStatus,
              }
            }
          }

          const tokenIndex = orderNumbers.indexOf(order.orderNumber)
          const stripe = await syncStripePayment(
            order.orderNumber,
            tokenIndex >= 0 ? confirmationTokens[tokenIndex] : undefined,
          )
          if (!stripe) return order

          return {
            ...order,
            status: stripe.status,
            paymentStatus: stripe.paymentStatus,
          }
        }),
      )

      setOrders(reconciled)
      setLoadFailed(false)
    } catch {
      setOrders([])
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [orderNumbers, confirmationTokens, syncToken])

  useEffect(() => {
    void clearCartAfterCheckout()
    clearStripePendingPayments()
  }, [])

  useEffect(() => {
    void reloadOrders()
  }, [reloadOrders])

  const primary = orders[0]
  const resultState: CheckoutResultState | null = primary
    ? resolveCheckoutResultStateWithPaymentQueryHint(primary, paymentQueryHint)
    : null

  const bankDetails = resolveCheckoutBankDetails(cartSettings, storeSettings)
  const isSk = marketSettings.region === 'sk'
  const isPickup = primary?.deliveryMethod === 'pickup'
  const pickupAddress = formatStoreAddress(storeSettings)

  const showBankBlock =
    Boolean(resultState === 'ORDER_RECEIVED') &&
    orders.some((order) => isBankTransferPaymentMethod(order.paymentMethod)) &&
    hasBankDetails(bankDetails)

  const paymentPurpose = resolvePaymentPurposeForMarket(
    cartSettings.paymentPurposeTemplate,
    orders.map((order) => order.orderNumber),
    marketSettings.region,
  )

  const nextSteps =
    resultState && orders.length ? resolvePaymentNextSteps(orders, resultState, t) : []
  const { title, subtitle } =
    resultState && !loading
      ? resolveTitleSubtitle(resultState, primary, t)
      : { title: t('resultLoadingTitle'), subtitle: t('successLoadingDetails') }

  const deadlineLabel = formatPaymentDeadline(primary?.paymentExpiresAt, locale)

  const supportEmail =
    storeSettings.emails.find((row) => row.email.trim())?.email?.trim() || ''

  const handleDownloadPdf = async () => {
    if (!orders.length) {
      toast.error(t('pdfNoOrderData'))
      return
    }
    setPdfLoading(true)
    try {
      await downloadOrderConfirmationPdf(orders, confirmationTokens[0])
    } catch {
      toast.error(t('pdfFailed'))
    } finally {
      setPdfLoading(false)
    }
  }

  const primaryConfirmation = confirmationTokens[0] || ''

  const handleContinuePayment = () => {
    if (!primary) return
    router.push(
      `/checkout/pay?${checkoutSuccessSearch([
        { orderNumber: primary.orderNumber, confirmationToken: primaryConfirmation },
      ])}`,
    )
  }

  const handleCancelOrder = async () => {
    if (!primary) return
    setActionBusy(true)
    try {
      const result = await cancelUnpaidOrder(primary.orderNumber, primaryConfirmation)
      if (!result.ok) {
        toast.error(result.error || t('resultCancelFailed'))
        return
      }
      router.replace(
        `/checkout/cancelled?${checkoutCancelledSearch(primary.orderNumber, primaryConfirmation)}`,
      )
    } finally {
      setActionBusy(false)
    }
  }

  const handleTryAgain = async () => {
    if (!primary) return
    setActionBusy(true)
    try {
      const retried = await retryOrderPayment(
        primary.orderNumber,
        primaryConfirmation,
        shopPublicBaseUrl(locale),
      )
      if (!retried) {
        toast.error(t('resultRetryFailed'))
        return
      }
      const token = retried.confirmationToken ?? primaryConfirmation
      router.push(
        `/checkout/pay?${checkoutSuccessSearch([
          { orderNumber: primary.orderNumber, confirmationToken: token },
        ])}`,
      )
    } finally {
      setActionBusy(false)
    }
  }

  const showVerifiedDetails = !loading && !loadFailed && orders.length > 0 && resultState

  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b bg-background">
        <div className={cn(siteContentShellClassName, 'py-4')}>
          <Link href="/" className="flex items-center gap-2">
            <BrandLogo alt={tCommon('brand')} />
          </Link>
        </div>
      </header>

      <div className={cn(siteContentShellClassName, 'py-8 lg:py-16')}>
        <ClientPublicPageBreadcrumbs
          className="mb-6"
          items={[{ label: t('pageTitle') }, { label: t('orderPlaced') }]}
        />
        <div className="mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <div
              className={cn(
                'mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full',
                resultState ? chromeWellClass(resultState) : 'bg-muted',
              )}
            >
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              ) : resultState ? (
                <ResultChromeIcon state={resultState} />
              ) : (
                <AlertTriangle className="h-10 w-10 text-amber-600" />
              )}
            </div>
            <h1 className="mb-3 font-serif text-2xl font-bold text-foreground break-words lg:text-4xl">
              {loadFailed && !loading ? t('resultUnverifiedTitle') : title}
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              {loadFailed && !loading ? t('resultUnverifiedBody') : subtitle}
            </p>
            {showVerifiedDetails &&
            (resultState === 'PAYMENT_NOT_COMPLETED' || resultState === 'PAYMENT_FAILED') &&
            deadlineLabel ? (
              <p className="mt-3 text-sm font-medium text-foreground">
                {t('resultPaymentDeadline', { time: deadlineLabel })}
              </p>
            ) : null}
          </div>

          {showVerifiedDetails &&
          (resultState === 'ORDER_RECEIVED' || resultState === 'PAYMENT_SUCCESS') &&
          cartSettings.orderPdfDownloadEnabled !== false ? (
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pdfLoading || loading || !orders.length}
                onClick={() => void handleDownloadPdf()}
                className="w-full sm:w-auto"
              >
                {pdfLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {t('downloadPdf')}
              </Button>
            </div>
          ) : null}

          {showVerifiedDetails ? (
            <div className="mb-8 space-y-4 rounded-xl border bg-background p-6 lg:p-8">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  formatMoney={formatMoney}
                  t={t}
                  showAmountDueOnDelivery={isCodPaymentMethod(order.paymentMethod)}
                />
              ))}
            </div>
          ) : null}

          {showBankBlock ? (
            <div className="mb-8 space-y-3 rounded-xl border bg-background p-6">
              <h2 className="font-serif text-lg font-semibold text-foreground">
                {t('bankDetailsTitle')}
              </h2>
              <CopyableRow label={t('bankRecipient')} value={bankDetails.organizationName} t={t} />
              <CopyableRow
                label={isSk ? t('bankIco') : t('bankEdrpou')}
                value={bankDetails.edrpou}
                t={t}
              />
              {isSk ? (
                <>
                  <CopyableRow label={t('bankDic')} value={bankDetails.dic} t={t} />
                  <CopyableRow label={t('bankIcDph')} value={bankDetails.icDph} t={t} />
                </>
              ) : null}
              <CopyableRow label={t('bankIban')} value={bankDetails.iban} t={t} />
              <CopyableRow label={t('bankName')} value={bankDetails.bankName} t={t} />
              {isSk ? (
                <CopyableRow label={t('bankBic')} value={bankDetails.bic} t={t} />
              ) : (
                <CopyableRow label={t('bankMfo')} value={bankDetails.mfo} t={t} />
              )}
              <CopyableRow label={t('bankLegalAddress')} value={bankDetails.legalAddress} t={t} />
              <CopyableRow label={t('bankTaxStatus')} value={bankDetails.taxStatus} t={t} />
              <CopyableRow label={t('bankPaymentPurpose')} value={paymentPurpose} t={t} />
              {primary ? (
                <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">{t('resultAmountToPay')}</p>
                  <p className="font-semibold tabular-nums text-foreground">
                    {formatMoney(primary.totalAmount)}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {showVerifiedDetails && nextSteps.length ? (
            <div className="mb-8 rounded-xl border bg-background p-6 lg:p-8">
              <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
                {t('whatNext')}
              </h2>
              <div className="space-y-4">
                {nextSteps.map((step, index) => (
                  <div key={`${step.title}-${index}`} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {showVerifiedDetails &&
          (resultState === 'ORDER_RECEIVED' || resultState === 'PAYMENT_SUCCESS') ? (
            <div className="mb-8 rounded-xl border bg-background p-6">
              <div className="mb-4 flex items-center gap-3">
                <Truck className="h-5 w-5 shrink-0 text-primary" />
                <h3 className="font-medium text-foreground">
                  {isPickup ? t('deliveryInfoPickupTitle') : t('deliveryInfoTitle')}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {isPickup ? (
                  <>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {t('deliveryInfoPickupPrepare')}
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {t('deliveryInfoPickupNotify')}
                    </li>
                    {pickupAddress ? (
                      <li className="flex items-start gap-2">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>
                          {t('deliveryInfoPickupLocation')}:{' '}
                          <span className="font-medium text-foreground">{pickupAddress}</span>
                        </span>
                      </li>
                    ) : null}
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {t('deliveryInfoPacking')}
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {isSk ? t('deliveryInfoCarrierSk') : t('deliveryInfoCarrierUa')}
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {t('deliveryInfoInspect')}
                    </li>
                  </>
                )}
              </ul>
            </div>
          ) : null}

          {showVerifiedDetails &&
          !user &&
          (resultState === 'ORDER_RECEIVED' || resultState === 'PAYMENT_SUCCESS') ? (
            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <h3 className="mb-1 font-serif font-semibold text-foreground">
                    {t('createAccountTitle')}
                  </h3>
                  <p className="text-sm text-muted-foreground">{t('createAccountBody')}</p>
                </div>
                <Button asChild className="w-full shrink-0 sm:w-auto">
                  <Link href="/auth/login">{t('createAccountCta')}</Link>
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            {showVerifiedDetails && resultState === 'PAYMENT_SUCCESS' && user && primary ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={`/account/orders/${primary.id}`}>{t('resultViewOrder')}</Link>
              </Button>
            ) : null}

            {showVerifiedDetails && resultState === 'PAYMENT_NOT_COMPLETED' ? (
              <>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={actionBusy}
                  onClick={handleContinuePayment}
                >
                  {t('resultContinuePayment')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={actionBusy}
                  onClick={() => void handleCancelOrder()}
                >
                  {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t('resultCancelOrder')}
                </Button>
              </>
            ) : null}

            {showVerifiedDetails && resultState === 'PAYMENT_FAILED' ? (
              <Button
                size="lg"
                className="w-full sm:w-auto"
                disabled={actionBusy}
                onClick={() => void handleTryAgain()}
              >
                {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('resultTryAgain')}
              </Button>
            ) : null}

            {showVerifiedDetails && resultState === 'PAYMENT_PROCESSING' ? (
              <Button
                size="lg"
                className="w-full sm:w-auto"
                disabled={loading || actionBusy}
                onClick={() => void reloadOrders()}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('resultRefreshStatus')}
              </Button>
            ) : null}

            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('home')}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant={
                resultState === 'PAYMENT_SUCCESS' || resultState === 'ORDER_RECEIVED'
                  ? 'default'
                  : 'outline'
              }
              className="w-full sm:w-auto"
            >
              <Link href={catalogHref}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t('continueShopping')}
              </Link>
            </Button>

            {loadFailed && supportEmail ? (
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <a href={`mailto:${supportEmail}`}>{t('resultContactSupport')}</a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  const tCommon = useTranslations('common')
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-transparent">
          <div className="text-center">
            <BrandLogo
              alt={tCommon('brand')}
              className="mx-auto mb-4 animate-pulse"
              imgClassName="opacity-70"
            />
            <p className="text-muted-foreground">{tCommon('loading')}</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
