'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { CreditCard, Truck, User } from 'lucide-react'

import { CHECKOUT_STEP_META, type CheckoutStep } from '@/components/checkout/checkout-utils'

const STEP_ICONS = {
  contact: User,
  shipping: Truck,
  payment: CreditCard,
} as const

export const CheckoutProgress = memo(function CheckoutProgress({
  currentStep,
  onGoToStep,
}: {
  currentStep: CheckoutStep
  onGoToStep: (step: CheckoutStep) => void
}) {
  const t = useTranslations('checkout')
  const currentStepIndex = CHECKOUT_STEP_META.findIndex((s) => s.key === currentStep)

  return (
    <div className="-mx-1 mb-6 flex max-w-full items-center justify-start overflow-x-auto px-1 pb-1 sm:mb-8 sm:justify-center">
      {CHECKOUT_STEP_META.map((step, index) => {
        const Icon = STEP_ICONS[step.key]
        return (
          <div key={step.key} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (index < currentStepIndex) onGoToStep(step.key)
              }}
              disabled={index > currentStepIndex}
              className={`flex min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 rounded-full px-3 py-2.5 transition-colors sm:min-w-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-2 ${
                index === currentStepIndex
                  ? 'bg-primary-gradient text-primary-foreground'
                  : index < currentStepIndex
                    ? 'cursor-pointer bg-primary/10 text-primary hover:bg-primary/20'
                    : 'cursor-not-allowed bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-center text-xs font-medium leading-tight sm:text-sm">
                {t(`steps.${step.key}`)}
              </span>
            </button>
            {index < CHECKOUT_STEP_META.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-8 sm:w-16 ${
                  index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
})
