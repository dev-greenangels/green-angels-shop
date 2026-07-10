'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CheckoutContactStep } from '@/components/checkout/checkout-contact-step'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { CheckoutDeliveryFields } from '@/components/checkout/checkout-delivery-fields'
import { CheckoutHeader } from '@/components/checkout/checkout-header'
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary'
import { CheckoutPromoCode } from '@/components/checkout/checkout-promo-code'
import { CheckoutShipmentSplitChoice } from '@/components/checkout/checkout-shipment-split-choice'
import { CheckoutSplitCombinedTotals } from '@/components/checkout/checkout-split-combined-totals'
import {
  CheckoutSplitOrdersPreview,
  CheckoutTogetherOrderPreview,
} from '@/components/checkout/checkout-split-orders-preview'
import { CheckoutPaymentStep } from '@/components/checkout/checkout-payment-step'
import { CheckoutShippingStep } from '@/components/checkout/checkout-shipping-step'
import { CartDrawer } from '@/components/cart-drawer'
import { useSession } from '@/components/providers/session-provider'
import { RecentlyViewedSection } from '@/components/product/recently-viewed-section'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import {
  checkoutPageContentClassName,
  checkoutPageGradientClassName,
  checkoutPageShellClassName,
  checkoutStepDomId,
  getCheckoutProgressIndex,
  type CheckoutStep,
} from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getInStockCartItems } from '@/lib/cart-availability'
import {
  cartNeedsShipmentSplitChoice,
  getLatestShipmentDate,
  partitionCartByShipmentDate,
  type ShipmentSplitMode,
} from '@/lib/cart-shipment-split'
import { buildOrderPayload } from '@/lib/checkout/build-order-payload'
import {
  cloneShipmentSlice,
  extractShipmentSlice,
  patchShipmentSlice,
  type CheckoutShipmentSlice,
} from '@/lib/checkout/shipment-slice'
import { useCheckoutSessionHydration } from '@/lib/checkout/use-checkout-session-hydration'
import {
  useCartActions,
  useCartAppliedPromoCodes,
  useCartItems,
  useCartPromoCode,
  useCartStore,
} from '@/lib/cart-store'
import { createOrders } from '@/lib/orders/create-order'
import { buildPricingQuoteLineItems } from '@/lib/pricing/quote-line-items'
import { usePricingQuote, promoCodesKey, resolveDisplayedAppliedPromos } from '@/lib/pricing/use-pricing-quote'
import { tryApplyPromoCode } from '@/lib/pricing/try-apply-promo-code'
import { resolveRemovedPromoInfo, resolvePromoQuoteError, isPromoBlockingMessage } from '@/lib/pricing/promo-messages'
import { fetchPublicSiteSettingsFromApiRoute, getCartCheckoutSettings } from '@/lib/settings/fetch'
import {
  pickDefaultDeliveryMethod,
  pickDefaultPaymentMethod,
} from '@/lib/settings/cart-checkout.normalize'
import type { CartCheckoutSettings } from '@/lib/settings/types'
import { DEFAULT_CART_CHECKOUT_SETTINGS } from '@/lib/settings/defaults'
import { Link, useRouter } from '@/i18n/navigation'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { cn } from '@/lib/utils'
import {
  isContactStepValid,
  isPaymentStepValid,
  isShippingStepValid,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutPaymentFieldKey,
  type CheckoutRecipientFieldKey,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'

const CHECKOUT_FORM_ID = 'checkout-form'

function CheckoutPageSkeleton() {
  return (
    <div className={checkoutPageShellClassName}>
      <div className={checkoutPageGradientClassName} aria-hidden />
      <div
        className={cn(
          checkoutPageContentClassName,
          siteContentShellClassName,
          'py-[calc(1rem+env(safe-area-inset-top))] sm:py-10',
        )}
      >
        <div className="mx-auto min-w-0 w-full space-y-6">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="min-w-0 space-y-6 lg:col-span-3">
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

const initialFormData: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  patronymic: '',
  email: '',
  phone: '',
  deliveryPhone: '',
  isOtherRecipient: false,
  recipientFirstName: '',
  recipientLastName: '',
  recipientPatronymic: '',
  recipientPhone: '',
  deliveryMethod: 'nova-poshta-branch',
  city: '',
  cityLabel: '',
  postOffice: '',
  postOfficeLabel: '',
  street: '',
  streetLabel: '',
  houseNumber: '',
  paymentMethod: 'card-online',
  companyEdrpou: '',
  companyLegalName: '',
  comment: '',
  promoCode: '',
}

export default function CheckoutPage() {
  const catalogHref = useCatalogHref()
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const tCart = useTranslations('cart')
  const tp = useTranslations('promo')
  const router = useRouter()
  const { user } = useSession()
  const items = useCartItems()
  const hasHydratedFromServer = useCartStore((s) => s.hasHydratedFromServer)
  const checkoutableItems = useMemo(() => getInStockCartItems(items), [items])
  const quoteLineItems = useMemo(
    () => buildPricingQuoteLineItems(checkoutableItems),
    [checkoutableItems],
  )
  const quoteItemsKey = useMemo(
    () => quoteLineItems.map((item) => `${item.productVariantId}:${item.quantity}`).join('|'),
    [quoteLineItems],
  )
  const hasCheckoutable = checkoutableItems.length > 0
  const needsShipmentSplitChoice = useMemo(
    () => cartNeedsShipmentSplitChoice(checkoutableItems),
    [checkoutableItems],
  )
  const latestShipmentDate = useMemo(
    () => getLatestShipmentDate(checkoutableItems),
    [checkoutableItems],
  )
  const shipmentPartition = useMemo(
    () => partitionCartByShipmentDate(checkoutableItems),
    [checkoutableItems],
  )
  const immediateLineItems = useMemo(
    () => buildPricingQuoteLineItems(shipmentPartition.immediate),
    [shipmentPartition.immediate],
  )
  const datedLineItems = useMemo(
    () => buildPricingQuoteLineItems(shipmentPartition.dated),
    [shipmentPartition.dated],
  )
  const immediateItemsKey = useMemo(
    () => immediateLineItems.map((item) => `${item.productVariantId}:${item.quantity}`).join('|'),
    [immediateLineItems],
  )
  const datedItemsKey = useMemo(
    () => datedLineItems.map((item) => `${item.productVariantId}:${item.quantity}`).join('|'),
    [datedLineItems],
  )
  const promoCode = useCartPromoCode()
  const appliedPromoCodes = useCartAppliedPromoCodes()
  const {
    setPersonalDiscountPercent,
    refreshCatalogData,
    openCart,
    setPromoCode,
    setAppliedPromoCodes,
    removePromoCode,
  } = useCartActions()
  const [identification, setIdentification] = useState<CheckoutIdentificationState>({
    lookupDone: false,
    customerFound: null,
    returningVerified: false,
    skippedReturningLogin: false,
    attemptingReturningLogin: false,
    authMethod: null,
  })
  const [mounted, setMounted] = useState(false)
  const [catalogReady, setCatalogReady] = useState(false)
  const [cartCheckoutSettings, setCartCheckoutSettings] =
    useState<CartCheckoutSettings>(DEFAULT_CART_CHECKOUT_SETTINGS)
  const [isLoading, setIsLoading] = useState(false)
  const [isCompletingOrder, setIsCompletingOrder] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [shipmentSplitError, setShipmentSplitError] = useState<string | null>(null)
  const [shipmentSplitMode, setShipmentSplitMode] = useState<ShipmentSplitMode>('together')
  const [formData, setFormData] = useState(initialFormData)
  const splitOrderParts =
    needsShipmentSplitChoice && shipmentSplitMode === 'split' ? 2 : undefined
  const { quote: pricingQuote, loading: quoteLoading, quoteForPromoCodes } = usePricingQuote({
    items: quoteLineItems,
    itemsKey: quoteItemsKey,
    customerPhone: formData.phone.trim() || undefined,
    userId: user?.id,
    promoCodes: appliedPromoCodes.length ? appliedPromoCodes : undefined,
    deliveryMethod: formData.deliveryMethod,
    splitOrderParts,
    enabled: mounted && catalogReady && quoteItemsKey.length > 0 && !isLoading,
  })
  const splitQuotesEnabled =
    mounted &&
    catalogReady &&
    needsShipmentSplitChoice &&
    shipmentSplitMode === 'split' &&
    !isLoading
  const immediateDeliveryMethod =
    formData.splitShipments?.immediate.deliveryMethod ?? formData.deliveryMethod
  const datedDeliveryMethod =
    formData.splitShipments?.dated.deliveryMethod ?? formData.deliveryMethod
  const { quote: immediateSplitQuote, loading: immediateSplitQuoteLoading } = usePricingQuote({
    items: immediateLineItems,
    itemsKey: immediateItemsKey,
    customerPhone: formData.phone.trim() || undefined,
    userId: user?.id,
    promoCodes: appliedPromoCodes.length ? appliedPromoCodes : undefined,
    deliveryMethod: immediateDeliveryMethod,
    splitOrderParts,
    splitOrderPartIndex: 0,
    enabled: splitQuotesEnabled && immediateItemsKey.length > 0,
  })
  const { quote: datedSplitQuote, loading: datedSplitQuoteLoading } = usePricingQuote({
    items: datedLineItems,
    itemsKey: datedItemsKey,
    customerPhone: formData.phone.trim() || undefined,
    userId: user?.id,
    promoCodes: appliedPromoCodes.length ? appliedPromoCodes : undefined,
    deliveryMethod: datedDeliveryMethod,
    splitOrderParts,
    splitOrderPartIndex: 1,
    enabled: splitQuotesEnabled && datedItemsKey.length > 0,
  })
  const splitQuoteLoading = immediateSplitQuoteLoading || datedSplitQuoteLoading
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoInfo, setPromoInfo] = useState<string | null>(null)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [privacyConsentTouched, setPrivacyConsentTouched] = useState(false)
  const splitCheckoutBlocked =
    needsShipmentSplitChoice &&
    shipmentSplitMode === 'split' &&
    Boolean(
      (immediateSplitQuote?.checkout && !immediateSplitQuote.checkout.canPlaceOrder) ||
        (datedSplitQuote?.checkout && !datedSplitQuote.checkout.canPlaceOrder),
    )
  const checkoutBlocked =
    Boolean(promoError) ||
    (needsShipmentSplitChoice && shipmentSplitMode === 'split'
      ? splitCheckoutBlocked
      : pricingQuote?.checkout != null && !pricingQuote.checkout.canPlaceOrder)
  const splitBlockedMessage = useMemo(() => {
    if (!splitCheckoutBlocked) return null
    const messages = [
      immediateSplitQuote?.checkout?.belowMinOrderMessage,
      datedSplitQuote?.checkout?.belowMinOrderMessage,
    ].filter((message): message is string => Boolean(message))
    return messages.length ? messages.join(' ') : t('shipmentSplit.splitBlockedFallback')
  }, [splitCheckoutBlocked, immediateSplitQuote, datedSplitQuote, t])
  const displayedAppliedPromos = useMemo(
    () =>
      resolveDisplayedAppliedPromos(
        appliedPromoCodes,
        pricingQuote,
        quoteLoading,
        quoteForPromoCodes,
      ),
    [appliedPromoCodes, pricingQuote, quoteLoading, quoteForPromoCodes],
  )
  const [contactTouched, setContactTouched] = useState<
    Partial<Record<CheckoutContactFieldKey, boolean>>
  >({})
  const [shippingTouched, setShippingTouched] = useState<
    Partial<Record<CheckoutShippingFieldKey, boolean>>
  >({})
  const [recipientTouched, setRecipientTouched] = useState<
    Partial<Record<CheckoutRecipientFieldKey, boolean>>
  >({})
  const [splitShippingTouched, setSplitShippingTouched] = useState<{
    immediate: Partial<Record<CheckoutShippingFieldKey, boolean>>
    dated: Partial<Record<CheckoutShippingFieldKey, boolean>>
  }>({ immediate: {}, dated: {} })
  const [splitRecipientTouched, setSplitRecipientTouched] = useState<{
    immediate: Partial<Record<CheckoutRecipientFieldKey, boolean>>
    dated: Partial<Record<CheckoutRecipientFieldKey, boolean>>
  }>({ immediate: {}, dated: {} })
  const [paymentTouched, setPaymentTouched] = useState<
    Partial<Record<CheckoutPaymentFieldKey, boolean>>
  >({})
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const deliveryPhoneInputRef = useRef<HTMLInputElement>(null)
  const [sessionHydratedForKey, setSessionHydratedForKey] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      setCatalogReady(false)
      return
    }

    let cancelled = false
    void Promise.all([
      refreshCatalogData(),
      fetchPublicSiteSettingsFromApiRoute().then((result) => {
        if (!cancelled) {
          setCartCheckoutSettings(getCartCheckoutSettings(result))
        }
      }),
    ])
      .then(() => {
        if (!cancelled) setCatalogReady(true)
      })
      .catch(() => {
        if (!cancelled) setCatalogReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [mounted, refreshCatalogData])

  useEffect(() => {
    setFormData((current) => {
      const enabledDelivery = cartCheckoutSettings.enabledDeliveryMethods
      const enabledPayment = cartCheckoutSettings.enabledPaymentMethods
      const deliveryMethod = enabledDelivery.includes(current.deliveryMethod)
        ? current.deliveryMethod
        : pickDefaultDeliveryMethod(enabledDelivery)
      const paymentMethod = enabledPayment.includes(current.paymentMethod)
        ? current.paymentMethod
        : pickDefaultPaymentMethod(enabledPayment)

      if (
        deliveryMethod === current.deliveryMethod &&
        paymentMethod === current.paymentMethod
      ) {
        return current
      }

      return {
        ...current,
        deliveryMethod,
        paymentMethod,
        ...(paymentMethod !== 'bank-transfer-legal'
          ? { companyEdrpou: '', companyLegalName: '' }
          : {}),
      }
    })
  }, [cartCheckoutSettings])

  useEffect(() => {
    if (quoteLoading || !pricingQuote) return
    if (promoCodesKey(quoteForPromoCodes) !== promoCodesKey(appliedPromoCodes)) return
    const codes = pricingQuote.promoCodes ?? []
    if (promoCodesKey(codes) !== promoCodesKey(appliedPromoCodes)) {
      const removedCodes = appliedPromoCodes.filter(
        (code) => !codes.map((item) => item.toUpperCase()).includes(code.toUpperCase()),
      )
      const removedInfo = resolveRemovedPromoInfo(pricingQuote, removedCodes)
      if (removedInfo) {
        setPromoInfo(tp('noAdditionalDiscount', { code: removedInfo.code }))
        setPromoError(null)
      } else if (pricingQuote.promoMessage) {
        setPromoError(pricingQuote.promoMessage)
        setPromoInfo(null)
      }
      setAppliedPromoCodes(codes)
    }
  }, [pricingQuote, quoteLoading, quoteForPromoCodes, appliedPromoCodes, setAppliedPromoCodes, tp])

  useEffect(() => {
    if (!appliedPromoCodes.length) return
    const quotesLoading =
      quoteLoading ||
      (needsShipmentSplitChoice && shipmentSplitMode === 'split' && splitQuoteLoading)
    if (quotesLoading) return

    const quotes =
      needsShipmentSplitChoice && shipmentSplitMode === 'split'
        ? [pricingQuote, immediateSplitQuote, datedSplitQuote]
        : [pricingQuote]
    const blockingMessage = resolvePromoQuoteError(quotes)
    if (blockingMessage) {
      setPromoError(blockingMessage)
      setPromoInfo(null)
      return
    }
    setPromoError((current) =>
      current && isPromoBlockingMessage(current) ? null : current,
    )
  }, [
    appliedPromoCodes.length,
    pricingQuote,
    immediateSplitQuote,
    datedSplitQuote,
    quoteLoading,
    splitQuoteLoading,
    needsShipmentSplitChoice,
    shipmentSplitMode,
  ])

  const handlePromoApply = useCallback(async () => {
    setPromoError(null)
    setPromoInfo(null)
    const result = await tryApplyPromoCode({
      draftCode: promoCode,
      currentCodes: appliedPromoCodes,
      items: quoteLineItems,
      customerPhone: formData.phone.trim() || undefined,
      userId: user?.id,
      deliveryMethod: formData.deliveryMethod,
      splitOrderParts,
    })
    if (!result.ok) {
      if (result.kind === 'info') {
        setPromoInfo(tp('noAdditionalDiscount', { code: result.code }))
        setPromoCode('')
        return false
      }
      setPromoError(result.message)
      return false
    }
    setAppliedPromoCodes(result.codes)
    setPromoCode('')
    return true
  }, [
    promoCode,
    appliedPromoCodes,
    quoteLineItems,
    formData.phone,
    formData.deliveryMethod,
    splitOrderParts,
    user?.id,
    setAppliedPromoCodes,
    setPromoCode,
    tp,
  ])

  const patchForm = useCallback((patch: Partial<CheckoutFormValues>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  const patchImmediateShipment = useCallback((patch: Partial<CheckoutShipmentSlice>) => {
    setFormData((prev) => {
      const current = prev.splitShipments ?? {
        immediate: extractShipmentSlice(prev),
        dated: cloneShipmentSlice(extractShipmentSlice(prev)),
      }
      const immediate = patchShipmentSlice(current.immediate, patch)
      const dated =
        prev.datedDeliverySynced !== false ? cloneShipmentSlice(immediate) : current.dated
      return {
        ...prev,
        splitShipments: { immediate, dated },
        datedDeliverySynced: prev.datedDeliverySynced !== false,
      }
    })
  }, [])

  const patchDatedShipment = useCallback((patch: Partial<CheckoutShipmentSlice>) => {
    setFormData((prev) => {
      if (!prev.splitShipments) return prev
      return {
        ...prev,
        datedDeliverySynced: false,
        splitShipments: {
          ...prev.splitShipments,
          dated: patchShipmentSlice(prev.splitShipments.dated, patch),
        },
      }
    })
  }, [])

  const handleShipmentSplitModeChange = useCallback((mode: ShipmentSplitMode) => {
    setShipmentSplitMode(mode)
    setShipmentSplitError(null)
    setPromoError(null)
    setPromoInfo(null)
    setSplitShippingTouched({ immediate: {}, dated: {} })
    setSplitRecipientTouched({ immediate: {}, dated: {} })

    setFormData((prev) => {
      if (mode === 'split') {
        const slice = extractShipmentSlice(prev)
        return {
          ...prev,
          splitShipments: {
            immediate: slice,
            dated: cloneShipmentSlice(slice),
          },
          datedDeliverySynced: true,
        }
      }
      return {
        ...prev,
        splitShipments: undefined,
        datedDeliverySynced: undefined,
      }
    })
  }, [])

  const handleSessionHydrate = useCallback(
    (payload: {
      formPatch: Partial<CheckoutFormValues>
      identification: CheckoutIdentificationState
      personalDiscountPercent: number
    }) => {
      setIdentification((prev) =>
        prev.returningVerified ? prev : payload.identification,
      )
      setPersonalDiscountPercent(payload.personalDiscountPercent)
      patchForm(payload.formPatch)
    },
    [patchForm, setPersonalDiscountPercent],
  )

  useCheckoutSessionHydration({
    mounted,
    returningVerified: identification.returningVerified,
    onHydrate: handleSessionHydrate,
    onSettled: setSessionHydratedForKey,
  })

  const sessionKey = user?.id ?? user?.email ?? null
  const sessionHydrationPending =
    Boolean(sessionKey) &&
    !identification.returningVerified &&
    sessionHydratedForKey !== sessionKey

  const moveDeliveryPhoneCursorToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = deliveryPhoneInputRef.current
      if (!el) return
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
  }, [])

  const canProceedToShipping = useMemo(
    () => isContactStepValid(formData, identification),
    [formData, identification]
  )
  const canProceedToPayment = useMemo(
    () =>
      isShippingStepValid(formData, identification, {
        shipmentSplit: needsShipmentSplitChoice && shipmentSplitMode === 'split',
      }),
    [formData, identification, needsShipmentSplitChoice, shipmentSplitMode],
  )
  const canCompletePayment = useMemo(() => isPaymentStepValid(formData), [formData])
  const progressStepIndex = useMemo(
    () =>
      getCheckoutProgressIndex(canProceedToShipping, canProceedToPayment, canCompletePayment),
    [canProceedToShipping, canProceedToPayment, canCompletePayment],
  )

  const scrollToCheckoutStep = useCallback((step: CheckoutStep) => {
    const el = document.getElementById(checkoutStepDomId(step))
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleCheckoutBack = useCallback(() => {
    router.back()
  }, [router])

  const handleEditOrder = useCallback(() => {
    openCart()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [openCart])

  const goToShippingAfterAuth = useCallback(() => {
    setContactTouched((prev) => ({
      ...prev,
      phone: true,
    }))
  }, [])

  const handleContactLogout = useCallback(() => {
    setPersonalDiscountPercent(0)
    setIdentification({
      lookupDone: false,
      customerFound: null,
      returningVerified: false,
      skippedReturningLogin: false,
      attemptingReturningLogin: false,
      authMethod: null,
    })
    patchForm({ firstName: '', lastName: '', phone: '', email: '' })
  }, [patchForm, setPersonalDiscountPercent])

  const touchAllCheckoutFields = useCallback(() => {
    setContactTouched({
      firstName: true,
      lastName: true,
      phone: true,
    })

    const shippingFields = {
      city: true,
      postOffice: true,
      street: true,
      houseNumber: true,
      deliveryPhone: true,
      patronymic: true,
    } as const

    if (needsShipmentSplitChoice && shipmentSplitMode === 'split' && formData.splitShipments) {
      setSplitShippingTouched({ immediate: { ...shippingFields }, dated: { ...shippingFields } })
      const recipientFields = {
        recipientFirstName: true,
        recipientLastName: true,
        recipientPatronymic: true,
        recipientPhone: true,
      } as const
      if (formData.splitShipments.immediate.isOtherRecipient) {
        setSplitRecipientTouched((prev) => ({
          ...prev,
          immediate: { ...recipientFields },
        }))
      }
      if (formData.splitShipments.dated.isOtherRecipient) {
        setSplitRecipientTouched((prev) => ({
          ...prev,
          dated: { ...recipientFields },
        }))
      }
    } else {
      setShippingTouched(shippingFields)
      if (formData.isOtherRecipient) {
        setRecipientTouched({
          recipientFirstName: true,
          recipientLastName: true,
          recipientPatronymic: true,
          recipientPhone: true,
        })
      }
    }

    setPaymentTouched({
      companyEdrpou: true,
      companyLegalName: true,
    })
  }, [
    formData.isOtherRecipient,
    formData.splitShipments,
    needsShipmentSplitChoice,
    shipmentSplitMode,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    touchAllCheckoutFields()
    setPrivacyConsentTouched(true)

    if (!canProceedToShipping) {
      scrollToCheckoutStep('contact')
      return
    }
    if (!canProceedToPayment) {
      scrollToCheckoutStep('shipping')
      return
    }
    if (!canCompletePayment) {
      scrollToCheckoutStep('payment')
      return
    }
    if (!privacyConsent) {
      return
    }

    setIsLoading(true)
    setSubmitError(null)
    setShipmentSplitError(null)

    try {
      if (!hasCheckoutable) {
        throw new Error(t('noCheckoutableItems'))
      }

      if (needsShipmentSplitChoice && !shipmentSplitMode) {
        setShipmentSplitError(t('shipmentSplit.required'))
        setIsLoading(false)
        return
      }

      const effectivePromoCodes = pricingQuote?.promoCodes ?? []
      if (promoCodesKey(effectivePromoCodes) !== promoCodesKey(appliedPromoCodes)) {
        setAppliedPromoCodes(effectivePromoCodes)
      }
      const formWithPromos = { ...formData, promoCodes: effectivePromoCodes }
      const { immediate, dated } = partitionCartByShipmentDate(checkoutableItems)

      if (needsShipmentSplitChoice && shipmentSplitMode === 'split') {
        if (!immediate.length || !dated.length) {
          throw new Error(t('submitFailed'))
        }
        if (promoError) {
          setIsLoading(false)
          return
        }
        if (splitCheckoutBlocked) {
          setShipmentSplitError(splitBlockedMessage ?? t('shipmentSplit.splitBlockedFallback'))
          setIsLoading(false)
          return
        }
        if (!immediateSplitQuote || !datedSplitQuote) {
          throw new Error(t('submitFailed'))
        }
        if (!formWithPromos.splitShipments) {
          throw new Error(t('submitFailed'))
        }

        const orders = await createOrders([
          buildOrderPayload(
            {
              ...formWithPromos,
              promoCodes: immediateSplitQuote?.promoCodes ?? effectivePromoCodes,
            },
            immediate,
            {
              shipmentNote: t('shipmentSplit.splitOrderNoteImmediate'),
              splitCheckout: { partIndex: 0, partCount: 2 },
              shipmentSlice: formWithPromos.splitShipments.immediate,
            },
          ),
          buildOrderPayload(
            {
              ...formWithPromos,
              promoCodes: datedSplitQuote?.promoCodes ?? effectivePromoCodes,
            },
            dated,
            {
              shipmentNote: t('shipmentSplit.splitOrderNoteDated', {
                date: latestShipmentDate ?? '',
              }),
              splitCheckout: { partIndex: 1, partCount: 2 },
              shipmentSlice: formWithPromos.splitShipments.dated,
            },
          ),
        ])

        setIsCompletingOrder(true)
        const paymentUrl = orders.find((order) => order.paymentPageUrl)?.paymentPageUrl
        if (paymentUrl) {
          window.location.href = paymentUrl
          return
        }
        const query = orders.map((order) => `order=${encodeURIComponent(order.orderNumber)}`).join('&')
        router.replace(`/checkout/success?${query}`)
        return
      }

      const shipmentNote =
        latestShipmentDate && (needsShipmentSplitChoice || dated.length > 0)
          ? t('shipmentSplit.shipTogetherNote', { date: latestShipmentDate })
          : undefined

      const payload = buildOrderPayload(formWithPromos, checkoutableItems, { shipmentNote })
      if (!payload.items.length) {
        throw new Error(tCart('emptyTitle'))
      }

      const [order] = await createOrders([payload])
      setIsCompletingOrder(true)
      if (order.paymentPageUrl) {
        window.location.href = order.paymentPageUrl
        return
      }
      router.replace(`/checkout/success?order=${encodeURIComponent(order.orderNumber)}`)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : t('submitFailed'),
      )
      setIsLoading(false)
    }
  }

  if (!mounted || !hasHydratedFromServer) {
    return <CheckoutPageSkeleton />
  }

  if (isCompletingOrder) {
    return (
      <div className={checkoutPageShellClassName}>
        <div className={checkoutPageGradientClassName} aria-hidden />
        <div className={cn(checkoutPageContentClassName, siteContentShellClassName, 'py-24')}>
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <Loader2 className="mb-6 h-12 w-12 animate-spin text-primary" />
            <h1 className="mb-2 font-serif text-2xl font-bold text-foreground">
              {t('orderPlaced')}
            </h1>
            <p className="text-muted-foreground">{t('redirecting')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 || !hasCheckoutable) {
    return (
      <div className={checkoutPageShellClassName}>
        <div className={checkoutPageGradientClassName} aria-hidden />
        <div className={cn(checkoutPageContentClassName, siteContentShellClassName, 'py-16')}>
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mb-4 font-serif text-2xl font-bold text-foreground">
              {items.length === 0 ? tCart('emptyTitle') : t('noStockTitle')}
            </h1>
            <p className="mb-8 text-muted-foreground">
              {items.length === 0 ? tCart('emptyBody') : tCart('allUnavailable')}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {items.length > 0 ? (
                <Button type="button" size="lg" onClick={openCart}>
                  {tc('openCart')}
                </Button>
              ) : null}
              <Button asChild size="lg" variant={items.length > 0 ? 'outline' : 'default'}>
                <Link href={catalogHref}>{tc('goToCatalog')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={checkoutPageShellClassName}>
      <div className={checkoutPageGradientClassName} aria-hidden />
      <div className="pointer-events-none absolute inset-0 opacity-5" aria-hidden>
        <div className="absolute top-16 left-6 h-48 w-48 rounded-full bg-primary blur-3xl sm:left-10 sm:h-64 sm:w-64" />
        <div className="absolute right-6 bottom-16 h-56 w-56 rounded-full bg-primary blur-3xl sm:right-10 sm:h-80 sm:w-80" />
      </div>

      <CheckoutHeader
        sticky
        onBack={handleCheckoutBack}
        progressStepIndex={progressStepIndex}
        contactComplete={canProceedToShipping}
        shippingComplete={canProceedToPayment}
        paymentComplete={canCompletePayment}
        scrollToStep={scrollToCheckoutStep}
      />

      <div
        className={cn(
          checkoutPageContentClassName,
          siteContentShellClassName,
          'pt-[calc(1rem+env(safe-area-inset-top))] pb-6 sm:pt-[calc(4rem+env(safe-area-inset-top))] sm:pb-3 lg:pt-[calc(1rem+env(safe-area-inset-top)+0.5rem)]',
        )}
      >
        <ClientPublicPageBreadcrumbs className="mb-4" items={[{ label: t('pageTitle') }]} />
        <div className="mx-auto min-w-0 w-full">
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="min-w-0 lg:col-span-3">
              <form
                id={CHECKOUT_FORM_ID}
                onSubmit={handleSubmit}
                className="min-w-0 space-y-6"
                noValidate
              >
                <section
                  id={checkoutStepDomId('contact')}
                  className="scroll-mt-[calc(3.5rem+env(safe-area-inset-top)+1rem)]"
                >
                  <CheckoutContactStep
                    formData={formData}
                    contactTouched={contactTouched}
                    identification={identification}
                    sessionHydrationPending={sessionHydrationPending}
                    canProceed={canProceedToShipping}
                    phoneInputRef={phoneInputRef}
                    onBlurField={(field) =>
                      setContactTouched((p) => ({ ...p, [field]: true }))
                    }
                    onPatchForm={patchForm}
                    onIdentificationChange={(patch) =>
                      setIdentification((prev) => ({ ...prev, ...patch }))
                    }
                    onReturningCustomerVerified={(percent) =>
                      setPersonalDiscountPercent(percent)
                    }
                    onContinue={() => scrollToCheckoutStep('shipping')}
                    onAuthenticated={goToShippingAfterAuth}
                    onLogout={handleContactLogout}
                    showStepNav={false}
                  />
                </section>

                <section
                  id={checkoutStepDomId('shipping')}
                  className="scroll-mt-[calc(3.5rem+env(safe-area-inset-top)+1rem)]"
                >
                  <CheckoutShippingStep
                    formData={formData}
                    enabledDeliveryMethods={cartCheckoutSettings.enabledDeliveryMethods}
                    identification={identification}
                    contactTouched={contactTouched}
                    shippingTouched={shippingTouched}
                    recipientTouched={recipientTouched}
                    canProceed={canProceedToPayment}
                    onBlurField={(field) =>
                      setShippingTouched((p) => ({ ...p, [field]: true }))
                    }
                    onBlurContactField={(field) =>
                      setContactTouched((p) => ({ ...p, [field]: true }))
                    }
                    onBlurRecipientField={(field) =>
                      setRecipientTouched((p) => ({ ...p, [field]: true }))
                    }
                    onPatchForm={patchForm}
                    onBack={() => scrollToCheckoutStep('contact')}
                    onContinue={() => scrollToCheckoutStep('payment')}
                    moveDeliveryPhoneCursorToEnd={moveDeliveryPhoneCursorToEnd}
                    deliveryPhoneInputRef={deliveryPhoneInputRef}
                    showStepNav={false}
                    shipmentSplitActive={
                      needsShipmentSplitChoice && shipmentSplitMode === 'split'
                    }
                    shipmentSplitSection={
                      needsShipmentSplitChoice && latestShipmentDate ? (
                        <CheckoutShipmentSplitChoice
                          latestDate={latestShipmentDate}
                          mode={shipmentSplitMode}
                          onModeChange={handleShipmentSplitModeChange}
                        >
                          {shipmentSplitMode === 'split' ? (
                            <CheckoutSplitOrdersPreview
                              immediateItems={shipmentPartition.immediate}
                              datedItems={shipmentPartition.dated}
                              immediateQuote={immediateSplitQuote}
                              datedQuote={datedSplitQuote}
                              quoteLoading={splitQuoteLoading}
                              latestDate={latestShipmentDate}
                              onEditOrder={handleEditOrder}
                              immediateDeliverySection={
                                formData.splitShipments ? (
                                  <CheckoutDeliveryFields
                                    idPrefix="split-immediate"
                                    orderer={formData}
                                    shipment={formData.splitShipments.immediate}
                                    identification={identification}
                                    enabledDeliveryMethods={
                                      cartCheckoutSettings.enabledDeliveryMethods
                                    }
                                    shippingTouched={splitShippingTouched.immediate}
                                    recipientTouched={splitRecipientTouched.immediate}
                                    onPatchShipment={patchImmediateShipment}
                                    onBlurField={(field) =>
                                      setSplitShippingTouched((prev) => ({
                                        ...prev,
                                        immediate: { ...prev.immediate, [field]: true },
                                      }))
                                    }
                                    onBlurRecipientField={(field) =>
                                      setSplitRecipientTouched((prev) => ({
                                        ...prev,
                                        immediate: { ...prev.immediate, [field]: true },
                                      }))
                                    }
                                  />
                                ) : null
                              }
                              datedDeliverySection={
                                formData.splitShipments ? (
                                  <CheckoutDeliveryFields
                                    idPrefix="split-dated"
                                    orderer={formData}
                                    shipment={formData.splitShipments.dated}
                                    identification={identification}
                                    enabledDeliveryMethods={
                                      cartCheckoutSettings.enabledDeliveryMethods
                                    }
                                    shippingTouched={splitShippingTouched.dated}
                                    recipientTouched={splitRecipientTouched.dated}
                                    onPatchShipment={patchDatedShipment}
                                    onBlurField={(field) =>
                                      setSplitShippingTouched((prev) => ({
                                        ...prev,
                                        dated: { ...prev.dated, [field]: true },
                                      }))
                                    }
                                    onBlurRecipientField={(field) =>
                                      setSplitRecipientTouched((prev) => ({
                                        ...prev,
                                        dated: { ...prev.dated, [field]: true },
                                      }))
                                    }
                                    prefilledHint={
                                      formData.datedDeliverySynced !== false
                                        ? t('shipmentSplit.datedPrefilledHint')
                                        : undefined
                                    }
                                  />
                                ) : null
                              }
                            />
                          ) : (
                            <CheckoutTogetherOrderPreview
                              items={checkoutableItems}
                              quote={pricingQuote}
                              quoteLoading={quoteLoading}
                              latestDate={latestShipmentDate}
                              onEditOrder={handleEditOrder}
                            />
                          )}
                        </CheckoutShipmentSplitChoice>
                      ) : null
                    }
                  />
                </section>

                <section
                  id={checkoutStepDomId('payment')}
                  className="scroll-mt-[calc(3.5rem+env(safe-area-inset-top)+1rem)]"
                >
                  <CheckoutPaymentStep
                    formData={formData}
                    enabledPaymentMethods={cartCheckoutSettings.enabledPaymentMethods}
                    paymentTouched={paymentTouched}
                    onPatchForm={patchForm}
                    onBlurPaymentField={(field) =>
                      setPaymentTouched((p) => ({ ...p, [field]: true }))
                    }
                    onBack={() => scrollToCheckoutStep('shipping')}
                    showStepNav={false}
                  />
                </section>
              </form>
            </div>

            <div className="min-w-0 lg:col-span-2 lg:flex lg:flex-col">
              <div
                className={cn(
                  'flex flex-col',
                  'lg:sticky lg:z-20 lg:min-h-0',
                  'lg:top-[calc(3.5rem+env(safe-area-inset-top)+0.5rem)]',
                  'lg:h-[calc(100vh-3.5rem-env(safe-area-inset-top)-1rem)]',
                )}
              >
                <CheckoutOrderSummary
                  quote={pricingQuote}
                  quoteLoading={quoteLoading}
                  comment={formData.comment}
                  onCommentChange={(value) => patchForm({ comment: value })}
                  isLoading={isLoading}
                  checkoutDisabled={!hasCheckoutable || checkoutBlocked}
                  submitError={submitError}
                  shipmentSplitError={shipmentSplitError}
                  checkoutBlockedMessage={
                    checkoutBlocked
                      ? needsShipmentSplitChoice && shipmentSplitMode === 'split'
                        ? splitBlockedMessage
                        : pricingQuote?.checkout?.belowMinOrderMessage
                      : null
                  }
                  formId={CHECKOUT_FORM_ID}
                  privacyConsentChecked={privacyConsent}
                  privacyConsentError={privacyConsentTouched && !privacyConsent}
                  privacyConsentLabel={cartCheckoutSettings.gdprConsentText}
                  onPrivacyConsentChange={(checked) => {
                    setPrivacyConsent(checked)
                    if (checked) setPrivacyConsentTouched(false)
                  }}
                  totalsSection={
                    needsShipmentSplitChoice && shipmentSplitMode === 'split' ? (
                      <CheckoutSplitCombinedTotals
                        immediateQuote={immediateSplitQuote}
                        datedQuote={datedSplitQuote}
                        quoteLoading={splitQuoteLoading}
                      />
                    ) : undefined
                  }
                  promoSection={
                    <CheckoutPromoCode
                      embedded
                      value={promoCode}
                      onChange={(value) => {
                        setPromoCode(value)
                        if (promoError) setPromoError(null)
                        if (promoInfo) setPromoInfo(null)
                      }}
                      appliedPromos={displayedAppliedPromos}
                      message={promoError}
                      infoMessage={promoInfo}
                      loading={quoteLoading}
                      onApply={handlePromoApply}
                      onRemove={(code) => {
                        setPromoError(null)
                        setPromoInfo(null)
                        removePromoCode(code)
                      }}
                    />
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <RecentlyViewedSection page="checkout" />
      <CartDrawer />
    </div>
  )
}
