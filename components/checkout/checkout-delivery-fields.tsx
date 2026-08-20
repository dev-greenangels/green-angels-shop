'use client'

import { memo, useMemo, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Clock, MapPin, Phone, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { FieldHint, RequiredLabel } from '@/components/auth/auth-form-ui'
import {
  checkoutInputClassName,
  getCheckoutDeliveryRecipientSummary,
  getCheckoutOrdererSummary,
} from '@/components/checkout/checkout-utils'
import {
  CarrierTruckIcon,
  GlsLogo,
  NovaPoshtaLogo,
  PacketaLogo,
  PickupStoreIcon,
} from '@/components/checkout/delivery-icons'
import { NpAsyncSearchCombobox } from '@/components/checkout/np-async-search-combobox'
import {
  PacketaPickupPointField,
  type PacketaCartFit,
} from '@/components/checkout/packeta-pickup-point-field'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import {
  formatStoreAddress,
  formatStoreHoursInline,
  getStoreMapsUrl,
} from '@/lib/settings/store-helpers'
import { Checkbox } from '@/components/ui/checkbox'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  sanitizeLatinName,
  sanitizeRecipientPhoneInput,
  type CheckoutDeliveryMethod,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutMarketRegion,
  type CheckoutRecipientFieldKey,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'
import {
  defaultDeliveryPhonePolicy,
  phonePlaceholderForPolicy,
  type PhonePolicy,
} from '@/lib/settings/market'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'

const phoneLeadingIcon = <Phone className="h-4 w-4" />

type DeliveryCountryCode = string

const DELIVERY_OPTIONS: {
  value: CheckoutDeliveryMethod
  icon: 'nova-poshta' | 'pickup' | 'packeta' | 'gls' | 'carrier'
}[] = [
  { value: 'nova-poshta-branch', icon: 'nova-poshta' },
  { value: 'nova-poshta-address', icon: 'nova-poshta' },
  { value: 'pickup', icon: 'pickup' },
  { value: 'packeta-box', icon: 'packeta' },
  { value: 'packeta-courier', icon: 'packeta' },
  { value: 'gls-courier', icon: 'gls' },
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
  marketRegion = 'ua',
  deliveryPhonePolicy: deliveryPhonePolicyProp,
  enabledCountrySites,
  enabledDeliveryCountries,
  beforeRecipientSlot,
  packetaCartFit,
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
  marketRegion?: CheckoutMarketRegion
  deliveryPhonePolicy?: PhonePolicy
  packetaCartFit?: PacketaCartFit
  /** @deprecated Prefer enabledDeliveryCountries from market domain allowlist */
  enabledCountrySites?: Array<{ code: DeliveryCountryCode; enabled: boolean }>
  enabledDeliveryCountries?: DeliveryCountryCode[]
  /** e.g. preferred ship date — rendered above «other recipient» */
  beforeRecipientSlot?: ReactNode
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const store = useStoreSettings()
  const isPickup = shipment.deliveryMethod === 'pickup'
  const deliveryPhonePolicy =
    deliveryPhonePolicyProp ?? defaultDeliveryPhonePolicy(marketRegion)
  const fieldOptions = { marketRegion, deliveryPhonePolicy }
  const isSk = marketRegion === 'sk'
  const sanitizePersonName = isSk ? sanitizeLatinName : sanitizeCyrillicName

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

  const countryOptions = useMemo(() => {
    if (enabledDeliveryCountries?.length) {
      return enabledDeliveryCountries.map((c) => c.toLowerCase())
    }
    if (enabledCountrySites?.length) {
      return enabledCountrySites.filter((site) => site.enabled).map((site) => site.code)
    }
    if (shipment.deliveryCountryCode) {
      return [shipment.deliveryCountryCode.toLowerCase()]
    }
    return ['sk', 'hu', 'at', 'cz', 'de']
  }, [enabledDeliveryCountries, enabledCountrySites, shipment.deliveryCountryCode])

  const pickupAddress = formatStoreAddress(store)
  const pickupMapsUrl = getStoreMapsUrl(store)
  const pickupHours = formatStoreHoursInline(store)

  const showOrdererDeliveryPhone = showOrdererDeliveryPhoneField(
    mergedForm,
    identification,
    marketRegion,
    deliveryPhonePolicy,
  )
  const showOrdererPatronymicOnAddress =
    !isSk &&
    shipment.deliveryMethod === 'nova-poshta-address' &&
    !shipment.isOtherRecipient
  const recipientPatronymicRequiredOnAddress =
    !isSk &&
    shipment.isOtherRecipient &&
    shipment.deliveryMethod === 'nova-poshta-address'
  const showRecipientPatronymic = !isSk

  const showShippingError = (field: CheckoutShippingFieldKey) =>
    Boolean(
      shippingTouched[field] &&
        getCheckoutShippingFieldError(field, mergedForm, identification, fieldOptions),
    )

  const showRecipientError = (field: CheckoutRecipientFieldKey) =>
    Boolean(
      recipientTouched[field] &&
        getCheckoutRecipientFieldError(field, mergedForm, fieldOptions),
    )

  const ordererSummary = getCheckoutOrdererSummary(orderer, marketRegion, deliveryPhonePolicy)
  const deliveryRecipientSummary = getCheckoutDeliveryRecipientSummary(
    mergedForm,
    marketRegion,
    deliveryPhonePolicy,
  )

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
              onClick={() => {
                const nextMethod = opt.value
                if (nextMethod === 'pickup') {
                  onPatchShipment({
                    deliveryMethod: nextMethod,
                    // Pickup is always from SK warehouse → SK VAT, no country picker.
                    deliveryCountryCode: isSk ? 'sk' : shipment.deliveryCountryCode,
                    postOffice: '',
                    postOfficeLabel: '',
                  })
                  return
                }
                onPatchShipment({
                  deliveryMethod: nextMethod,
                  ...(shipment.deliveryMethod === 'pickup' && isSk
                    ? {
                        // Leaving pickup: clear forced SK so user chooses ship-to again.
                        deliveryCountryCode:
                          shipment.deliveryCountryCode === 'sk'
                            ? ''
                            : shipment.deliveryCountryCode,
                      }
                    : {}),
                })
              }}
              className={cn(
                'flex w-full flex-row items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-[background-color,box-shadow,ring]',
                shipment.deliveryMethod === opt.value
                  ? 'bg-primary/10 text-primary ring-2 ring-primary/25'
                  : 'bg-muted/40 text-foreground hover:bg-muted/60',
              )}
            >
              {opt.icon === 'nova-poshta' ? (
                <NovaPoshtaLogo />
              ) : opt.icon === 'packeta' ? (
                <PacketaLogo />
              ) : opt.icon === 'gls' ? (
                <GlsLogo />
              ) : opt.icon === 'carrier' ? (
                <CarrierTruckIcon />
              ) : (
                <PickupStoreIcon />
              )}
              <span className="text-left leading-tight">{t(`deliveryMethods.${opt.value}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {isSk && shipment.deliveryMethod !== 'pickup' ? (
        <div className="space-y-1.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <RequiredLabel htmlFor={`${idPrefix}-delivery-country`}>
              {t('deliveryCountry')}
            </RequiredLabel>
            <Select
              value={shipment.deliveryCountryCode || undefined}
              onValueChange={(value) => {
                onPatchShipment({
                  deliveryCountryCode: value as DeliveryCountryCode,
                  // Packeta points are country-specific.
                  postOffice: '',
                  postOfficeLabel: '',
                })
                onBlurField('deliveryCountryCode')
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-delivery-country`}
                className={cn(
                  'w-full sm:w-max sm:min-w-[var(--delivery-country-min-w,12rem)]',
                  showShippingError('deliveryCountryCode') &&
                    'border-destructive/80 ring-destructive/30',
                )}
                style={
                  {
                    ['--delivery-country-min-w' as string]: `${Math.max(
                      12,
                      ...countryOptions.map((code) => t(`deliveryCountries.${code}`).length + 4),
                    )}ch`,
                  } as CSSProperties
                }
                aria-invalid={showShippingError('deliveryCountryCode')}
              >
                <SelectValue placeholder={t('deliveryCountryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((code) => (
                  <SelectItem key={code} value={code}>
                    {t(`deliveryCountries.${code}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FieldHint
            id={`${idPrefix}-delivery-country-error`}
            show={Boolean(shippingTouched.deliveryCountryCode)}
            message={getCheckoutShippingFieldError(
              'deliveryCountryCode',
              mergedForm,
              identification,
              fieldOptions,
            )}
          />
        </div>
      ) : null}

      {shipment.deliveryMethod === 'pickup' && (
        <div className="space-y-2 rounded-xl bg-muted p-4 text-sm">
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

      {shipment.deliveryMethod === 'packeta-box' &&
        (shipment.deliveryCountryCode || !isSk ? (
          <PacketaPickupPointField
            idPrefix={idPrefix}
            country={shipment.deliveryCountryCode || 'sk'}
            value={shipment.postOffice || undefined}
            label={shipment.postOfficeLabel || undefined}
            cartFit={packetaCartFit}
            onChange={(id, nextLabel, meta) =>
              onPatchShipment({
                postOffice: id,
                postOfficeLabel: nextLabel ?? '',
                city: meta?.city || nextLabel?.split(',').pop()?.trim() || shipment.city,
                cityLabel: meta?.city || nextLabel || shipment.cityLabel,
                postalCode: meta?.zip || shipment.postalCode,
              })
            }
          />
        ) : (
          <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            {t('selectCountryBeforePacketa')}
          </p>
        ))}

      {(shipment.deliveryMethod === 'packeta-courier' ||
        shipment.deliveryMethod === 'gls-courier') && (
        <div className="space-y-4">
          <div className={cn('grid gap-4', isSk ? 'sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : '')}>
            {isSk ? (
              <div className="space-y-2">
                <RequiredLabel htmlFor={`${idPrefix}-courier-postal`}>
                  {t('postalCode')}
                </RequiredLabel>
                <InputWithClear
                  id={`${idPrefix}-courier-postal`}
                  autoComplete="postal-code"
                  placeholder="811 01"
                  className={cn(
                    checkoutInputClassName,
                    showShippingError('postalCode') && 'border-destructive/80 ring-destructive/30',
                  )}
                  aria-invalid={showShippingError('postalCode')}
                  value={shipment.postalCode}
                  onBlur={() => onBlurField('postalCode')}
                  onChange={(e) => onPatchShipment({ postalCode: e.target.value })}
                  onClear={() => onPatchShipment({ postalCode: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-courier-postal-error`}
                  show={Boolean(shippingTouched.postalCode)}
                  message={getCheckoutShippingFieldError(
                    'postalCode',
                    mergedForm,
                    identification,
                    fieldOptions,
                  )}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <RequiredLabel htmlFor={`${idPrefix}-courier-city`}>{tc('city')}</RequiredLabel>
              <InputWithClear
                id={`${idPrefix}-courier-city`}
                className={cn(
                  checkoutInputClassName,
                  showShippingError('city') && 'border-destructive/80 ring-destructive/30',
                )}
                aria-invalid={showShippingError('city')}
                value={shipment.cityLabel || shipment.city}
                onBlur={() => onBlurField('city')}
                onChange={(e) =>
                  onPatchShipment({ city: e.target.value, cityLabel: e.target.value })
                }
                onClear={() => onPatchShipment({ city: '', cityLabel: '' })}
              />
              <FieldHint
                id={`${idPrefix}-courier-city-error`}
                show={Boolean(shippingTouched.city)}
                message={getCheckoutShippingFieldError(
                  'city',
                  mergedForm,
                  identification,
                  fieldOptions,
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(5.5rem,7.5rem)]">
            <div className="space-y-2">
              <RequiredLabel htmlFor={`${idPrefix}-courier-street`}>{tc('street')}</RequiredLabel>
              <InputWithClear
                id={`${idPrefix}-courier-street`}
                className={cn(
                  checkoutInputClassName,
                  showShippingError('street') && 'border-destructive/80 ring-destructive/30',
                )}
                aria-invalid={showShippingError('street')}
                value={shipment.streetLabel || shipment.street}
                onBlur={() => onBlurField('street')}
                onChange={(e) =>
                  onPatchShipment({ street: e.target.value, streetLabel: e.target.value })
                }
                onClear={() => onPatchShipment({ street: '', streetLabel: '' })}
              />
              <FieldHint
                id={`${idPrefix}-courier-street-error`}
                show={Boolean(shippingTouched.street)}
                message={getCheckoutShippingFieldError(
                  'street',
                  mergedForm,
                  identification,
                  fieldOptions,
                )}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor={`${idPrefix}-courier-house`}>{tc('houseNumber')}</RequiredLabel>
              <InputWithClear
                id={`${idPrefix}-courier-house`}
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
                id={`${idPrefix}-courier-house-error`}
                show={Boolean(shippingTouched.houseNumber)}
                message={getCheckoutShippingFieldError(
                  'houseNumber',
                  mergedForm,
                  identification,
                  fieldOptions,
                )}
              />
            </div>
          </div>
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
            error={getCheckoutShippingFieldError(
              'city',
              mergedForm,
              identification,
              fieldOptions,
            )}
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
            error={getCheckoutShippingFieldError(
              'postOffice',
              mergedForm,
              identification,
              fieldOptions,
            )}
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
            error={getCheckoutShippingFieldError(
              'city',
              mergedForm,
              identification,
              fieldOptions,
            )}
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
              error={getCheckoutShippingFieldError(
                'street',
                mergedForm,
                identification,
                fieldOptions,
              )}
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
                message={getCheckoutShippingFieldError(
                  'houseNumber',
                  mergedForm,
                  identification,
                  fieldOptions,
                )}
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
                message={getCheckoutShippingFieldError(
                  'patronymic',
                  mergedForm,
                  identification,
                  fieldOptions,
                )}
              />
            </div>
          )}
        </div>
      )}

      {showOrdererDeliveryPhone && (
        <div className="space-y-2 rounded-xl bg-muted p-4">
          {deliveryPhonePolicy === 'ua_e164' ? (
            <p className="text-sm text-muted-foreground">{t('deliveryPhoneHint')}</p>
          ) : null}
          <RequiredLabel htmlFor={`${idPrefix}-deliveryPhone`}>
            {deliveryPhonePolicy === 'ua_e164' ? tc('phoneUa') : tc('phone')}
          </RequiredLabel>
          <InputWithClear
            ref={deliveryPhoneInputRef}
            id={`${idPrefix}-deliveryPhone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={phonePlaceholderForPolicy(deliveryPhonePolicy)}
            leadingIcon={phoneLeadingIcon}
            className={cn(
              checkoutInputClassName,
              showShippingError('deliveryPhone') && 'border-destructive/80 ring-destructive/30',
            )}
            aria-invalid={showShippingError('deliveryPhone')}
            value={
              deliveryPhonePolicy === 'ua_e164'
                ? formatPhoneDisplay(shipment.deliveryPhone)
                : shipment.deliveryPhone
            }
            onFocus={moveDeliveryPhoneCursorToEnd}
            onClick={moveDeliveryPhoneCursorToEnd}
            onBlur={() => onBlurField('deliveryPhone')}
            onChange={(e) =>
              onPatchShipment({
                deliveryPhone:
                  deliveryPhonePolicy === 'ua_e164'
                    ? sanitizeRecipientPhoneInput(e.target.value)
                    : sanitizeCheckoutPhoneInput(e.target.value),
              })
            }
            onClear={() => onPatchShipment({ deliveryPhone: '' })}
          />
          <FieldHint
            id={`${idPrefix}-deliveryPhone-error`}
            show={Boolean(shippingTouched.deliveryPhone)}
            message={getCheckoutShippingFieldError(
              'deliveryPhone',
              mergedForm,
              identification,
              fieldOptions,
            )}
          />
        </div>
      )}

      {beforeRecipientSlot}

      <div className="space-y-4">
        {ordererSummary.name && (
          <div className="space-y-3 rounded-xl bg-muted p-3 text-sm">
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
            {isPickup ? t('otherRecipientPickup') : t('otherRecipient')}
          </Label>
        </div>

        {shipment.isOtherRecipient && (
          <div className="space-y-4 rounded-xl bg-muted p-4">
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
                      recipientFirstName: sanitizePersonName(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientFirstName: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientFirstName-error`}
                  show={Boolean(recipientTouched.recipientFirstName)}
                  message={getCheckoutRecipientFieldError(
                    'recipientFirstName',
                    mergedForm,
                    fieldOptions,
                  )}
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
                      recipientLastName: sanitizePersonName(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientLastName: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientLastName-error`}
                  show={Boolean(recipientTouched.recipientLastName)}
                  message={getCheckoutRecipientFieldError(
                    'recipientLastName',
                    mergedForm,
                    fieldOptions,
                  )}
                />
              </div>
              {showRecipientPatronymic ? (
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
                    message={getCheckoutRecipientFieldError(
                      'recipientPatronymic',
                      mergedForm,
                      fieldOptions,
                    )}
                  />
                </div>
              ) : null}
              {isSk ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`${idPrefix}-recipientCompanyName`}>
                    {t('recipientCompanyName')}
                  </Label>
                  <InputWithClear
                    id={`${idPrefix}-recipientCompanyName`}
                    autoComplete="organization"
                    className={checkoutInputClassName}
                    value={shipment.recipientCompanyName}
                    onBlur={() => onBlurRecipientField('recipientCompanyName')}
                    onChange={(e) =>
                      onPatchShipment({ recipientCompanyName: e.target.value })
                    }
                    onClear={() => onPatchShipment({ recipientCompanyName: '' })}
                  />
                </div>
              ) : null}
              <div className="space-y-2 sm:col-span-2">
                <RequiredLabel htmlFor={`${idPrefix}-recipientPhone`}>
                  {deliveryPhonePolicy === 'ua_e164' ? tc('phoneUa') : tc('phone')}
                </RequiredLabel>
                <InputWithClear
                  id={`${idPrefix}-recipientPhone`}
                  type="tel"
                  inputMode="tel"
                  placeholder={phonePlaceholderForPolicy(deliveryPhonePolicy)}
                  leadingIcon={phoneLeadingIcon}
                  className={cn(
                    checkoutInputClassName,
                    showRecipientError('recipientPhone') &&
                      'border-destructive/80 ring-destructive/30',
                  )}
                  value={
                    deliveryPhonePolicy === 'ua_e164'
                      ? formatPhoneDisplay(shipment.recipientPhone)
                      : shipment.recipientPhone
                  }
                  onBlur={() => onBlurRecipientField('recipientPhone')}
                  onChange={(e) =>
                    onPatchShipment({
                      recipientPhone:
                        deliveryPhonePolicy === 'ua_e164'
                          ? sanitizeRecipientPhoneInput(e.target.value)
                          : sanitizeCheckoutPhoneInput(e.target.value),
                    })
                  }
                  onClear={() => onPatchShipment({ recipientPhone: '' })}
                />
                <FieldHint
                  id={`${idPrefix}-recipientPhone-error`}
                  show={Boolean(recipientTouched.recipientPhone)}
                  message={getCheckoutRecipientFieldError(
                    'recipientPhone',
                    mergedForm,
                    fieldOptions,
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
