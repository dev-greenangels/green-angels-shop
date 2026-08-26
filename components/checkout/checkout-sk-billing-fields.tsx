'use client'

import { useTranslations } from 'next-intl'

import { FieldHint, RequiredLabel } from '@/components/auth/auth-form-ui'
import { checkoutInputClassName } from '@/components/checkout/checkout-utils'
import { CheckoutVatIdField } from '@/components/checkout/checkout-vat-id-field'
import type { CheckoutBuyerType } from '@/components/checkout/checkout-payment-step'
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

export function CheckoutSkBillingFields({
  formData,
  paymentTouched,
  onPatchForm,
  onBlurPaymentField,
  buyerType,
  onBuyerTypeChange,
  vatId,
  onVatIdChange,
  vatCountryCode,
  onVatCountryCodeChange,
  onViesResult,
  viesValid,
}: {
  formData: CheckoutFormValues
  paymentTouched: Partial<Record<CheckoutPaymentFieldKey, boolean>>
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBlurPaymentField: (field: CheckoutPaymentFieldKey) => void
  buyerType: CheckoutBuyerType
  onBuyerTypeChange: (value: CheckoutBuyerType) => void
  vatId: string
  onVatIdChange: (value: string) => void
  vatCountryCode: string
  onVatCountryCodeChange?: (code: string) => void
  onViesResult?: (result: { valid: boolean | null } | null) => void
  viesValid?: boolean | null
}) {
  const t = useTranslations('checkout')
  const requireCompanyFields = buyerType === 'company'

  const showPaymentError = (field: CheckoutPaymentFieldKey) =>
    Boolean(
      paymentTouched[field] &&
        getCheckoutPaymentFieldError(field, formData, {
          requireCompanyFields,
          marketRegion: 'sk',
        }),
    )

  const handleBuyerTypeChange = (value: CheckoutBuyerType) => {
    onBuyerTypeChange(value)
    if (value === 'individual') {
      onPatchForm({
        companyEdrpou: '',
        companyLegalName: '',
        companyDic: '',
        companyStreet: '',
        companyCity: '',
        companyPostalCode: '',
      })
      onVatIdChange('')
      onViesResult?.(null)
    }
  }

  const showReverseChargeHint =
    requireCompanyFields && viesValid === true && vatCountryCode.toUpperCase() !== 'SK'

  return (
    <div className="mt-8 space-y-4 border-t border-border/60 pt-6">
      <div>
        <h3 className="font-serif text-lg font-semibold text-foreground">{t('billingTitle')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('billingHint')}</p>
      </div>

      <div>
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
                id={`sk-buyer-${type}`}
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

      {requireCompanyFields ? (
        <div className="space-y-4 rounded-lg border border-border/80 bg-muted p-4 shadow-sm">
          <CheckoutVatIdField
            countryCode={vatCountryCode}
            onCountryCodeChange={onVatCountryCodeChange}
            value={vatId}
            onChange={onVatIdChange}
            onViesResult={onViesResult}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="sk-company-ico">{t('ico')}</RequiredLabel>
              <InputWithClear
                id="sk-company-ico"
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
                id="sk-company-ico-error"
                show={Boolean(paymentTouched.companyEdrpou)}
                message={getCheckoutPaymentFieldError('companyEdrpou', formData, {
                  requireCompanyFields,
                  marketRegion: 'sk',
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sk-company-dic">{t('companyDic')}</Label>
              <InputWithClear
                id="sk-company-dic"
                autoComplete="off"
                placeholder="2020123456"
                className={checkoutInputClassName}
                value={formData.companyDic}
                onBlur={() => onBlurPaymentField('companyDic')}
                onChange={(e) => onPatchForm({ companyDic: e.target.value })}
                onClear={() => onPatchForm({ companyDic: '' })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="sk-company-legal-name">{t('companyLegalName')}</RequiredLabel>
            <InputWithClear
              id="sk-company-legal-name"
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
              id="sk-company-legal-name-error"
              show={Boolean(paymentTouched.companyLegalName)}
              message={getCheckoutPaymentFieldError('companyLegalName', formData, {
                requireCompanyFields,
                marketRegion: 'sk',
              })}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="sk-company-street">{t('companyStreet')}</RequiredLabel>
            <InputWithClear
              id="sk-company-street"
              autoComplete="street-address"
              className={cn(
                checkoutInputClassName,
                showPaymentError('companyStreet') && 'border-destructive/80 ring-destructive/30',
              )}
              value={formData.companyStreet}
              onBlur={() => onBlurPaymentField('companyStreet')}
              onChange={(e) => onPatchForm({ companyStreet: e.target.value })}
              onClear={() => onPatchForm({ companyStreet: '' })}
            />
            <FieldHint
              id="sk-company-street-error"
              show={Boolean(paymentTouched.companyStreet)}
              message={getCheckoutPaymentFieldError('companyStreet', formData, {
                requireCompanyFields,
                marketRegion: 'sk',
              })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="sk-company-psc">{t('companyPostalCode')}</RequiredLabel>
              <InputWithClear
                id="sk-company-psc"
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
                id="sk-company-psc-error"
                show={Boolean(paymentTouched.companyPostalCode)}
                message={getCheckoutPaymentFieldError('companyPostalCode', formData, {
                  requireCompanyFields,
                  marketRegion: 'sk',
                })}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="sk-company-city">{t('companyCity')}</RequiredLabel>
              <InputWithClear
                id="sk-company-city"
                autoComplete="address-level2"
                className={cn(
                  checkoutInputClassName,
                  showPaymentError('companyCity') && 'border-destructive/80 ring-destructive/30',
                )}
                value={formData.companyCity}
                onBlur={() => onBlurPaymentField('companyCity')}
                onChange={(e) => onPatchForm({ companyCity: e.target.value })}
                onClear={() => onPatchForm({ companyCity: '' })}
              />
              <FieldHint
                id="sk-company-city-error"
                show={Boolean(paymentTouched.companyCity)}
                message={getCheckoutPaymentFieldError('companyCity', formData, {
                  requireCompanyFields,
                  marketRegion: 'sk',
                })}
              />
            </div>
          </div>
          {showReverseChargeHint ? (
            <p className="text-sm font-medium text-primary">{t('vatZeroDphApplied')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
