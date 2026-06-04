'use client'

import { memo, useCallback, useEffect, useState, type RefObject } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, LogOut, Phone, Truck } from 'lucide-react'
import { toast } from 'sonner'

import {
  authInputClassName,
  FieldHint,
  RequiredLabel,
} from '@/components/auth/auth-form-ui'
import { useSession } from '@/components/providers/session-provider'
import { MOCK_GOOGLE_CHECKOUT_USER } from '@/lib/auth/mock-google-user'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import {
  lookupCustomerByPhone,
  sendCheckoutSmsCode,
  verifyCheckoutSmsCode,
} from '@/lib/checkout-customer-lookup'
import { cn } from '@/lib/utils'
import {
  checkoutInsetPanelClassName,
  checkoutPanelClassName,
} from '@/components/checkout/checkout-utils'
import {
  formatPhoneDisplay,
  getCheckoutContactFieldError,
  getCheckoutPhoneLookupDelayMs,
  getCheckoutPhoneLookupKind,
  isCheckoutPhoneReadyForLookup,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
} from '@/lib/validation/checkout-form'

const inputWithIconClass = cn(authInputClassName, 'pl-10')

type AuthMethod = 'google' | 'sms' | null

function OrDivider() {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="w-full border-t border-border" />
      </div>
      <p className="relative mx-auto w-fit bg-background/95 px-3 text-xs text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/60">
        або
      </p>
    </div>
  )
}

