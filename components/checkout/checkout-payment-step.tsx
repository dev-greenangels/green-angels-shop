'use client'

import { memo, useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import { checkoutPanelClassName, checkoutInputClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  getCheckoutPaymentFieldError,
  sanitizeEdrpouInput,
  type CheckoutFormValues,
  type CheckoutPaymentFieldKey,
} from '@/lib/validation/checkout-form'
import type { CheckoutPaymentMethodSlug } from '@/lib/checkout/methods'

const PAYMENT_METHODS = ['card-online', 'bank-transfer', 'bank-transfer-legal'] as const

export const CheckoutPaymentStep = memo(function CheckoutPaymentStep({
  formData,
  enabledPaymentMethods,
  paymentTouched,
  onPatchForm,
  onBlurPaymentField,
  showStepNav = true,
  onBack,
}: {
  formData: CheckoutFormValues
  enabledPaymentMethods?: CheckoutPaymentMethodSlug[]
  paymentTouched: Partial<Record<CheckoutPaymentFieldKey, boolean>>
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBlurPaymentField: (field: CheckoutPaymentFieldKey) => void
  showStepNav?: boolean
  onBack: () => void
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const visiblePaymentMethods = useMemo(
    () =>
      PAYMENT_METHODS.filter((method) =>
        enabledPaymentMethods?.length ? enabledPaymentMethods.includes(method) : true,
      ),
    [enabledPaymentMethods],
  )

  const showPaymentError = (field: CheckoutPaymentFieldKey) =>
    Boolean(paymentTouched[field] && getCheckoutPaymentFieldError(field, formData))

  const handlePaymentMethodChange = (value: string) => {
    if (value !== 'bank-transfer-legal') {
      onPatchForm({
        paymentMethod: value as CheckoutFormValues['paymentMethod'],
        companyEdrpou: '',
        companyLegalName: '',
      })
      return
    }
    onPatchForm({ paymentMethod: 'bank-transfer-legal' })
  }

  return (
    <div className={checkoutPanelClassName}>
      <header className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          {t('stepLabel', { step: 3 })}
        </p>
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
          <CreditCard className="h-5 w-5 text-primary" />
          {t('paymentTitle')}
        </h2>
      </header>

      <div className="space-y-6">
        <div>
          <Label className="mb-4 block text-base font-medium">{t('paymentMethod')}</Label>
          <RadioGroup
            value={formData.paymentMethod}
            onValueChange={handlePaymentMethodChange}
            className="space-y-3"
          >
            {visiblePaymentMethods.map((method) => (
              <label
                key={method}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 shadow-sm transition-[border-color,box-shadow,background-color]',
                  formData.paymentMethod === method
                    ? 'border-primary bg-primary/8 shadow-md ring-2 ring-primary/15'
                    : 'border-border/80 bg-card hover:border-primary/45 hover:shadow-md',
                )}
              >
                <RadioGroupItem
                  value={method}
                  id={method}
                  className="size-5 border-2 border-border/90 bg-background shadow-sm data-[state=checked]:border-primary"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {t(`paymentMethods.${method}.title`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(`paymentMethods.${method}.description`)}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {formData.paymentMethod === 'bank-transfer-legal' ? (
          <div className="space-y-4 rounded-lg border border-border/80 bg-background p-4 shadow-sm">
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-edrpou">{t('edrpou')}</RequiredLabel>
              <InputWithClear
                id="company-edrpou"
                inputMode="numeric"
                autoComplete="off"
                placeholder="12345678"
                maxLength={8}
                className={cn(
                  checkoutInputClassName,
                  showPaymentError('companyEdrpou') && 'border-destructive/80 ring-destructive/30',
                )}
                value={formData.companyEdrpou}
                onBlur={() => onBlurPaymentField('companyEdrpou')}
                onChange={(e) =>
                  onPatchForm({ companyEdrpou: sanitizeEdrpouInput(e.target.value) })
                }
                onClear={() => onPatchForm({ companyEdrpou: '' })}
              />
              <FieldHint
                id="company-edrpou-error"
                show={Boolean(paymentTouched.companyEdrpou)}
                message={getCheckoutPaymentFieldError('companyEdrpou', formData)}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-legal-name">{t('companyLegalName')}</RequiredLabel>
              <InputWithClear
                id="company-legal-name"
                autoComplete="organization"
                placeholder={t('companyPlaceholder')}
                className={cn(
                  checkoutInputClassName,
                  showPaymentError('companyLegalName') && 'border-destructive/80 ring-destructive/30',
                )}
                value={formData.companyLegalName}
                onBlur={() => onBlurPaymentField('companyLegalName')}
                onChange={(e) => onPatchForm({ companyLegalName: e.target.value })}
                onClear={() => onPatchForm({ companyLegalName: '' })}
              />
              <FieldHint
                id="company-legal-name-error"
                show={Boolean(paymentTouched.companyLegalName)}
                message={getCheckoutPaymentFieldError('companyLegalName', formData)}
              />
            </div>
          </div>
        ) : null}
      </div>

      {showStepNav ? (
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBack}>
            {tc('back')}
          </Button>
        </div>
      ) : null}
    </div>
  )
})
