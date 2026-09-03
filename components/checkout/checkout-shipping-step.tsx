'use client'

import { memo, useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import {
  checkoutInsetPanelClassName,
  checkoutPanelClassName,
  checkoutInputClassName,
} from '@/components/checkout/checkout-utils'
import { CheckoutDeliveryFields } from '@/components/checkout/checkout-delivery-fields'
import type { PacketaCartFit } from '@/components/checkout/packeta-pickup-point-field'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { cn } from '@/lib/utils'
import {
  getCheckoutContactFieldError,
  customerNeedsCheckoutNameEntry,
  sanitizeCyrillicName,
  sanitizeLatinName,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutMarketRegion,
  type CheckoutRecipientFieldKey,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'
import { extractShipmentSlice } from '@/lib/checkout/shipment-slice'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'
import type { CountrySiteProfile } from '@/lib/settings/market'

export const CheckoutShippingStep = memo(function CheckoutShippingStep({
  formData,
  enabledDeliveryMethods,
  identification,
  contactTouched,
  shippingTouched,
  recipientTouched,
  canProceed,
  onBlurField,
  onBlurContactField,
  onBlurRecipientField,
  onPatchForm,
  onBack,
  onContinue,
  moveDeliveryPhoneCursorToEnd,
  deliveryPhoneInputRef,
  showStepNav = true,
  shipmentSplitSection,
  shipmentSplitActive = false,
  marketRegion = 'ua',
  deliveryPhonePolicy,
  enabledCountrySites,
  enabledDeliveryCountries,
  beforeRecipientSlot,
  packetaCartFit,
}: {
  formData: CheckoutFormValues
  enabledDeliveryMethods?: CheckoutDeliveryMethodSlug[]
  identification: CheckoutIdentificationState
  contactTouched: Partial<Record<CheckoutContactFieldKey, boolean>>
  shippingTouched: Partial<Record<CheckoutShippingFieldKey, boolean>>
  recipientTouched: Partial<Record<CheckoutRecipientFieldKey, boolean>>
  canProceed: boolean
  onBlurField: (field: CheckoutShippingFieldKey) => void
  onBlurContactField: (field: CheckoutContactFieldKey) => void
  onBlurRecipientField: (field: CheckoutRecipientFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBack: () => void
  onContinue: () => void
  moveDeliveryPhoneCursorToEnd: () => void
  deliveryPhoneInputRef: React.RefObject<HTMLInputElement | null>
  showStepNav?: boolean
  shipmentSplitSection?: ReactNode
  shipmentSplitActive?: boolean
  marketRegion?: CheckoutMarketRegion
  deliveryPhonePolicy?: import('@/lib/settings/market').PhonePolicy
  enabledCountrySites?: CountrySiteProfile[]
  enabledDeliveryCountries?: string[]
  beforeRecipientSlot?: ReactNode
  packetaCartFit?: PacketaCartFit
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const contactErrorOptions = { marketRegion, deliveryPhonePolicy, authPhonePolicy: undefined }
  const sanitizeName = marketRegion === 'sk' ? sanitizeLatinName : sanitizeCyrillicName

  const showContactError = (field: CheckoutContactFieldKey) =>
    Boolean(
      contactTouched[field] &&
        getCheckoutContactFieldError(field, formData, contactErrorOptions),
    )

  const needsNameEntry = customerNeedsCheckoutNameEntry(formData, identification, {
    marketRegion,
  })
  const [showNameEntryPanel, setShowNameEntryPanel] = useState(needsNameEntry)

  useEffect(() => {
    if (needsNameEntry) {
      setShowNameEntryPanel(true)
    }
  }, [needsNameEntry])

  // SK market already collects name on the contact step (step 1) for authenticated users,
  // so only show the name panel here for UA/other markets (e.g. Google OAuth flow).
  const showGoogleNameFields =
    identification.returningVerified && showNameEntryPanel && marketRegion !== 'sk'

  return (
    <div className={checkoutPanelClassName}>
      <header className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          {t('stepLabel', { step: 2 })}
        </p>
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
          <Truck className="h-5 w-5 text-primary" />
          {t('shippingTitle')}
        </h2>
      </header>

      {showGoogleNameFields ? (
        <div className={cn(checkoutInsetPanelClassName, 'mb-6 space-y-4 border-primary/25 bg-primary/5 p-4')}>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t('completeNameTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {t(marketRegion === 'sk' ? 'completeNameHintLatin' : 'completeNameHint')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="google-checkout-firstName">{tc('firstName')}</RequiredLabel>
                <InputWithClear
                  id="google-checkout-firstName"
                  autoComplete="given-name"
                  placeholder={
                    marketRegion === 'sk' ? tc('firstName') : t('firstNameUaPlaceholder')
                  }
                  className={cn(
                    checkoutInputClassName,
                    showContactError('firstName') && 'border-destructive/80 ring-destructive/30',
                  )}
                  aria-invalid={showContactError('firstName')}
                  value={formData.firstName}
                  onBlur={() => onBlurContactField('firstName')}
                  onChange={(e) =>
                    onPatchForm({ firstName: sanitizeName(e.target.value) })
                  }
                  onClear={() => onPatchForm({ firstName: '' })}
                />
                <FieldHint
                  id="google-checkout-firstName-error"
                  show={Boolean(contactTouched.firstName)}
                  message={getCheckoutContactFieldError(
                    'firstName',
                    formData,
                    contactErrorOptions,
                  )}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="google-checkout-lastName">{tc('lastName')}</RequiredLabel>
                <InputWithClear
                  id="google-checkout-lastName"
                  autoComplete="family-name"
                  placeholder={
                    marketRegion === 'sk' ? tc('lastName') : t('lastNameUaPlaceholder')
                  }
                  className={cn(
                    checkoutInputClassName,
                    showContactError('lastName') && 'border-destructive/80 ring-destructive/30',
                  )}
                  aria-invalid={showContactError('lastName')}
                  value={formData.lastName}
                  onBlur={() => onBlurContactField('lastName')}
                  onChange={(e) =>
                    onPatchForm({ lastName: sanitizeName(e.target.value) })
                  }
                  onClear={() => onPatchForm({ lastName: '' })}
                />
                <FieldHint
                  id="google-checkout-lastName-error"
                  show={Boolean(contactTouched.lastName)}
                  message={getCheckoutContactFieldError(
                    'lastName',
                    formData,
                    contactErrorOptions,
                  )}
                />
              </div>
            </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {shipmentSplitSection ? <div className="space-y-4">{shipmentSplitSection}</div> : null}

        {!shipmentSplitActive ? (
          <CheckoutDeliveryFields
            idPrefix="shipping"
            orderer={formData}
            shipment={extractShipmentSlice(formData)}
            identification={identification}
            enabledDeliveryMethods={enabledDeliveryMethods}
            marketRegion={marketRegion}
            deliveryPhonePolicy={deliveryPhonePolicy}
            enabledCountrySites={enabledCountrySites}
            enabledDeliveryCountries={enabledDeliveryCountries}
            shippingTouched={shippingTouched}
            recipientTouched={recipientTouched}
            onPatchShipment={onPatchForm}
            onBlurField={onBlurField}
            onBlurRecipientField={onBlurRecipientField}
            deliveryPhoneInputRef={deliveryPhoneInputRef}
            moveDeliveryPhoneCursorToEnd={moveDeliveryPhoneCursorToEnd}
            beforeRecipientSlot={beforeRecipientSlot}
            packetaCartFit={packetaCartFit}
          />
        ) : null}
      </div>

      {showStepNav ? (
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBack}>
            {tc('back')}
          </Button>
          <Button
            type="button"
            className={cn(
              'w-full gap-0 sm:w-auto',
              !canProceed && 'translate-y-px opacity-45 shadow-inner saturate-50'
            )}
            onClick={onContinue}
            disabled={!canProceed}
          >
            {t('nextPayment')}
            <ChevronRight className="ml-3 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
})
