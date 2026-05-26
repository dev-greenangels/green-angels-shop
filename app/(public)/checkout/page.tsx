'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

import { CheckoutContactStep } from '@/components/checkout/checkout-contact-step'
import { CheckoutGuestChoice } from '@/components/checkout/checkout-guest-choice'
import { CheckoutHeader } from '@/components/checkout/checkout-header'
import { CheckoutOrderSummary } from '@/components/checkout/checkout-order-summary'
import { CheckoutPaymentStep } from '@/components/checkout/checkout-payment-step'
import { CheckoutProgress } from '@/components/checkout/checkout-progress'
import { CheckoutShippingStep } from '@/components/checkout/checkout-shipping-step'
import type { CheckoutStep } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import {
  isContactStepValid,
  isShippingStepValid,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'

const initialFormData: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  postOffice: '',
  deliveryMethod: 'nova-poshta',
  paymentMethod: 'card-online',
  comment: '',
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartItems()
  const { clearCart } = useCartActions()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact')
  const [isGuest, setIsGuest] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [contactTouched, setContactTouched] = useState<
    Partial<Record<CheckoutContactFieldKey, boolean>>
  >({})
  const [shippingTouched, setShippingTouched] = useState<
    Partial<Record<CheckoutShippingFieldKey, boolean>>
  >({})
  const phoneInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [mounted, isGuest, currentStep])

  const patchForm = useCallback((patch: Partial<CheckoutFormValues>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  const movePhoneCursorToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = phoneInputRef.current
      if (!el) return
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
  }, [])

  const canProceedToShipping = useMemo(() => isContactStepValid(formData), [formData])
  const canProceedToPayment = useMemo(() => isShippingStepValid(formData), [formData])

  const handleCheckoutBack = useCallback(() => {
    if (currentStep === 'contact') {
      setIsGuest(null)
      return
    }
    if (currentStep === 'shipping') {
      setCurrentStep('contact')
      return
    }
    setCurrentStep('shipping')
  }, [currentStep])

  const tryGoToShipping = useCallback(() => {
    setContactTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    })
    if (!isContactStepValid(formData)) return
    setCurrentStep('shipping')
  }, [formData])

  const tryGoToPayment = useCallback(() => {
    setShippingTouched({
      city: true,
      postOffice: true,
      address: true,
    })
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
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-16">
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

  if (isGuest === null) {
    return (
      <div className="min-h-screen bg-muted/30">
        <CheckoutHeader onBack={() => router.back()} />
        <div className="container mx-auto w-full max-w-4xl px-3 py-8 sm:px-4 lg:py-16">
          <CheckoutGuestChoice onContinueAsGuest={() => setIsGuest(true)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-muted/30">
      <CheckoutHeader sticky onBack={handleCheckoutBack} />

      <div className="container mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="mx-auto min-w-0 w-full max-w-6xl">
          <CheckoutProgress currentStep={currentStep} onGoToStep={setCurrentStep} />

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0 lg:col-span-2">
              <form onSubmit={handleSubmit} className="min-w-0 space-y-6" noValidate>
                {currentStep === 'contact' && (
                  <CheckoutContactStep
                    formData={formData}
                    contactTouched={contactTouched}
                    canProceed={canProceedToShipping}
                    phoneInputRef={phoneInputRef}
                    onBlurField={(field) =>
                      setContactTouched((p) => ({ ...p, [field]: true }))
                    }
                    onPatchForm={patchForm}
                    onContinue={tryGoToShipping}
                    movePhoneCursorToEnd={movePhoneCursorToEnd}
                  />
                )}

                {currentStep === 'shipping' && (
                  <CheckoutShippingStep
                    formData={formData}
                    shippingTouched={shippingTouched}
                    canProceed={canProceedToPayment}
                    onBlurField={(field) =>
                      setShippingTouched((p) => ({ ...p, [field]: true }))
                    }
                    onPatchForm={patchForm}
                    onBack={() => setCurrentStep('contact')}
                    onContinue={tryGoToPayment}
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
              </form>
            </div>

            <div className="min-w-0 lg:col-span-1">
              <CheckoutOrderSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
