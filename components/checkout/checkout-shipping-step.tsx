'use client'

import { memo } from 'react'
import { ChevronRight, Clock, CreditCard, MapPin, Phone, Truck, User } from 'lucide-react'

import {
  authInputClassName,
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import {
  checkoutInsetPanelClassName,
  checkoutPanelClassName,
  getCheckoutPhoneSummary,
  getCheckoutRecipientSummary,
  PICKUP_ADDRESS,
  PICKUP_HOURS,
} from '@/components/checkout/checkout-utils'
import { NpSearchCombobox } from '@/components/checkout/np-search-combobox'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import { NP_CITIES, NP_STREETS, NP_WAREHOUSES } from '@/lib/checkout-np-mock'
import { cn } from '@/lib/utils'
import {
  formatPhoneDisplay,
  getCheckoutRecipientFieldError,
  getCheckoutShippingFieldError,
  isValidUkrPhone,
  sanitizeCyrillicName,
  sanitizePhoneInput,
  type CheckoutDeliveryMethod,
  type CheckoutFormValues,
  type CheckoutRecipientFieldKey,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'

const inputWithIconClass = cn(authInputClassName, 'pl-10')

const DELIVERY_OPTIONS: { value: CheckoutDeliveryMethod; label: string }[] = [
  { value: 'nova-poshta-branch', label: 'На відділення НП' },
  { value: 'nova-poshta-address', label: 'Адресна доставка НП' },
  { value: 'pickup', label: 'Самовивіз' },
]

export const CheckoutShippingStep = memo(function CheckoutShippingStep({
  formData,
  shippingTouched,
  recipientTouched,
  canProceed,
  onBlurField,
  onBlurRecipientField,
  onPatchForm,
  onBack,
  onContinue,
  moveDeliveryPhoneCursorToEnd,
  deliveryPhoneInputRef,
}: {
  formData: CheckoutFormValues
  shippingTouched: Partial<Record<CheckoutShippingFieldKey, boolean>>
  recipientTouched: Partial<Record<CheckoutRecipientFieldKey, boolean>>
  canProceed: boolean
  onBlurField: (field: CheckoutShippingFieldKey) => void
  onBlurRecipientField: (field: CheckoutRecipientFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBack: () => void
  onContinue: () => void
  moveDeliveryPhoneCursorToEnd: () => void
  deliveryPhoneInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const needsUaDeliveryPhone = Boolean(
    formData.phone.trim() && !isValidUkrPhone(formData.phone)
  )
  const needsPatronymicOnShipping =
    formData.deliveryMethod === 'nova-poshta-address' && !formData.patronymic.trim()

  const showShippingError = (field: CheckoutShippingFieldKey) =>
    Boolean(shippingTouched[field] && getCheckoutShippingFieldError(field, formData))

  const showRecipientError = (field: CheckoutRecipientFieldKey) =>
    Boolean(
      recipientTouched[field] && getCheckoutRecipientFieldError(field, formData)
    )

  const recipientName = getCheckoutRecipientSummary(formData)
  const recipientPhone = getCheckoutPhoneSummary(formData)

  const warehouseOptions = formData.city ? (NP_WAREHOUSES[formData.city] ?? []) : []
  const streetOptions = formData.city ? (NP_STREETS[formData.city] ?? []) : []

  const handleCityChange = (cityId: string) => {
    onPatchForm({ city: cityId, postOffice: '', street: '' })
  }

  return (
    <div className={checkoutPanelClassName}>
      <header className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Крок 2</p>
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
          <Truck className="h-5 w-5 text-primary" />
          Доставка
        </h2>
      </header>

      {recipientName && (
        <div className={cn(checkoutInsetPanelClassName, 'mb-5 px-3 py-2.5 text-sm')}>
          <span className="text-muted-foreground">Отримувач: </span>
          <span className="font-medium text-foreground">{recipientName}</span>
          {recipientPhone && (
            <>
              <span className="text-muted-foreground"> · </span>
              <span className="text-foreground">{recipientPhone}</span>
            </>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <Label className="mb-3 block text-sm font-medium">Спосіб доставки</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {DELIVERY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPatchForm({ deliveryMethod: opt.value })}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-colors',
                  formData.deliveryMethod === opt.value
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background text-foreground hover:border-primary/40'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {formData.deliveryMethod === 'pickup' && (
          <div className={cn(checkoutInsetPanelClassName, 'space-y-2 p-4 text-sm')}>
            <p className="flex items-start gap-2 font-medium text-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {PICKUP_ADDRESS}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              {PICKUP_HOURS}
            </p>
          </div>
        )}

        {formData.deliveryMethod === 'nova-poshta-branch' && (
          <div className="space-y-4">
            <NpSearchCombobox
              id="city"
              label="Місто"
              placeholder="Введіть назву міста…"
              value={formData.city}
              options={NP_CITIES}
              onValueChange={(v) => {
                handleCityChange(v)
                onBlurField('city')
              }}
              error={getCheckoutShippingFieldError('city', formData)}
              touched={Boolean(shippingTouched.city)}
            />
            <NpSearchCombobox
              id="postOffice"
              label="Відділення Нової Пошти"
              placeholder={
                formData.city
                  ? 'Номер або адреса відділення…'
                  : 'Спочатку оберіть місто'
              }
              value={formData.postOffice}
              options={warehouseOptions}
              disabled={!formData.city}
              onValueChange={(v) => {
                onPatchForm({ postOffice: v })
                onBlurField('postOffice')
              }}
              error={getCheckoutShippingFieldError('postOffice', formData)}
              touched={Boolean(shippingTouched.postOffice)}
            />
          </div>
        )}

        {formData.deliveryMethod === 'nova-poshta-address' && (
          <div className="space-y-4">
            <NpSearchCombobox
              id="city-address"
              label="Місто"
              placeholder="Введіть назву міста…"
              value={formData.city}
              options={NP_CITIES}
              onValueChange={(v) => {
                handleCityChange(v)
                onBlurField('city')
              }}
              error={getCheckoutShippingFieldError('city', formData)}
              touched={Boolean(shippingTouched.city)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NpSearchCombobox
                id="street"
                label="Вулиця"
                placeholder={
                  formData.city ? 'Введіть назву вулиці…' : 'Спочатку оберіть місто'
                }
                value={formData.street}
                options={streetOptions}
                disabled={!formData.city}
                onValueChange={(v) => {
                  onPatchForm({ street: v })
                  onBlurField('street')
                }}
                error={getCheckoutShippingFieldError('street', formData)}
                touched={Boolean(shippingTouched.street)}
              />
              <div className="space-y-2">
                <RequiredLabel htmlFor="houseNumber">Номер будинку</RequiredLabel>
                <InputWithClear
                  id="houseNumber"
                  placeholder="1"
                  className={cn(
                    authInputClassName,
                    showShippingError('houseNumber') &&
                      'border-destructive/80 ring-destructive/30'
                  )}
                  aria-invalid={showShippingError('houseNumber')}
                  value={formData.houseNumber}
                  onBlur={() => onBlurField('houseNumber')}
                  onChange={(e) => onPatchForm({ houseNumber: e.target.value })}
                  onClear={() => onPatchForm({ houseNumber: '' })}
                />
                <FieldHint
                  id="houseNumber-error"
                  show={Boolean(shippingTouched.houseNumber)}
                  message={getCheckoutShippingFieldError('houseNumber', formData)}
                />
              </div>
            </div>
            {needsPatronymicOnShipping && (
              <div className="space-y-2">
                <RequiredLabel htmlFor="patronymic-shipping">По батькові</RequiredLabel>
                <InputWithClear
                  id="patronymic-shipping"
                  placeholder="обовʼязково для адресної доставки"
                  className={cn(
                    authInputClassName,
                    showShippingError('patronymic') &&
                      'border-destructive/80 ring-destructive/30'
                  )}
                  aria-invalid={showShippingError('patronymic')}
                  value={formData.patronymic}
                  onBlur={() => onBlurField('patronymic')}
                  onChange={(e) =>
                    onPatchForm({ patronymic: sanitizeCyrillicName(e.target.value) })
                  }
                  onClear={() => onPatchForm({ patronymic: '' })}
                />
                <FieldHint
                  id="patronymic-shipping-error"
                  show={Boolean(shippingTouched.patronymic)}
                  message={getCheckoutShippingFieldError('patronymic', formData)}
                />
              </div>
            )}
          </div>
        )}

        {needsUaDeliveryPhone && (
          <div className={cn(checkoutInsetPanelClassName, 'space-y-2 border-dashed p-4')}>
            <p className="text-sm text-muted-foreground">
              Для доставки в Україні вкажіть український номер телефону
            </p>
            <RequiredLabel htmlFor="deliveryPhone">Телефон (UA)</RequiredLabel>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <InputWithClear
                ref={deliveryPhoneInputRef}
                id="deliveryPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+380 00 000 0000"
                className={cn(
                  inputWithIconClass,
                  showShippingError('deliveryPhone') &&
                    'border-destructive/80 ring-destructive/30'
                )}
                aria-invalid={showShippingError('deliveryPhone')}
                value={formatPhoneDisplay(formData.deliveryPhone)}
                onFocus={moveDeliveryPhoneCursorToEnd}
                onClick={moveDeliveryPhoneCursorToEnd}
                onBlur={() => onBlurField('deliveryPhone')}
                onChange={(e) =>
                  onPatchForm({ deliveryPhone: sanitizePhoneInput(e.target.value) })
                }
                onClear={() => onPatchForm({ deliveryPhone: '' })}
              />
            </div>
            <FieldHint
              id="deliveryPhone-error"
              show={Boolean(shippingTouched.deliveryPhone)}
              message={getCheckoutShippingFieldError('deliveryPhone', formData)}
            />
          </div>
        )}

        <div className="space-y-4 border-t border-border/60 pt-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="other-recipient"
              checked={formData.isOtherRecipient}
              onCheckedChange={(checked) =>
                onPatchForm({ isOtherRecipient: checked === true })
              }
            />
            <Label htmlFor="other-recipient" className="cursor-pointer font-normal">
              Інший отримувач?
            </Label>
          </div>

          {formData.isOtherRecipient && (
            <div className={cn(checkoutInsetPanelClassName, 'space-y-4 p-4')}>
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                Дані отримувача
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="recipientFirstName">Ім&apos;я</RequiredLabel>
                  <InputWithClear
                    id="recipientFirstName"
                    className={cn(
                      authInputClassName,
                      showRecipientError('recipientFirstName') &&
                        'border-destructive/80 ring-destructive/30'
                    )}
                    value={formData.recipientFirstName}
                    onBlur={() => onBlurRecipientField('recipientFirstName')}
                    onChange={(e) =>
                      onPatchForm({
                        recipientFirstName: sanitizeCyrillicName(e.target.value),
                      })
                    }
                    onClear={() => onPatchForm({ recipientFirstName: '' })}
                  />
                  <FieldHint
                    id="recipientFirstName-error"
                    show={Boolean(recipientTouched.recipientFirstName)}
                    message={getCheckoutRecipientFieldError(
                      'recipientFirstName',
                      formData
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <RequiredLabel htmlFor="recipientLastName">Прізвище</RequiredLabel>
                  <InputWithClear
                    id="recipientLastName"
                    className={cn(
                      authInputClassName,
                      showRecipientError('recipientLastName') &&
                        'border-destructive/80 ring-destructive/30'
                    )}
                    value={formData.recipientLastName}
                    onBlur={() => onBlurRecipientField('recipientLastName')}
                    onChange={(e) =>
                      onPatchForm({
                        recipientLastName: sanitizeCyrillicName(e.target.value),
                      })
                    }
                    onClear={() => onPatchForm({ recipientLastName: '' })}
                  />
                  <FieldHint
                    id="recipientLastName-error"
                    show={Boolean(recipientTouched.recipientLastName)}
                    message={getCheckoutRecipientFieldError('recipientLastName', formData)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="recipientPatronymic">По батькові</Label>
                  <InputWithClear
                    id="recipientPatronymic"
                    className={cn(
                      authInputClassName,
                      showRecipientError('recipientPatronymic') &&
                        'border-destructive/80 ring-destructive/30'
                    )}
                    value={formData.recipientPatronymic}
                    onBlur={() => onBlurRecipientField('recipientPatronymic')}
                    onChange={(e) =>
                      onPatchForm({
                        recipientPatronymic: sanitizeCyrillicName(e.target.value),
                      })
                    }
                    onClear={() => onPatchForm({ recipientPatronymic: '' })}
                  />
                  <FieldHint
                    id="recipientPatronymic-error"
                    show={Boolean(recipientTouched.recipientPatronymic)}
                    message={getCheckoutRecipientFieldError(
                      'recipientPatronymic',
                      formData
                    )}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <RequiredLabel htmlFor="recipientPhone">Телефон (UA)</RequiredLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <InputWithClear
                      id="recipientPhone"
                      type="tel"
                      inputMode="tel"
                      placeholder="+380 00 000 0000"
                      className={cn(
                        inputWithIconClass,
                        showRecipientError('recipientPhone') &&
                          'border-destructive/80 ring-destructive/30'
                      )}
                      value={formatPhoneDisplay(formData.recipientPhone)}
                      onBlur={() => onBlurRecipientField('recipientPhone')}
                      onChange={(e) =>
                        onPatchForm({
                          recipientPhone: sanitizePhoneInput(e.target.value),
                        })
                      }
                      onClear={() => onPatchForm({ recipientPhone: '' })}
                    />
                  </div>
                  <FieldHint
                    id="recipientPhone-error"
                    show={Boolean(recipientTouched.recipientPhone)}
                    message={getCheckoutRecipientFieldError('recipientPhone', formData)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBack}>
          Назад
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
          Далі:
          <CreditCard className="ml-3 mr-1 h-4 w-4" />
          Оплата
          <ChevronRight className="ml-3 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
