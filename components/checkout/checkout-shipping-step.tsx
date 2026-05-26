'use client'

import { memo } from 'react'
import { ChevronRight, MapPin, Truck } from 'lucide-react'

import { PICKUP_ADDRESS } from '@/components/checkout/checkout-utils'
import {
  authInputClassName,
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import {
  getCheckoutShippingFieldError,
  type CheckoutFormValues,
  type CheckoutShippingFieldKey,
} from '@/lib/validation/checkout-form'

const inputWithIconClass = cn(authInputClassName, 'pl-10')

export const CheckoutShippingStep = memo(function CheckoutShippingStep({
  formData,
  shippingTouched,
  canProceed,
  onBlurField,
  onPatchForm,
  onBack,
  onContinue,
}: {
  formData: CheckoutFormValues
  shippingTouched: Partial<Record<CheckoutShippingFieldKey, boolean>>
  canProceed: boolean
  onBlurField: (field: CheckoutShippingFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onBack: () => void
  onContinue: () => void
}) {
  const showError = (field: CheckoutShippingFieldKey) =>
    Boolean(shippingTouched[field] && getCheckoutShippingFieldError(field, formData))

  return (
    <div className="w-full min-w-0 rounded-xl border bg-background p-4 sm:p-6">
      <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
        <Truck className="h-5 w-5 text-primary" />
        Доставка
      </h2>

      <div className="space-y-6">
        <div>
          <Label className="mb-4 block text-base font-medium">Спосіб доставки</Label>
          <RadioGroup
            value={formData.deliveryMethod}
            onValueChange={(value) => onPatchForm({ deliveryMethod: value })}
            className="space-y-3"
          >
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.deliveryMethod === 'nova-poshta'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="nova-poshta" id="nova-poshta" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Нова Пошта</p>
                <p className="text-sm text-muted-foreground">Термін відвантаження очікуйте в SMS</p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 transition-colors ${
                formData.deliveryMethod === 'pickup'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="pickup" id="pickup" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Самовивіз</p>
                <p className="text-sm text-muted-foreground">{PICKUP_ADDRESS}</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {formData.deliveryMethod !== 'pickup' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="city">Місто</RequiredLabel>
              <div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="city"
                    placeholder="Київ"
                    className={cn(
                      inputWithIconClass,
                      showError('city') && 'border-destructive/80 ring-destructive/30'
                    )}
                    aria-invalid={showError('city')}
                    value={formData.city}
                    onBlur={() => onBlurField('city')}
                    onChange={(e) => onPatchForm({ city: e.target.value })}
                  />
                </div>
                <FieldHint
                  id="city-error"
                  show={Boolean(shippingTouched.city)}
                  message={getCheckoutShippingFieldError('city', formData)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="postOffice">Відділення Нової Пошти</RequiredLabel>
              <div>
                <Input
                  id="postOffice"
                  placeholder="№1, вул. Хрещатик"
                  className={cn(
                    authInputClassName,
                    showError('postOffice') && 'border-destructive/80 ring-destructive/30'
                  )}
                  aria-invalid={showError('postOffice')}
                  value={formData.postOffice}
                  onBlur={() => onBlurField('postOffice')}
                  onChange={(e) => onPatchForm({ postOffice: e.target.value })}
                />
                <FieldHint
                  id="postOffice-error"
                  show={Boolean(shippingTouched.postOffice)}
                  message={getCheckoutShippingFieldError('postOffice', formData)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onBack}>
          Назад
        </Button>
        <Button
          type="button"
          className={cn(
            'w-full sm:w-auto',
            formData.deliveryMethod !== 'pickup' &&
              !canProceed &&
              'translate-y-px opacity-45 shadow-inner saturate-50'
          )}
          onClick={onContinue}
          disabled={formData.deliveryMethod !== 'pickup' && !canProceed}
        >
          Далі: Оплата
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