function NameFields({
  formData,
  contactTouched,
  showError,
  onBlurField,
  onPatchForm,
}: {
  formData: CheckoutFormValues
  contactTouched: Partial<Record<CheckoutContactFieldKey, boolean>>
  showError: (field: CheckoutContactFieldKey) => boolean
  onBlurField: (field: CheckoutContactFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <RequiredLabel htmlFor="firstName">Ім&apos;я</RequiredLabel>
        <InputWithClear
          id="firstName"
          autoComplete="given-name"
          placeholder="Ім'я"
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
          onClear={() => onPatchForm({ firstName: '' })}
        />
        <FieldHint
          id="firstName-error"
          show={Boolean(contactTouched.firstName)}
          message={getCheckoutContactFieldError('firstName', formData)}
        />
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="lastName">Прізвище</RequiredLabel>
        <InputWithClear
          id="lastName"
          autoComplete="family-name"
          placeholder="Прізвище"
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
          onClear={() => onPatchForm({ lastName: '' })}
        />
        <FieldHint
          id="lastName-error"
          show={Boolean(contactTouched.lastName)}
          message={getCheckoutContactFieldError('lastName', formData)}
        />
      </div>
    </div>
  )
}

export const CheckoutContactStep = memo(function CheckoutContactStep({
  formData,
  contactTouched,
  identification,
  canProceed,
  phoneInputRef,
  onBlurField,
  onPatchForm,
  onIdentificationChange,
  onContinue,
  onAuthenticated,
  onReturningCustomerVerified,
  onLogout,
}: {
  formData: CheckoutFormValues
  contactTouched: Partial<Record<CheckoutContactFieldKey, boolean>>
  identification: CheckoutIdentificationState
  canProceed: boolean
  phoneInputRef: RefObject<HTMLInputElement | null>
  onBlurField: (field: CheckoutContactFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onIdentificationChange: (patch: Partial<CheckoutIdentificationState>) => void
  onContinue: () => void
  onAuthenticated: () => void
  onReturningCustomerVerified: (discountPercent: number) => void
  onLogout: () => void
}) {
  const router = useRouter()
  const { user, setUser } = useSession()
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupPhone, setLookupPhone] = useState<string | null>(null)
  const [showReturningLogin, setShowReturningLogin] = useState(false)
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsSent, setSmsSent] = useState(false)
  const [smsCode, setSmsCode] = useState('')
  const [smsError, setSmsError] = useState<string | null>(null)

  const isAuthenticated = identification.returningVerified

  const showError = (field: CheckoutContactFieldKey) =>
    Boolean(contactTouched[field] && getCheckoutContactFieldError(field, formData))

  const resetLookup = useCallback(() => {
    setLookupPhone(null)
    setSmsSent(false)
    setSmsCode('')
    setSmsError(null)
    setShowReturningLogin(false)
    onIdentificationChange({
      lookupDone: false,
      customerFound: null,
      returningVerified: false,
      skippedReturningLogin: false,
      attemptingReturningLogin: false,
    })
  }, [onIdentificationChange])

  const runPhoneLookup = useCallback(
    async (phone: string) => {
      setLookupLoading(true)
      setLookupPhone(phone)
      setSmsSent(false)
      setSmsCode('')
      setSmsError(null)
      setShowReturningLogin(false)

      try {
        const result = await lookupCustomerByPhone(phone)
        onIdentificationChange({
          lookupDone: true,
          customerFound: result.found,
          returningVerified: false,
          skippedReturningLogin: false,
          attemptingReturningLogin: false,
        })
      } finally {
        setLookupLoading(false)
      }
    },
    [onIdentificationChange]
  )

  const applyReturningProfile = useCallback(
    (
      profile: {
        firstName: string
        lastName: string
        phone: string
        personalDiscountPercent: number
      },
      method: AuthMethod
    ) => {
      onPatchForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      })
      setLookupPhone(profile.phone)
      setSmsSent(false)
      setSmsCode('')
      setSmsError(null)
      setShowReturningLogin(false)
      setAuthMethod(method)
      onIdentificationChange({
        lookupDone: true,
        customerFound: true,
        returningVerified: true,
        skippedReturningLogin: false,
        attemptingReturningLogin: false,
      })
      onReturningCustomerVerified(profile.personalDiscountPercent)
    },
    [onIdentificationChange, onPatchForm, onReturningCustomerVerified]
  )

  useEffect(() => {
    if (identification.returningVerified || !user) return
    if (user.email.toLowerCase() !== MOCK_GOOGLE_CHECKOUT_USER.email) return

    applyReturningProfile(
      {
        firstName: MOCK_GOOGLE_CHECKOUT_USER.firstName,
        lastName: MOCK_GOOGLE_CHECKOUT_USER.lastName,
        phone: MOCK_GOOGLE_CHECKOUT_USER.phone,
        personalDiscountPercent: MOCK_GOOGLE_CHECKOUT_USER.personalDiscountPercent,
      },
      'google'
    )
    onAuthenticated()
  }, [user, identification.returningVerified, applyReturningProfile, onAuthenticated])

  useEffect(() => {
    if (identification.returningVerified) return

    const phone = formData.phone.trim()
    const kind = getCheckoutPhoneLookupKind(phone)

    if (kind === 'none') {
      setLookupLoading(false)
      if (identification.lookupDone || lookupPhone) {
        resetLookup()
      }
      return
    }

    const delay = getCheckoutPhoneLookupDelayMs(kind)
    const timer = window.setTimeout(() => {
      if (lookupPhone === phone && identification.lookupDone) return
      void runPhoneLookup(phone)
    }, delay)

    return () => window.clearTimeout(timer)
  }, [
    formData.phone,
    identification.lookupDone,
    identification.returningVerified,
    lookupPhone,
    resetLookup,
    runPhoneLookup,
  ])

  const showReturningLoginHint =
    identification.lookupDone &&
    identification.customerFound === true &&
    lookupPhone === formData.phone.trim() &&
    isCheckoutPhoneReadyForLookup(formData.phone) &&
    !lookupLoading &&
    !isAuthenticated &&
    !showReturningLogin

  const showSmsLoginFlow =
    identification.customerFound === true &&
    showReturningLogin &&
    !isAuthenticated

  const handleSendSms = async () => {
    setSmsSending(true)
    setSmsError(null)
    try {
      await sendCheckoutSmsCode(formData.phone)
      setSmsSent(true)
      toast.success('Код надіслано SMS')
    } finally {
      setSmsSending(false)
    }
  }

  const handleVerifySms = async () => {
    if (!verifyCheckoutSmsCode(smsCode)) {
      setSmsError('Невірний код. Спробуйте 1234 (мок)')
      return
    }
    setSmsError(null)
    const result = await lookupCustomerByPhone(formData.phone)
    applyReturningProfile(
      {
        firstName: result.firstName ?? formData.firstName,
        lastName: result.lastName ?? formData.lastName,
        phone: formData.phone.trim(),
        personalDiscountPercent: result.personalDiscountPercent ?? 0,
      },
      'sms'
    )
    toast.success('Вітаємо! Застосовано ваші персональні ціни')
    onAuthenticated()
  }

  const handleGoogleLogin = async () => {
    if (googleLoading || isAuthenticated) return

    setGoogleLoading(true)
    try {
      const res = await fetch('/api/auth/oauth/google', { method: 'POST' })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        user?: { email: string; role: 'customer' | 'admin' }
        profile?: {
          firstName: string
          lastName: string
          phone: string
          personalDiscountPercent: number
        }
      }

      if (!res.ok || !data.user || !data.profile) {
        toast.error(data.error || 'Не вдалося увійти через Google')
        return
      }

      setUser(data.user)
      applyReturningProfile(data.profile, 'google')
      toast.success(`Вітаємо, ${data.profile.firstName}! Увійшли через Google`)
      router.refresh()
      onAuthenticated()
    } catch {
      toast.error('Помилка зʼєднання. Спробуйте ще раз.')
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleAppleLogin = () => {
    toast.info('Вхід через Apple — незабаром')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* cookie clear best-effort */
    }
    setUser(null)
    setAuthMethod(null)
    resetLookup()
    onPatchForm({ firstName: '', lastName: '', phone: '' })
    onLogout()
    router.refresh()
    toast.success('Ви вийшли з облікового запису')
  }

  const authMethodLabel =
    authMethod === 'google'
      ? 'Google'
      : authMethod === 'sms'
        ? 'SMS'
        : user
          ? 'обліковий запис'
          : 'телефон'

  return (
    <div className={checkoutPanelClassName}>
      <header className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          Оформлення замовлення
        </p>
        <h2 className="font-serif text-xl font-semibold text-foreground sm:text-2xl">
          Хто замовляє?
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAuthenticated
            ? 'Дані замовника підтверджено. Можете перейти до доставки.'
            : 'Вкажіть телефон і ПІБ або увійдіть через Google.'}
        </p>
      </header>

      {isAuthenticated ? (
        <div
          className={cn(
            checkoutInsetPanelClassName,
            'space-y-4 border-primary/30 bg-primary/10 p-4'
          )}
        >
          <div>
            <p className="font-serif text-lg font-semibold text-foreground">
              {formData.lastName} {formData.firstName}
            </p>
            {formData.phone && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPhoneDisplay(formData.phone)}
              </p>
            )}
            {user?.email && (
              <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Увійшли через {authMethodLabel}
            </p>
          </div>
          <Button className='flex justify-self-end' type="button" variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Вийти
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 border-border bg-background font-normal"
              disabled={googleLoading}
              onClick={handleGoogleLogin}
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Вхід через Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 border-border bg-background font-normal"
              onClick={handleAppleLogin}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Вхід через Apple
            </Button>
          </div>

          <OrDivider />

          <div className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="phone">Номер телефону</RequiredLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <InputWithClear
                  ref={phoneInputRef}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+380 або 063…"
                  className={cn(
                    inputWithIconClass,
                    showError('phone') && 'border-destructive/80 ring-destructive/30'
                  )}
                  aria-invalid={showError('phone')}
                  value={formData.phone}
                  onBlur={() => onBlurField('phone')}
                  onChange={(e) => {
                    const phone = sanitizeCheckoutPhoneInput(e.target.value)
                    onPatchForm({ phone })
                    if (lookupPhone && phone !== lookupPhone) {
                      resetLookup()
                    }
                  }}
                  onClear={() => {
                    onPatchForm({ phone: '' })
                    resetLookup()
                  }}
                  endPaddingClass={
                    lookupLoading && !formData.phone.trim() ? 'pr-9' : undefined
                  }
                  clearPaddingClass={lookupLoading ? 'pr-16' : 'pr-9'}
                  clearButtonClassName={lookupLoading ? 'right-9' : undefined}
                />
                {lookupLoading && (
                  <Loader2 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              <FieldHint
                id="phone-error"
                show={Boolean(contactTouched.phone)}
                message={getCheckoutContactFieldError('phone', formData)}
              />
              <div className="min-h-6 text-sm leading-snug">
                {showReturningLoginHint ? (
                  <p className="text-muted-foreground">
                    Вже замовляли у нас —{' '}
                    <button
                      type="button"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                      onClick={() => {
                        setShowReturningLogin(true)
                        onIdentificationChange({
                          skippedReturningLogin: false,
                          attemptingReturningLogin: true,
                        })
                      }}
                    >
                      Увійти?
                    </button>
                  </p>
                ) : null}
              </div>

              {showSmsLoginFlow && (
                <div className="space-y-3 pt-1">
                  {!smsSent ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={smsSending}
                      onClick={handleSendSms}
                    >
                      {smsSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Надсилання…
                        </>
                      ) : (
                        'Отримати код у SMS'
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label htmlFor="sms-code">Код з SMS</Label>
                      <InputOTP
                        id="sms-code"
                        maxLength={4}
                        value={smsCode}
                        onChange={(value) => {
                          setSmsCode(value)
                          setSmsError(null)
                        }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                      {smsError && (
                        <p className="text-xs text-destructive" role="alert">
                          {smsError}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          disabled={smsCode.length < 4}
                          onClick={handleVerifySms}
                        >
                          Підтвердити
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={smsSending}
                          onClick={handleSendSms}
                        >
                          Надіслати ще раз
                        </Button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                    onClick={() => {
                      setShowReturningLogin(false)
                      setSmsSent(false)
                      setSmsCode('')
                      setSmsError(null)
                      onIdentificationChange({
                        skippedReturningLogin: true,
                        attemptingReturningLogin: false,
                      })
                    }}
                  >
                    Продовжити без авторизації
                  </button>
                </div>
              )}
            </div>

            {!showReturningLogin && (
              <NameFields
                formData={formData}
                contactTouched={contactTouched}
                showError={showError}
                onBlurField={onBlurField}
                onPatchForm={onPatchForm}
              />
            )}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          className={cn(
            'w-full gap-0 sm:w-auto',
            !canProceed && 'translate-y-px opacity-45 shadow-inner saturate-50'
          )}
          onClick={onContinue}
          disabled={!canProceed}
        >
          Далі: <Truck className="ml-3 mr-1 h-4 w-4" /> Доставка
          <ChevronRight className="ml-3 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
