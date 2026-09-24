'use client'

import { useTranslations } from 'next-intl'

import { FieldHint, RequiredLabel } from '@/components/auth/auth-form-ui'
import { checkoutInputClassName } from '@/components/checkout/checkout-utils'
import { InputWithClear } from '@/components/ui/input-with-clear'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { deliveryCountryFlag } from '@/lib/checkout/delivery-country-flags'
import {
  getCheckoutBillingFieldError,
  type CheckoutBillingFieldKey,
  type CheckoutFormValues,
  type CheckoutMarketRegion,
} from '@/lib/validation/checkout-form'
import { useFormatFieldError } from '@/lib/validation/use-field-error-messages'

export function CheckoutInvoiceAddressFields({
  formData,
  marketRegion = 'ua',
  buyerType = 'individual',
  enabledCountries,
  billingTouched,
  onBlurBillingField,
  onPatchForm,
  /** When true: panel matches company billing card (no section title; shown under buyer-type radios). */
  embedded = false,
}: {
  formData: CheckoutFormValues
  marketRegion?: CheckoutMarketRegion
  buyerType?: 'individual' | 'company'
  enabledCountries?: string[]
  billingTouched: Partial<Record<CheckoutBillingFieldKey, boolean>>
  onBlurBillingField: (field: CheckoutBillingFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  embedded?: boolean
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const fe = useFormatFieldError()

  if (marketRegion !== 'sk') return null
  // B2B: company seat is the billing snapshot source (copied in payload).
  if (buyerType === 'company') return null

  const countries =
    enabledCountries && enabledCountries.length > 0
      ? enabledCountries
      : ['sk', 'hu', 'at']

  const billingCountry =
    formData.billingCountryCode || formData.deliveryCountryCode || countries[0] || 'sk'

  const showError = (field: CheckoutBillingFieldKey) =>
    Boolean(
      billingTouched[field] &&
        fe(
          getCheckoutBillingFieldError(field, formData, {
            marketRegion,
            buyerType,
          }),
        ),
    )

  return (
    <div
      className={
        embedded
          ? 'space-y-4 rounded-lg border border-border/80 bg-muted p-4 shadow-sm'
          : 'space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4'
      }
    >
      {embedded ? (
        <p className="text-xs text-muted-foreground">{t('invoiceAddressHint')}</p>
      ) : (
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('invoiceAddressTitle')}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t('invoiceAddressHint')}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <RequiredLabel htmlFor="billing-country">{t('billingCountry')}</RequiredLabel>
          <Select
            value={billingCountry}
            onValueChange={(value) => {
              onPatchForm({ billingCountryCode: value })
              onBlurBillingField('billingCountryCode')
            }}
          >
            <SelectTrigger
              id="billing-country"
              className={cn(
                'h-10 w-full border-2',
                formData.billingCountryCode &&
                  'border-primary/35 bg-primary/[0.06] font-medium',
                showError('billingCountryCode') &&
                  'border-destructive/80 ring-destructive/30',
              )}
              aria-invalid={showError('billingCountryCode')}
            >
              <SelectValue placeholder={t('billingCountry')} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((code) => (
                <SelectItem key={code} value={code}>
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{deliveryCountryFlag(code)}</span>
                    <span>{t(`deliveryCountries.${code}` as 'deliveryCountries.sk')}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHint
            id="billing-country-error"
            show={Boolean(billingTouched.billingCountryCode)}
            message={fe(
              getCheckoutBillingFieldError('billingCountryCode', formData, {
                marketRegion,
                buyerType,
              }),
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-2">
            <RequiredLabel htmlFor="billing-street">{tc('street')}</RequiredLabel>
            <InputWithClear
              id="billing-street"
              autoComplete="billing address-line1"
              className={cn(
                checkoutInputClassName,
                showError('billingStreet') && 'border-destructive/80 ring-destructive/30',
              )}
              value={formData.billingStreet}
              onBlur={() => onBlurBillingField('billingStreet')}
              onChange={(e) => onPatchForm({ billingStreet: e.target.value })}
              onClear={() => onPatchForm({ billingStreet: '' })}
            />
            <FieldHint
              id="billing-street-error"
              show={Boolean(billingTouched.billingStreet)}
              message={fe(
                getCheckoutBillingFieldError('billingStreet', formData, {
                  marketRegion,
                  buyerType,
                }),
              )}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="billing-house">{t('billingHouseNumber')}</RequiredLabel>
            <InputWithClear
              id="billing-house"
              autoComplete="billing address-line2"
              className={cn(
                checkoutInputClassName,
                showError('billingHouseNumber') && 'border-destructive/80 ring-destructive/30',
              )}
              value={formData.billingHouseNumber}
              onBlur={() => onBlurBillingField('billingHouseNumber')}
              onChange={(e) => onPatchForm({ billingHouseNumber: e.target.value })}
              onClear={() => onPatchForm({ billingHouseNumber: '' })}
            />
            <FieldHint
              id="billing-house-error"
              show={Boolean(billingTouched.billingHouseNumber)}
              message={fe(
                getCheckoutBillingFieldError('billingHouseNumber', formData, {
                  marketRegion,
                  buyerType,
                }),
              )}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <RequiredLabel htmlFor="billing-city">{tc('city')}</RequiredLabel>
            <InputWithClear
              id="billing-city"
              autoComplete="billing address-level2"
              className={cn(
                checkoutInputClassName,
                showError('billingCity') && 'border-destructive/80 ring-destructive/30',
              )}
              value={formData.billingCity}
              onBlur={() => onBlurBillingField('billingCity')}
              onChange={(e) => onPatchForm({ billingCity: e.target.value })}
              onClear={() => onPatchForm({ billingCity: '' })}
            />
            <FieldHint
              id="billing-city-error"
              show={Boolean(billingTouched.billingCity)}
              message={fe(
                getCheckoutBillingFieldError('billingCity', formData, {
                  marketRegion,
                  buyerType,
                }),
              )}
            />
          </div>
          <div className="space-y-2">
            <RequiredLabel htmlFor="billing-psc">{t('postalCode')}</RequiredLabel>
            <InputWithClear
              id="billing-psc"
              autoComplete="billing postal-code"
              className={cn(
                checkoutInputClassName,
                showError('billingPostalCode') && 'border-destructive/80 ring-destructive/30',
              )}
              value={formData.billingPostalCode}
              onBlur={() => onBlurBillingField('billingPostalCode')}
              onChange={(e) => onPatchForm({ billingPostalCode: e.target.value })}
              onClear={() => onPatchForm({ billingPostalCode: '' })}
            />
            <FieldHint
              id="billing-psc-error"
              show={Boolean(billingTouched.billingPostalCode)}
              message={fe(
                getCheckoutBillingFieldError('billingPostalCode', formData, {
                  marketRegion,
                  buyerType,
                }),
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
