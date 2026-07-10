'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft, CreditCard, Truck, User } from 'lucide-react'

import {
  CHECKOUT_STEP_META,
  checkoutHeaderClassName,
  isCheckoutStepComplete,
  type CheckoutStep,
} from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

const STEP_ICONS = {
  contact: User,
  shipping: Truck,
  payment: CreditCard,
} as const

export function CheckoutHeader({
  onBack,
  progressStepIndex,
  contactComplete = false,
  shippingComplete = false,
  paymentComplete = false,
  scrollToStep,
  sticky = false,
}: {
  onBack: () => void
  /** 0 = замовник, 1 = доставка, 2 = оплата — за заповненням форми */
  progressStepIndex: number
  contactComplete?: boolean
  shippingComplete?: boolean
  paymentComplete?: boolean
  scrollToStep?: (step: CheckoutStep) => void
  sticky?: boolean
}) {
  const tc = useTranslations('common')
  const headerContent = (
    <header
      className={cn(
        checkoutHeaderClassName,
        'pt-[env(safe-area-inset-top)]',
        sticky ? 'fixed inset-x-0 top-0 z-50' : 'relative'
      )}
    >
      <div className={cn(siteContentShellClassName, 'py-2')}>
        <div className="relative h-12">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -ml-1 -translate-y-1/2"
            aria-label={tc('back')}
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex h-full items-center justify-center">
            <CheckoutHeaderProgress
              progressStepIndex={progressStepIndex}
              contactComplete={contactComplete}
              shippingComplete={shippingComplete}
              paymentComplete={paymentComplete}
              scrollToStep={scrollToStep}
            />
          </div>
        </div>
      </div>
    </header>
  )

  return (
    <>
      {headerContent}
      {sticky && <div className="h-[calc(3.5rem+env(safe-area-inset-top))]" aria-hidden />}
    </>
  )
}

const CheckoutHeaderProgress = memo(function CheckoutHeaderProgress({
  progressStepIndex,
  contactComplete,
  shippingComplete,
  paymentComplete,
  scrollToStep,
}: {
  progressStepIndex: number
  contactComplete: boolean
  shippingComplete: boolean
  paymentComplete: boolean
  scrollToStep?: (step: CheckoutStep) => void
}) {
  const t = useTranslations('checkout')
  return (
    <div className="mx-auto flex w-full max-w-max items-center justify-center gap-1.5 overflow-x-auto">
      {CHECKOUT_STEP_META.map((step, index) => {
        const Icon = STEP_ICONS[step.key]
        const isCurrent = index === progressStepIndex
        const isComplete = isCheckoutStepComplete(
          step.key,
          contactComplete,
          shippingComplete,
          paymentComplete,
        )
        const canClick = Boolean(scrollToStep) && (isComplete || index <= progressStepIndex)

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => {
                if (canClick && scrollToStep) scrollToStep(step.key)
              }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                isCurrent && 'border-primary bg-primary text-primary-foreground',
                !isCurrent && isComplete && 'border-primary/35 bg-primary/10 text-primary',
                !isCurrent && !isComplete && 'border-border bg-muted text-muted-foreground',
                canClick && 'cursor-pointer hover:bg-primary/20'
              )}
              aria-label={t(`steps.${step.key}`)}
              aria-current={isCurrent ? 'step' : undefined}
              title={t(`steps.${step.key}`)}
            >
              <Icon className="h-4 w-4" />
            </button>
            {index < CHECKOUT_STEP_META.length - 1 && (
              <div
                className={cn(
                  'mx-1.5 h-0.5 w-6 rounded',
                  isComplete ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})
