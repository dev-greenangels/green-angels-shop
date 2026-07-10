'use client'

import { memo, useMemo, type RefObject } from 'react'
import { Clock, MapPin, Phone, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FieldHint, RequiredLabel } from '@/components/auth/auth-form-ui'
import {
  checkoutInputClassName,
  getCheckoutDeliveryRecipientSummary,
  getCheckoutOrdererSummary,
} from '@/components/checkout/checkout-utils'
import { NovaPoshtaLogo, PickupStoreIcon } from '@/components/checkout/delivery-icons'
import { NpAsyncSearchCombobox } from '@/components/checkout/np-async-search-combobox'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import {
  formatStoreAddress,
  formatStoreHoursInline,
  getStoreMapsUrl,
} from '@/lib/settings/store-helpers'
import { Checkbox } from '@/components/ui/checkbox'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import type { CheckoutShipmentSlice } from '@/lib/checkout/shipment-slice'
import { applyShipmentSliceToForm } from '@/lib/checkout/shipment-slice'
import {
  searchNpSettlements,
  searchNpStreets,
  searchNpWarehouses,
} from '@/lib/nova-poshta/api'
import { cn } from '@/lib/utils'
import {
  formatPhoneDisplay,
  getCheckoutRecipientFieldError,
  getCheckoutShippingFieldError,
  showOrdererDeliveryPhoneField,
  sanitizeCyrillicName,
  sanitizeRecipientPhoneInput,
  type CheckoutDeliveryMethod,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutRecipientFieldKey,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'

const phoneLeadingIcon = <Phone className="h-4 w-4" />

const DELIVERY_OPTIONS: {
  value: CheckoutDeliveryMethod
  icon: 'nova-poshta' | 'pickup'
}[] = [
  { value: 'nova-poshta-branch', icon: 'nova-poshta' },
  { value: 'nova-poshta-address', icon: 'nova-poshta' },
  { value: 'pickup', icon: 'pickup' },
]

export const CheckoutDeliveryFields = memo(function CheckoutDeliveryFields({
  idPrefix,
  orderer,
  shipment,
  identification,
  enabledDeliveryMethods,
  shippingTouched,
  recipientTouched,
  onPatchShipment,
  onBlurField,
  onBlurRecipientField,
  deliveryPhoneInputRef,
  moveDeliveryPhoneCursorToEnd,
  prefilledHint,
}: {
  idPrefix: string
  orderer: CheckoutFormValues
  shipment: CheckoutShipmentSlice
  identification: CheckoutIdentificationState
  enabledDeliveryMethods?: CheckoutDeliveryMethodSlug[]
  shippingTouched: Partial<Record<CheckoutShippingFieldKey, boolean>>
  recipientTouched: Partial<Record<CheckoutRecipientFieldKey, boolean>>
  onPatchShipment: (patch: Partial<CheckoutShipmentSlice>) => void
  onBlurField: (field: CheckoutShippingFieldKey) => void
  onBlurRecipientField: (field: CheckoutRecipientFieldKey) => void
  deliveryPhoneInputRef?: RefObject<HTMLInputElement | null>
  moveDeliveryPhoneCursorToEnd?: () => void
  prefilledHint?: string
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const store = useStoreSettings()

  const mergedForm = useMemo(
    () => applyShipmentSliceToForm(orderer, shipment),
    [orderer, shipment],
  )

  const visibleDeliveryOptions = useMemo(
    () =>
      DELIVERY_OPTIONS.filter((opt) =>
        enabledDeliveryMethods?.length
          ? enabledDeliveryMethods.includes(opt.value)
          : true,
      ),
    [enabledDeliveryMethods],
  )

  const pickupAddress = formatStoreAddress(store)
  const pickupMapsUrl = getStoreMapsUrl(store)
  const pickupHours = formatStoreHoursInline(store)

  const showOrdererDeliveryPhone = showOrdererDeliveryPhoneField(mergedForm, identification)
  const showOrdererPatronymicOnAddress =
    shipment.deliveryMethod === 'nova-poshta-address' && !shipment.isOtherRecipient
  const recipientPatronymicRequiredOnAddress =
    shipment.isOtherRecipient && shipment.deliveryMethod === 'nova-poshta-address'

  const showShippingError = (field: CheckoutShippingFieldKey) =>
    Boolean(
      shippingTouched[field] &&
        getCheckoutShippingFieldError(field, mergedForm, identification),
    )

  const showRecipientError = (field: CheckoutRecipientFieldKey) =>
    Boolean(
      recipientTouched[field] && getCheckoutRecipientFieldError(field, mergedForm),
    )

  const ordererSummary = getCheckoutOrdererSummary(orderer)
  const deliveryRecipientSummary = getCheckoutDeliveryRecipientSummary(mergedForm)

  const handleCityChange = (option: { id: string; label: string }) => {
    onPatchShipment({
      city: option.id,
      cityLabel: option.label,
      postOffice: '',
      postOfficeLabel: '',
      street: '',
      streetLabel: '',
    })
  }

  return (
    <div className="space-y-4">
      {prefilledHint ? (
        <p className="text-xs text-muted-foreground">{prefilledHint}</p>
      ) : null}

      <div>
        <Label className="mb-3 block text-sm font-medium">{t('deliveryMethod')}</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {visibleDeliveryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPatchShipment({ deliveryMethod: opt.value })}
              className={cn(
                'flex w-full flex-row items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-[background-color,box-shadow,ring]',
                shipment.deliveryMethod === opt.value
                  ? 'bg-primary/10 text-primary ring-2 ring-primary/25'
                  : 'bg-muted/40 text-foreground hover:bg-muted/60',
              )}
            >
              {opt.icon === 'nova-poshta' ? <NovaPoshtaLogo /> : <PickupStoreIcon />}
              <span className="text-left leading-tight">{t(`deliveryMethods.${opt.value}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {shipment.deliveryMethod === 'pickup' && (
        <div className="space-y-2 rounded-xl bg-muted/30 p-4 text-sm">
          <a
            href={pickupMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 font-medium text-foreground transition-colors hover:text-primary hover:underline underline-offset-4"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {pickupAddress}
          </a>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            {pickupHours}
          </p>
        </div>
      )}

      {shipment.deliveryMethod === 'nova-poshta-branch' && (
        <div className="space-y-4">
          <NpAsyncSearchCombobox
            id={`${idPrefix}-city`}
            label={tc('city')}
            placeholder={t('cityPlaceholder')}
            value={shipment.city}
            valueLabel={shipment.cityLabel}
            loadOptions={(q) => searchNpSettlements(q, { warehouseOnly: true })}
            onValueChange={(option) => {
              handleCityChange(option)
              onBlurField('city')
            }}
            error={getCheckoutShippingFieldError('city', mergedForm)}
            touched={Boolean(shippingTouched.city)}
          />
          <NpAsyncSearchCombobox
            id={`${idPrefix}-postOffice`}
            label={t('npBranchLabel')}
            placeholder={shipment.city ? t('npBranchPlaceholder') : t('selectCityFirst')}
            value={shipment.postOffice}
            valueLabel={shipment.postOfficeLabel}
            disabled={!shipment.city}
            minChars={shipment.city ? 0 : 2}
            loadOptions={(q) => searchNpWarehouses(shipment.city, q)}
            onValueChange={(option) => {
              onPatchShipment({ postOffice: option.id, postOfficeLabel: option.label })
              onBlurField('postOffice')
            }}
            error={getCheckoutShippingFieldError('postOffice', mergedForm)}
            touched={Boolean(shippingTouched.postOffice)}
          />
        </div>
      )}

      {shipment.deliveryMethod === 'nova-poshta-address' && (
        <div className="space-y-4">
          <NpAsyncSearchCombobox
            id={`${idPrefix}-city-address`}
            label={tc('city')}
            placeholder={t('cityPlaceholder')}
            value={shipment.city}
            valueLabel={shipment.cityLabel}
            loadOptions={searchNpSettlements}
            onValueChange={(option) => {
              handleCityChange(option)
              onBlurField('city')
            }}
            error={getCheckoutShippingFieldError('city', mergedForm)}
            touched={Boolean(shippingTouched.city)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NpAsyncSearchCombobox
              id={`${idPrefix}-street`}
              label={tc('street')}
              placeholder={shipment.city ? t('streetPlaceholder') : t('selectCityFirst')}
              value={shipment.street}
              valueLabel={shipment.streetLabel}
              disabled={!shipment.city}
              loadOptions={(q) => searchNpStreets(shipment.city, q)}
              onValueChange={(option) => {
                onPatchShipment({ street: option.id, streetLabel: option.label })
                onBlurField('street')
              }}
              error={getCheckoutShippingFieldError('street', mergedForm)}
              touched={Boolean(shippingTouched.street)}
            />
            <div className="space-y-2">
              <RequiredLabel htmlFor={`${idPrefix}-houseNumber`}>{tc('houseNumber')}</RequiredLabel>
              <InputWithClear
                id={`${idPrefix}-houseNumber`}
                placeholder="1"
                className={cn(
                  checkoutInputClassName,
                  showShippingError('houseNumber') && 'border-destructive/80 ring-destructive/30',
                )}
                aria-invalid={showShippingError('houseNumber')}
                value={shipment.houseNumber}
                onBlur={() => onBlurField('houseNumber')}
                onChange={(e) => onPatchShipment({ houseNumber: e.target.value })}
                onClear={() => onPatchShipment({ houseNumber: '' })}
              />
              <FieldHint
                id={`${idPrefix}-houseNumber-error`}
                show={Boolean(shippingTouched.houseNumber)}
                message={getCheckoutShippingFieldError('houseNumber', mergedForm)}
              />
            </div>
          </div>
          {showOrdererPatronymicOnAddress && (
            <div className="space-y-2">
              <RequiredLabel htmlFor={`${idPrefix}-patronymic`}>{tc('patronymic')}</RequiredLabel>
              <InputWithClear
                id={`${idPrefix}-patronymic`}
                placeholder={t('patronymicRequiredPlaceholder')}
                className={cn(
                  checkoutInputClassName,
                  showShippingError('patronymic') && 'border-destructive/80 ring-destructive/30',
                )}
                aria-invalid={showShippingError('patronymic')}
                value={shipment.patronymic}
                onBlur={() => onBlurField('patronymic')}
                onChange={(e) =>
                  onPatchShipment({ patronymic: sanitizeCyrillicName(e.target.value) })
                }
                onClear={() => onPatchShipment({ patronymic: '' })}
              />
              <FieldHint
                id={`${idPrefix}-patronymic-error`}
                show={Boolean(shippingTouched.patronymic)}
                message={getCheckoutShippingFieldError('patronymic', mergedForm)}
              />
            </div>
          )}
        </div>
      )}

      {showOrdererDeliveryPhone && (
        <div className="space-y-2 rounded-xl bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">{t('deliveryPhoneHint')}</p>
          <RequiredLabel htmlFor={`${idPrefix}-deliveryPhone`}>{tc('phoneUa')}</RequiredLabel>
          <InputWithClear
            ref={deliveryPhoneInputRef}
            id={`${idPrefix}-deliveryPhone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+380 00 000 0000"
            leadingIcon={phoneLeadingIcon}
            className={cn(
              checkoutInputClassName,
              showShippingError('deliveryPhone') && 'border-destructive/80 ring-destructive/30',
            )}
            aria-invalid={showShippingError('deliveryPhone')}
            value={formatPhoneDisplay(shipment.deliveryPhone)}
            onFocus={moveDeliveryPhoneCursorToEnd}
            onClick={moveDeliveryPhoneCursorToEnd}
            onBlur={() => onBlurField('deliveryPhone')}
            onChange={(e) =>
              onPatchShipment({ deliveryPhone: sanitizeRecipientPhoneInput(e.target.value) })
            }
            onClear={() => onPatchShipment({ deliveryPhone: '' })}
          />
          <FieldHint
            id={`${idPrefix}-deliveryPhone-error`}
            show={Boolean(shippingTouched.deliveryPhone)}
            message={getCheckoutShippingFieldError('deliveryPhone', mergedForm, identification)}
          />
        </div>
      )}

      <div className="space-y-4">
        {ordererSummary.name && (
          <div className="space-y-3 rounded-xl bg-muted/25 p-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('orderer')}
              </p>
              <p className="mt-1.5 font-medium text-foreground">{ordererSummary.name}</p>
              {ordererSummary.phone ? (
                <p className="mt-0.5 text-muted-foreground">{ordererSummary.phone}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('recipient')}
              </p>
              {shipment.isOtherRecipient &&
              !deliveryRecipientSummary.name &&
              !deliveryRecipientSummary.phone ? (
                <p className="mt-1.5 text-muted-foreground">{t('fillBelow')}</p>
              ) : deliveryRecipientSummary.name || deliveryRecipientSummary.phone ? (
                <>
                  {deliveryRecipientSummary.name ? (
                    <p className="mt-1.5 font-medium text-foreground">
                      {deliveryRecipientSummary.name}
                    </p>
                  ) : null}
                  {deliveryRecipientSummary.phone ? (
                    <p
                      className={cn(
                        'text-muted-foreground',
                        deliveryRecipientSummary.name ? 'mt-0.5' : 'mt-1.5',
                      )}
                    >
                      {deliveryRecipientSummary.phone}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-1.5 font-medium text-foreground">{ordererSummary.name}</p>
                  {ordererSummary.phone ? (
                    <p className="mt-0.5 text-muted-foreground">{ordererSummary.phone}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Checkbox
            id={`${idPrefix}-other-recipient`}
            checked={shipment.isOtherRecipient}
            onCheckedChange={(checked) => {
              const isOther = checked === true
              onPatchShipment({
                isOtherRecipient: isOther,
                ...(isOther
                  ? {
                      deliveryPhone: '',
                      ...(shipment.deliveryMethod === 'nova-poshta-address'
                        ? { patronymic: '', recipientPatronymic: '' }
                        : {}),
                    }
                  : {}),
              })
            }}
          />
          <Label htmlFor={`${idPrefix}-other-recipient`} className="cursor-pointer font-normal">
            {t('otherRecipient')}
          </Label>
        </div>

        {shipment.isOtherRecipient && (
          <div className="space-y-4 rounded-xl bg-muted/30 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              {t('recipientDetails')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor={`${idPrefix}-recipientFirstName`}>
                  {tc('firstName')}
                </RequiredLabel>
                <InputWithClear
                  id={`${idPrefix}-recipientFirstName`}
                  className={cn(
                    checkoutInputClassName,
                    showRecipientError('recipientFirstName') &&
                      'border-destructive/80 ring-destructive/30',
                  )}
                  value={shipment.recipientFirstName}
                  onBlur={() => onBlurRecipientField('recipientFirstName')}
                  onChange={(e) =>
                    onPatchShipment({
                      recipientFirstName: sanitizeCyrillicName(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientFirstName: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientFirstName-error`}
                  show={Boolean(recipientTouched.recipientFirstName)}
                  message={getCheckoutRecipientFieldError('recipientFirstName', mergedForm)}
                />
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor={`${idPrefix}-recipientLastName`}>
                  {tc('lastName')}
                </RequiredLabel>
                <InputWithClear
                  id={`${idPrefix}-recipientLastName`}
                  className={cn(
                    checkoutInputClassName,
                    showRecipientError('recipientLastName') &&
                      'border-destructive/80 ring-destructive/30',
                  )}
                  value={shipment.recipientLastName}
                  onBlur={() => onBlurRecipientField('recipientLastName')}
                  onChange={(e) =>
                    onPatchShipment({
                      recipientLastName: sanitizeCyrillicName(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientLastName: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientLastName-error`}
                  show={Boolean(recipientTouched.recipientLastName)}
                  message={getCheckoutRecipientFieldError('recipientLastName', mergedForm)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                {recipientPatronymicRequiredOnAddress ? (
                  <RequiredLabel htmlFor={`${idPrefix}-recipientPatronymic`}>
                    {tc('patronymic')}
                  </RequiredLabel>
                ) : (
                  <Label htmlFor={`${idPrefix}-recipientPatronymic`}>{tc('patronymic')}</Label>
                )}
                <InputWithClear
                  id={`${idPrefix}-recipientPatronymic`}
                  className={cn(
                    checkoutInputClassName,
                    showRecipientError('recipientPatronymic') &&
                      'border-destructive/80 ring-destructive/30',
                  )}
                  value={shipment.recipientPatronymic}
                  onBlur={() => onBlurRecipientField('recipientPatronymic')}
                  onChange={(e) =>
                    onPatchShipment({
                      recipientPatronymic: sanitizeCyrillicName(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientPatronymic: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientPatronymic-error`}
                  show={Boolean(recipientTouched.recipientPatronymic)}
                  message={getCheckoutRecipientFieldError('recipientPatronymic', mergedForm)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <RequiredLabel htmlFor={`${idPrefix}-recipientPhone`}>{tc('phoneUa')}</RequiredLabel>
                <InputWithClear
                  id={`${idPrefix}-recipientPhone`}
                  type="tel"
                  inputMode="tel"
                  placeholder="+380 00 000 0000"
                  leadingIcon={phoneLeadingIcon}
                  className={cn(
                    checkoutInputClassName,
                    showRecipientError('recipientPhone') &&
                      'border-destructive/80 ring-destructive/30',
                  )}
                  value={formatPhoneDisplay(shipment.recipientPhone)}
                  onBlur={() => onBlurRecipientField('recipientPhone')}
                  onChange={(e) =>
                    onPatchShipment({
                      recipientPhone: sanitizeRecipientPhoneInput(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientPhone: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientPhone-error`}
                  show={Boolean(recipientTouched.recipientPhone)}
                  message={getCheckoutRecipientFieldError('recipientPhone', mergedForm)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
