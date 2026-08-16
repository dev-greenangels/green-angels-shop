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
import { CheckoutVatIdField } from '@/components/checkout/checkout-vat-id-field'

const PAYMENT_METHODS = ['card-online', 'bank-transfer', 'bank-transfer-legal', 'dobierka'] as const

export type CheckoutBuyerType = 'individual' | 'company'

function resolveVisiblePaymentMethods(
  enabledPaymentMethods: CheckoutPaymentMethodSlug[] | undefined,
  hideLegalBankTransfer: boolean,
): CheckoutPaymentMethodSlug[] {
  const base = PAYMENT_METHODS.filter((method) => {
    if (hideLegalBankTransfer && method === 'bank-transfer-legal') return false
    if (!enabledPaymentMethods?.length) return true
    if (method === 'bank-transfer' && hideLegalBankTransfer) {
      return (
        enabledPaymentMethods.includes('bank-transfer') ||
        enabledPaymentMethods.includes('bank-transfer-legal')
      )
    }
    return enabledPaymentMethods.includes(method)
  })
  return base
}

export const CheckoutPaymentStep = memo(function CheckoutPaymentStep({
  formData,
  enabledPaymentMethods,
  paymentTouched,
  onPatchForm,
  onBlurPaymentField,
  showStepNav = true,
  onBack,
  showBuyerType = false,
  billingFieldsInContactStep = false,
  buyerType = 'individual',
  onBuyerTypeChange,
  showVatIdField = false,
  vatId = '',
  onVatIdChange,
  vatCountryCode = 'SK',
  onVatCountryCodeChange,
  onViesResult,
}: {
  formData: CheckoutFormValues
  enabledPaymentMethods?: CheckoutPaymentMethodSlug[]
  paymentTouched: Partial<Record<CheckoutPaymentFieldKey, boolean>>
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBlurPaymentField: (field: CheckoutPaymentFieldKey) => void
  showStepNav?: boolean
  onBack: () => void
  showBuyerType?: boolean
  /** When true, buyer type / company / VAT fields live in contact step — hide them here. */
  billingFieldsInContactStep?: boolean
  buyerType?: CheckoutBuyerType
  onBuyerTypeChange?: (value: CheckoutBuyerType) => void
  showVatIdField?: boolean
  vatId?: string
  onVatIdChange?: (value: string) => void
  vatCountryCode?: string
  onVatCountryCodeChange?: (code: string) => void
  onViesResult?: (result: { valid: boolean | null } | null) => void
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const hideLegalBankTransfer = showBuyerType
  const visiblePaymentMethods = useMemo(
    () => resolveVisiblePaymentMethods(enabledPaymentMethods, hideLegalBankTransfer),
    [enabledPaymentMethods, hideLegalBankTransfer],
  )

  const requireCompanyFields = billingFieldsInContactStep
    ? false
    : showBuyerType
      ? buyerType === 'company'
      : formData.paymentMethod === 'bank-transfer-legal'

  const showPaymentError = (field: CheckoutPaymentFieldKey) =>
    Boolean(
      paymentTouched[field] &&
        getCheckoutPaymentFieldError(field, formData, {
          requireCompanyFields,
          marketRegion: showVatIdField ? 'sk' : 'ua',
        }),
    )

  const handleBuyerTypeChange = (value: CheckoutBuyerType) => {
    onBuyerTypeChange?.(value)
    const patch: Partial<CheckoutFormValues> = {}
    if (value === 'individual') {
      patch.companyEdrpou = ''
      patch.companyLegalName = ''
      patch.companyDic = ''
      patch.companyStreet = ''
      patch.companyCity = ''
      patch.companyPostalCode = ''
    }
    if (formData.paymentMethod === 'bank-transfer-legal') {
      patch.paymentMethod = 'bank-transfer'
    }
    if (Object.keys(patch).length > 0) onPatchForm(patch)
  }

  const handlePaymentMethodChange = (value: string) => {
    const method = value as CheckoutFormValues['paymentMethod']
    onPatchForm({ paymentMethod: method })
    if (!showBuyerType && method === 'bank-transfer-legal' && onBuyerTypeChange) {
      onBuyerTypeChange('company')
    }
  }

  const paymentMethodValue =
    showBuyerType && formData.paymentMethod === 'bank-transfer-legal'
      ? 'bank-transfer'
      : formData.paymentMethod

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
        {!billingFieldsInContactStep && showBuyerType && onBuyerTypeChange ? (
          <div>
            <Label className="mb-4 block text-base font-medium">{t('buyerTypeLabel')}</Label>
            <RadioGroup
              value={buyerType}
              onValueChange={(value) => handleBuyerTypeChange(value as CheckoutBuyerType)}
              className="grid gap-2 sm:grid-cols-2"
            >
              {(['individual', 'company'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 transition-[border-color,background-color,box-shadow]',
                    buyerType === type
                      ? 'border-primary bg-primary/8 shadow-sm'
                      : 'border-border bg-card hover:border-primary/45',
                  )}
                >
                  <RadioGroupItem
                    value={type}
                    id={`buyer-${type}`}
                    className="size-4 border-2 border-foreground/35 text-primary shadow-none data-[state=checked]:border-primary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{t(`buyerType.${type}.title`)}</p>
                    <p className="text-xs leading-snug text-muted-foreground">
                      {t(`buyerType.${type}.description`)}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        ) : null}

        {!billingFieldsInContactStep && requireCompanyFields ? (
          <div className="space-y-4 rounded-lg border border-border/80 bg-muted p-4 shadow-sm">
            <div className="space-y-2">
              <RequiredLabel htmlFor="company-edrpou">
                {showVatIdField ? t('ico') : t('edrpou')}
              </RequiredLabel>
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
                message={getCheckoutPaymentFieldError('companyEdrpou', formData, {
                  requireCompanyFields,
                  marketRegion: showVatIdField ? 'sk' : 'ua',
                })}
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
                message={getCheckoutPaymentFieldError('companyLegalName', formData, {
                  requireCompanyFields,
                  marketRegion: showVatIdField ? 'sk' : 'ua',
                })}
              />
            </div>
            {showVatIdField ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company-dic">{t('companyDic')}</Label>
                  <InputWithClear
                    id="company-dic"
                    autoComplete="off"
                    placeholder="2020123456"
                    className={checkoutInputClassName}
                    value={formData.companyDic}
                    onBlur={() => onBlurPaymentField('companyDic')}
                    onChange={(e) => onPatchForm({ companyDic: e.target.value })}
                    onClear={() => onPatchForm({ companyDic: '' })}
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="company-street">{t('companyStreet')}</RequiredLabel>
                  <InputWithClear
                    id="company-street"
                    autoComplete="street-address"
                    className={cn(
                      checkoutInputClassName,
                      showPaymentError('companyStreet') &&
                        'border-destructive/80 ring-destructive/30',
                    )}
                    value={formData.companyStreet}
                    onBlur={() => onBlurPaymentField('companyStreet')}
                    onChange={(e) => onPatchForm({ companyStreet: e.target.value })}
                    onClear={() => onPatchForm({ companyStreet: '' })}
                  />
                  <FieldHint
                    id="company-street-error"
                    show={Boolean(paymentTouched.companyStreet)}
                    message={getCheckoutPaymentFieldError('companyStreet', formData, {
                      requireCompanyFields,
                      marketRegion: 'sk',
                    })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="company-city">{t('companyCity')}</RequiredLabel>
                    <InputWithClear
                      id="company-city"
                      autoComplete="address-level2"
                      className={cn(
                        checkoutInputClassName,
                        showPaymentError('companyCity') &&
                          'border-destructive/80 ring-destructive/30',
                      )}
                      value={formData.companyCity}
                      onBlur={() => onBlurPaymentField('companyCity')}
                      onChange={(e) => onPatchForm({ companyCity: e.target.value })}
                      onClear={() => onPatchForm({ companyCity: '' })}
                    />
                    <FieldHint
                      id="company-city-error"
                      show={Boolean(paymentTouched.companyCity)}
                      message={getCheckoutPaymentFieldError('companyCity', formData, {
                        requireCompanyFields,
                        marketRegion: 'sk',
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <RequiredLabel htmlFor="company-psc">{t('companyPostalCode')}</RequiredLabel>
                    <InputWithClear
                      id="company-psc"
                      autoComplete="postal-code"
                      className={cn(
                        checkoutInputClassName,
                        showPaymentError('companyPostalCode') &&
                          'border-destructive/80 ring-destructive/30',
                      )}
                      value={formData.companyPostalCode}
                      onBlur={() => onBlurPaymentField('companyPostalCode')}
                      onChange={(e) => onPatchForm({ companyPostalCode: e.target.value })}
                      onClear={() => onPatchForm({ companyPostalCode: '' })}
                    />
                    <FieldHint
                      id="company-psc-error"
                      show={Boolean(paymentTouched.companyPostalCode)}
                      message={getCheckoutPaymentFieldError('companyPostalCode', formData, {
                        requireCompanyFields,
                        marketRegion: 'sk',
                      })}
                    />
                  </div>
                </div>
              </>
            ) : null}

            {showVatIdField && onVatIdChange ? (
              <CheckoutVatIdField
                countryCode={vatCountryCode}
                onCountryCodeChange={onVatCountryCodeChange}
                value={vatId}
                onChange={onVatIdChange}
                onViesResult={onViesResult}
              />
            ) : null}
          </div>
        ) : null}

        <div>
          <Label className="mb-4 block text-base font-medium">{t('paymentMethod')}</Label>
          <RadioGroup
            value={paymentMethodValue}
            onValueChange={handlePaymentMethodChange}
            className="space-y-3"
          >
            {visiblePaymentMethods.map((method) => (
              <label
                key={method}
                className={cn(
                  'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 shadow-sm transition-[border-color,box-shadow,background-color]',
                  paymentMethodValue === method
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
