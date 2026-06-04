'use client'

import { memo } from 'react'
import { ArrowLeft, CreditCard, Truck, User } from 'lucide-react'

import {
  CHECKOUT_STEP_META,
  checkoutHeaderClassName,
  type CheckoutStep,
} from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STEP_ICONS = {
  contact: User,
  shipping: Truck,
  payment: CreditCard,
} as const

export function CheckoutHeader({
  onBack,
  currentStep,
  onGoToStep,
  sticky = false,
}: {
  onBack: () => void
  currentStep?: CheckoutStep
  onGoToStep?: (step: CheckoutStep) => void
  sticky?: boolean
}) {
  const currentStepIndex = currentStep
    ? CHECKOUT_STEP_META.findIndex((s) => s.key === currentStep)
    : -1

  const headerContent = (
    <header
      className={cn(
        checkoutHeaderClassName,
        'pt-[env(safe-area-inset-top)]',
        sticky ? 'fixed inset-x-0 top-0 z-50' : 'relative'
      )}
    >
      <div className="container mx-auto max-w-6xl px-3 py-2 sm:px-4">
        {currentStep ? (
          <div className="relative h-12">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -ml-1 -translate-y-1/2"
              aria-label="Назад"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex h-full items-center justify-center">
              <CheckoutHeaderProgress
                currentStepIndex={currentStepIndex}
                onGoToStep={onGoToStep}
              />
            </div>
          </div>
        ) : (
          <div className="grid h-12 grid-cols-[2.75rem_1fr_2.75rem] items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-ml-1 justify-self-start"
              aria-label="Назад"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <h1 className="col-start-2 row-start-1 truncate px-2 text-center text-sm font-semibold sm:text-base">
              Оформлення замовлення
            </h1>

            <div className="col-start-3 w-11" aria-hidden />
          </div>
        )}
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
  currentStepIndex,
  onGoToStep,
}: {
  currentStepIndex: number
  onGoToStep?: (step: CheckoutStep) => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-max items-center justify-center gap-1.5 overflow-x-auto">
      {CHECKOUT_STEP_META.map((step, index) => {
        const Icon = STEP_ICONS[step.key]
        const isCurrent = index === currentStepIndex
        const isPast = index < currentStepIndex
        const isFuture = index > currentStepIndex
        const canClick = Boolean(onGoToStep) && isPast

        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => {
                if (canClick && onGoToStep) onGoToStep(step.key)
              }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border transition-colors',
                isCurrent && 'border-primary bg-primary text-primary-foreground',
                isPast && 'border-primary/35 bg-primary/10 text-primary',
                isFuture && 'border-border bg-muted text-muted-foreground',
                canClick && 'cursor-pointer hover:bg-primary/20'
              )}
              aria-label={step.label}
              title={step.label}
            >
              <Icon className="h-4 w-4" />
            </button>
            {index < CHECKOUT_STEP_META.length - 1 && (
              <div
                className={cn(
                  'mx-1.5 h-0.5 w-6 rounded',
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})
