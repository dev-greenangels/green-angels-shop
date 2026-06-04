'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

import { CheckoutContactStep } from '@/components/checkout/checkout-contact-step'
import { CheckoutHeader } from '@/components/checkout/checkout-header'
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary'
import { CheckoutPaymentStep } from '@/components/checkout/checkout-payment-step'
import { CheckoutShippingStep } from '@/components/checkout/checkout-shipping-step'
import { CartDrawer } from '@/components/cart-drawer'
import {
  checkoutPageContentClassName,
  checkoutPageGradientClassName,
  checkoutPageShellClassName,
  checkoutPanelClassName,
  type CheckoutStep,
} from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { cn } from '@/lib/utils'
import {
  isContactStepValid,
  isShippingStepValid,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutRecipientFieldKey,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'

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
  postOffice: '',
  street: '',
  houseNumber: '',
  paymentMethod: 'card-online',
  comment: '',
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartItems()
  const { clearCart, setPersonalDiscountPercent } = useCartActions()
  const [identification, setIdentification] = useState<CheckoutIdentificationState>({
    lookupDone: false,
    customerFound: null,
    returningVerified: false,
    skippedReturningLogin: false,
    attemptingReturningLogin: false,
  })
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [contactTouched, setContactTouched] = useState<
    Partial<Record<CheckoutContactFieldKey, boolean>>
  >({})
  const [shippingTouched, setShippingTouched] = useState<
    Partial<Record<CheckoutShippingFieldKey, boolean>>
  >({})
  const [recipientTouched, setRecipientTouched] = useState<
    Partial<Record<CheckoutRecipientFieldKey, boolean>>
  >({})
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const deliveryPhoneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [mounted, currentStep])

  const patchForm = useCallback((patch: Partial<CheckoutFormValues>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

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
  const canProceedToPayment = useMemo(() => isShippingStepValid(formData), [formData])

  const handleCheckoutBack = useCallback(() => {
    if (currentStep === 'contact') {
      router.back()
      return
    }
    if (currentStep === 'shipping') {
      setCurrentStep('contact')
      return
    }
    setCurrentStep('shipping')
  }, [currentStep, router])

  const tryGoToShipping = useCallback(() => {
    setContactTouched({
      firstName: true,
      lastName: true,
      phone: true,
    })
    if (!isContactStepValid(formData, identification)) return
    setCurrentStep('shipping')
  }, [formData, identification])

  const goToShippingAfterAuth = useCallback(() => {
    setContactTouched({
      firstName: true,
      lastName: true,
      phone: true,
    })
    setCurrentStep('shipping')
  }, [])

  const handleContactLogout = useCallback(() => {
    setPersonalDiscountPercent(0)
    setIdentification({
      lookupDone: false,
      customerFound: null,
      returningVerified: false,
      skippedReturningLogin: false,
      attemptingReturningLogin: false,
    })
    patchForm({ firstName: '', lastName: '', phone: '' })
  }, [patchForm, setPersonalDiscountPercent])

  const tryGoToPayment = useCallback(() => {
    setShippingTouched({
      city: true,
      postOffice: true,
      street: true,
      houseNumber: true,
      deliveryPhone: true,
      patronymic: true,
    })
    if (formData.isOtherRecipient) {
      setRecipientTouched({
        recipientFirstName: true,
        recipientLastName: true,
        recipientPatronymic: true,
        recipientPhone: true,
      })
    }
    if (!isShippingStepValid(formData)) return
    setCurrentStep('payment')
  }, [formData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const orderNumber = `ZY-${Date.now().toString().slice(-8)}`

    clearCart()
    router.push(`/checkout/success?order=${orderNumber}`)
  }

  if (!mounted) {
    return null
  }

  if (items.length === 0) {
    return (
      <div className={checkoutPageShellClassName}>
        <div className={checkoutPageGradientClassName} aria-hidden />
        <div className={cn(checkoutPageContentClassName, 'container mx-auto px-4 py-16')}>
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="mb-4 font-serif text-2xl font-bold text-foreground">Кошик порожній</h1>
            <p className="mb-8 text-muted-foreground">
              Додайте рослини до кошика, щоб оформити замовлення
            </p>
            <Button asChild size="lg">
              <Link href="/catalog">Перейти до каталогу</Link>
            </Button>
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
        currentStep={currentStep}
        onGoToStep={setCurrentStep}
      />

      <div
        className={cn(
          checkoutPageContentClassName,
          'container mx-auto w-full max-w-6xl px-3 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-6 sm:px-4 sm:pt-[calc(4rem+env(safe-area-inset-top))] sm:pb-8'
        )}
      >
        <div className="mx-auto min-w-0 w-full max-w-6xl">
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 lg:col-span-2">
              <form onSubmit={handleSubmit} className="min-w-0 space-y-6" noValidate>
                {currentStep === 'contact' && (
                  <CheckoutContactStep
                    formData={formData}
                    contactTouched={contactTouched}
                    identification={identification}
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
                    onContinue={tryGoToShipping}
                    onAuthenticated={goToShippingAfterAuth}
                    onLogout={handleContactLogout}
                  />
                )}

                {currentStep === 'shipping' && (
                  <CheckoutShippingStep
                    formData={formData}
                    shippingTouched={shippingTouched}
                    recipientTouched={recipientTouched}
                    canProceed={canProceedToPayment}
                    onBlurField={(field) =>
                      setShippingTouched((p) => ({ ...p, [field]: true }))
                    }
                    onBlurRecipientField={(field) =>
                      setRecipientTouched((p) => ({ ...p, [field]: true }))
                    }
                    onPatchForm={patchForm}
                    onBack={() => setCurrentStep('contact')}
                    onContinue={tryGoToPayment}
                    moveDeliveryPhoneCursorToEnd={moveDeliveryPhoneCursorToEnd}
                    deliveryPhoneInputRef={deliveryPhoneInputRef}
                  />
                )}

                {currentStep === 'payment' && (
                  <CheckoutPaymentStep
                    formData={formData}
                    isLoading={isLoading}
                    onPatchForm={patchForm}
                    onBack={() => setCurrentStep('shipping')}
                  />
                )}

                <div className={checkoutPanelClassName}>
                  <div className="space-y-2">
                    <Label htmlFor="checkout-comment">Коментар до замовлення</Label>
                    <Textarea
                      id="checkout-comment"
                      placeholder="Додаткова інформація щодо замовлення..."
                      rows={3}
                      value={formData.comment}
                      onChange={(e) => patchForm({ comment: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="min-w-0 lg:col-span-1">
              <CheckoutOrderSummary />
            </div>
          </div>
        </div>
      </div>
      <CartDrawer />
    </div>
  )
}
