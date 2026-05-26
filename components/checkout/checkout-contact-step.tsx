'use client'

import { memo, type RefObject } from 'react'
import { ChevronRight, Mail, Phone, User } from 'lucide-react'

import {
  authInputClassName,
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  formatPhoneDisplay,
  getCheckoutContactFieldError,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizePhoneInput,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
} from '@/lib/validation/checkout-form'

const inputWithIconClass = cn(authInputClassName, 'pl-10')

export const CheckoutContactStep = memo(function CheckoutContactStep({
  formData,
  contactTouched,
  canProceed,
  phoneInputRef,
  onBlurField,
  onPatchForm,
  onContinue,
  movePhoneCursorToEnd,
}: {
  formData: CheckoutFormValues
  contactTouched: Partial<Record<CheckoutContactFieldKey, boolean>>
  canProceed: boolean
  phoneInputRef: RefObject<HTMLInputElement | null>
  onBlurField: (field: CheckoutContactFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onContinue: () => void
  movePhoneCursorToEnd: () => void
}) {
  const showError = (field: CheckoutContactFieldKey) =>
    Boolean(contactTouched[field] && getCheckoutContactFieldError(field, formData))

  return (
    <div className="w-full min-w-0 rounded-xl border bg-background p-4 sm:p-6">
      <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
        <User className="h-5 w-5 text-primary" />
        Контактні дані
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="firstName">Ім&apos;я</RequiredLabel>
          <div>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="ваше ім'я.."
              className={cn(
                authInputClassName,
                showError('firstName') && 'border-destructive/80 ring-destructive/30'
              )}
              aria-invalid={showError('firstName')}
              value={formData.firstName}
              onBlur={() => onBlurField('firstName')}
              onChange={(e) =>
                onPatchForm({ firstName: sanitizeCyrillicName(e.target.value) })
              }
            />
            <FieldHint
              id="firstName-error"
              show={Boolean(contactTouched.firstName)}
              message={getCheckoutContactFieldError('firstName', formData)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="lastName">Прізвище</RequiredLabel>
          <div>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="ваше прізвище.."
              className={cn(
                authInputClassName,
                showError('lastName') && 'border-destructive/80 ring-destructive/30'
              )}
              aria-invalid={showError('lastName')}
              value={formData.lastName}
              onBlur={() => onBlurField('lastName')}
              onChange={(e) =>
                onPatchForm({ lastName: sanitizeCyrillicName(e.target.value) })
              }
            />
            <FieldHint
              id="lastName-error"
              show={Boolean(contactTouched.lastName)}
              message={getCheckoutContactFieldError('lastName', formData)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="email">Email</RequiredLabel>
          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ваш@email.com"
                className={cn(
                  inputWithIconClass,
                  showError('email') && 'border-destructive/80 ring-destructive/30'
                )}
                aria-invalid={showError('email')}
                value={formData.email}
                onBlur={() => onBlurField('email')}
                onChange={(e) => onPatchForm({ email: sanitizeEmail(e.target.value) })}
              />
            </div>
            <FieldHint
              id="email-error"
              show={Boolean(contactTouched.email)}
              message={getCheckoutContactFieldError('email', formData)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="phone">Телефон</RequiredLabel>
          <div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={phoneInputRef}
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+380 00 000 0000"
                className={cn(
                  inputWithIconClass,
                  showError('phone') && 'border-destructive/80 ring-destructive/30'
                )}
                aria-invalid={showError('phone')}
                value={formatPhoneDisplay(formData.phone)}
                onFocus={movePhoneCursorToEnd}
                onClick={movePhoneCursorToEnd}
                onBlur={() => onBlurField('phone')}
                onChange={(e) =>
                  onPatchForm({ phone: sanitizePhoneInput(e.target.value) })
                }
              />
            </div>
            <FieldHint
              id="phone-error"
              show={Boolean(contactTouched.phone)}
              message={getCheckoutContactFieldError('phone', formData)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          className={cn(
            'w-full sm:w-auto',
            !canProceed && 'translate-y-px opacity-45 shadow-inner saturate-50'
          )}
          onClick={onContinue}
          disabled={!canProceed}
        >
          Далі: Доставка
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
