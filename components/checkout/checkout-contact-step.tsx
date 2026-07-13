'use client'

import { memo, useCallback, useState, type RefObject } from 'react'
import { ArrowLeft, ChevronRight, Loader2, LogOut, Mail, Phone, Truck, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AuthOAuthButtons } from '@/components/auth/auth-oauth-buttons'
import { FieldHint, OrDivider, RequiredLabel } from '@/components/auth/auth-form-ui'
import { useSession } from '@/components/providers/session-provider'
import { startGoogleOAuth } from '@/lib/auth/google-oauth-client'
import { isGoogleOAuthConfigured } from '@/lib/auth/google-oauth'
import { useOAuthReturn } from '@/lib/auth/use-oauth-return'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  resolveCheckoutIdentity,
  sendCheckoutEmailCode,
  sendCheckoutSmsCode,
  verifyAuthEmailCode,
  verifyCheckoutSmsCode,
  type CustomerLookupResult,
} from '@/lib/checkout-customer-lookup'
import { cn } from '@/lib/utils'
import {
  checkoutInsetPanelClassName,
  checkoutPanelClassName,
  checkoutInputClassName,
} from '@/components/checkout/checkout-utils'
import { useRouter } from '@/i18n/navigation'
import { isValidCyrillicName, isValidEmail, sanitizeEmail } from '@/lib/validation/register-form'
import {
  formatPhoneDisplay,
  getCheckoutContactFieldError,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
} from '@/lib/validation/checkout-form'
import { isValidUkrPhone } from '@/lib/validation/checkout-form'

type AuthChannel = 'phone' | 'email'
type AuthStep = 'identifier' | 'otp' | 'profile'

type AuthMethod = 'google' | 'sms' | 'email' | null

const phoneLeadingIcon = <Phone className="h-4 w-4" />
const emailLeadingIcon = <Mail className="h-4 w-4" />

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
  const tc = useTranslations('common')
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <RequiredLabel htmlFor="firstName">{tc('firstName')}</RequiredLabel>
        <InputWithClear
          id="firstName"
          autoComplete="given-name"
          placeholder={tc('firstName')}
          className={cn(checkoutInputClassName, showError('firstName') && 'border-destructive/80 ring-destructive/30')}
          aria-invalid={showError('firstName')}
          value={formData.firstName}
          onBlur={() => onBlurField('firstName')}
          onChange={(e) => onPatchForm({ firstName: sanitizeCyrillicName(e.target.value) })}
          onClear={() => onPatchForm({ firstName: '' })}
        />
        <FieldHint
          id="firstName-error"
          show={Boolean(contactTouched.firstName)}
          message={getCheckoutContactFieldError('firstName', formData)}
        />
      </div>
      <div className="space-y-2">
        <RequiredLabel htmlFor="lastName">{tc('lastName')}</RequiredLabel>
        <InputWithClear
          id="lastName"
          autoComplete="family-name"
          placeholder={tc('lastName')}
          className={cn(checkoutInputClassName, showError('lastName') && 'border-destructive/80 ring-destructive/30')}
          aria-invalid={showError('lastName')}
          value={formData.lastName}
          onBlur={() => onBlurField('lastName')}
          onChange={(e) => onPatchForm({ lastName: sanitizeCyrillicName(e.target.value) })}
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

function getPhoneError(phone: string, tc: (key: string) => string): string | null {
  if (!phone.trim()) return tc('requiredField')
  if (!isValidUkrPhone(phone)) return tc('invalidUkrPhone')
  return null
}

function getEmailFieldError(email: string, tc: (key: string) => string): string | null {
  if (!email.trim()) return tc('requiredField')
  if (!isValidEmail(email)) return tc('invalidEmail')
  return null
}

export const CheckoutContactStep = memo(function CheckoutContactStep({
  formData,
  contactTouched,
  identification,
  sessionHydrationPending = false,
  canProceed,
  phoneInputRef,
  onBlurField,
  onPatchForm,
  onIdentificationChange,
  onContinue,
  onAuthenticated,
  onReturningCustomerVerified,
  onLogout,
  showStepNav = true,
}: {
  formData: CheckoutFormValues
  contactTouched: Partial<Record<CheckoutContactFieldKey, boolean>>
  identification: CheckoutIdentificationState
  sessionHydrationPending?: boolean
  canProceed: boolean
  phoneInputRef: RefObject<HTMLInputElement | null>
  onBlurField: (field: CheckoutContactFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  onIdentificationChange: (patch: Partial<CheckoutIdentificationState>) => void
  onContinue: () => void
  onAuthenticated: () => void
  onReturningCustomerVerified: (discountPercent: number) => void
  onLogout: () => void
  showStepNav?: boolean
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const ta = useTranslations('auth')
  const router = useRouter()
  const { user, setUser } = useSession()

  const [channel, setChannel] = useState<AuthChannel>('phone')
  const [step, setStep] = useState<AuthStep>('identifier')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)

  const isAuthenticated = identification.returningVerified
  const sessionPending = sessionHydrationPending

  const phoneError = getPhoneError(formData.phone, tc)
  const emailError = getEmailFieldError(formData.email, tc)
  const canSendIdentifierCode =
    channel === 'phone'
      ? isValidUkrPhone(formData.phone.trim())
      : Boolean(formData.email.trim()) && isValidEmail(formData.email.trim())
  const canSaveProfile =
    isValidCyrillicName(formData.firstName) && isValidCyrillicName(formData.lastName)

  const showError = (field: CheckoutContactFieldKey) =>
    Boolean(contactTouched[field] && getCheckoutContactFieldError(field, formData))

  const resetAuthFlow = useCallback(() => {
    setStep('identifier')
    setCode('')
    setCodeError(null)
    setVerificationToken(null)
    setPhoneTouched(false)
    setEmailTouched(false)
  }, [])

  const buildVerifiedContactPatch = useCallback(
    (
      profile: {
        firstName?: string
        lastName?: string
        phone?: string
        email?: string
        user?: CustomerLookupResult['user']
      },
      method: AuthMethod,
    ): Partial<CheckoutFormValues> => {
      const patch: Partial<CheckoutFormValues> = {
        firstName: profile.firstName ?? formData.firstName,
        lastName: profile.lastName ?? formData.lastName,
      }

      const dbPhone = profile.phone ?? profile.user?.phone ?? ''
      const dbEmail = profile.email ?? profile.user?.email ?? ''

      if (method === 'sms') {
        patch.phone = dbPhone || formData.phone.trim()
        patch.email = dbEmail && isValidEmail(dbEmail) ? dbEmail : ''
      } else if (method === 'email') {
        patch.email = dbEmail && isValidEmail(dbEmail) ? dbEmail : formData.email.trim()
        patch.phone = dbPhone || ''
      } else {
        patch.phone = dbPhone || ''
        patch.email = dbEmail && isValidEmail(dbEmail) ? dbEmail : ''
      }

      return patch
    },
    [formData.email, formData.firstName, formData.lastName, formData.phone],
  )

  const applyCustomerProfile = useCallback(
    (
      profile: {
        firstName?: string
        lastName?: string
        phone?: string
        email?: string
        personalDiscountPercent?: number
        user?: CustomerLookupResult['user']
      },
      method: AuthMethod,
    ) => {
      onPatchForm(buildVerifiedContactPatch(profile, method))
      if (profile.user) {
        setUser(profile.user)
      }
      onIdentificationChange({
        lookupDone: true,
        customerFound: true,
        returningVerified: true,
        skippedReturningLogin: false,
        attemptingReturningLogin: false,
        authMethod: method,
      })
      onReturningCustomerVerified(profile.personalDiscountPercent ?? 0)
      onAuthenticated()
      router.refresh()
    },
    [
      buildVerifiedContactPatch,
      onAuthenticated,
      onIdentificationChange,
      onPatchForm,
      onReturningCustomerVerified,
      router,
      setUser,
    ],
  )

  const completeGoogleCheckout = useCallback(
    (payload: {
      user: {
        email: string
        role: 'customer' | 'admin'
        firstName?: string | null
        lastName?: string | null
        phone?: string | null
      }
      profile: {
        firstName: string
        lastName: string
        phone: string
        personalDiscountPercent?: number
      } | null
    }) => {
      applyCustomerProfile(
        {
          firstName: payload.profile?.firstName ?? payload.user.firstName ?? '',
          lastName: payload.profile?.lastName ?? payload.user.lastName ?? '',
          phone: payload.profile?.phone ?? payload.user.phone ?? '',
          email: payload.user.email,
          personalDiscountPercent: payload.profile?.personalDiscountPercent ?? 0,
          user: payload.user,
        },
        'google',
      )
      toast.success(tc('personalPricesApplied'))
    },
    [applyCustomerProfile],
  )

  useOAuthReturn(completeGoogleCheckout)

  const handleChannelChange = (value: string) => {
    const next = value as AuthChannel
    setChannel(next)
    resetAuthFlow()
    onPatchForm(next === 'phone' ? { email: '' } : { phone: '' })
  }

  const handleContinue = async () => {
    if (channel === 'phone') {
      setPhoneTouched(true)
      if (phoneError) return
    } else {
      setEmailTouched(true)
      if (emailError) return
    }

    setSubmitting(true)
    setCodeError(null)
    try {
      if (channel === 'phone') {
        await sendCheckoutSmsCode(formData.phone)
        toast.success(channel === 'phone' ? tc('codeSentSms') : tc('codeSentEmail'))
      } else {
        await sendCheckoutEmailCode(formData.email)
        toast.success(tc('codeSentEmail'))
      }
      setStep('otp')
      setCode('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc('sendCodeFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    if (code.length < 4) return

    setSubmitting(true)
    setCodeError(null)
    try {
      const result =
        channel === 'phone'
          ? await verifyCheckoutSmsCode(formData.phone, code)
          : await verifyAuthEmailCode(formData.email, code)

      setVerificationToken(result.verificationToken)

      const identity = await resolveCheckoutIdentity({
        ...(channel === 'phone'
          ? { phone: formData.phone.trim() }
          : { email: formData.email.trim() }),
        verificationToken: result.verificationToken,
      })

      if (identity.needsProfile || !identity.found) {
        setStep('profile')
        return
      }

      applyCustomerProfile(
        identity,
        channel === 'phone' ? 'sms' : 'email',
      )
      toast.success(tc('personalPricesApplied'))
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : tc('invalidCode'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveProfile = async () => {
    onBlurField('firstName')
    onBlurField('lastName')
    if (
      getCheckoutContactFieldError('firstName', formData) ||
      getCheckoutContactFieldError('lastName', formData)
    ) {
      return
    }
    if (!verificationToken) {
      setCodeError(tc('verificationExpired'))
      setStep('identifier')
      return
    }

    setSubmitting(true)
    setCodeError(null)
    try {
      const identity = await resolveCheckoutIdentity({
        ...(channel === 'phone'
          ? { phone: formData.phone.trim() }
          : { email: formData.email.trim() }),
        verificationToken,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      if (!identity.found) {
        throw new Error(tc('profileSaveFailed'))
      }

      applyCustomerProfile(identity, channel === 'phone' ? 'sms' : 'email')
      toast.success(tc('profileSaved'))
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : tc('profileSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackToAuthMethod = () => {
    resetAuthFlow()
  }

  const handleGoogleLogin = () => {
    if (googleLoading || isAuthenticated) return
    if (!isGoogleOAuthConfigured()) {
      toast.error(tc('googleSignInUnavailable'))
      return
    }
    setGoogleLoading(true)
    startGoogleOAuth('/checkout', 'checkout')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* best-effort */
    }
    setUser(null)
    resetAuthFlow()
    onPatchForm({ firstName: '', lastName: '', phone: '', email: '' })
    onIdentificationChange({
      lookupDone: false,
      customerFound: null,
      returningVerified: false,
      skippedReturningLogin: false,
      attemptingReturningLogin: false,
      authMethod: null,
    })
    onLogout()
    router.refresh()
    toast.success(tc('loggedOutAccount'))
  }

  const authMethodLabel =
    identification.authMethod === 'google'
      ? 'Google'
      : identification.authMethod === 'sms'
        ? 'SMS'
        : identification.authMethod === 'email'
          ? 'Email'
          : user
            ? t('authMethodAccount')
            : t('authMethodPhone')

  const identifierLabel =
    channel === 'phone'
      ? formatPhoneDisplay(formData.phone)
      : formData.email.trim().toLowerCase()

  const verifiedPhone =
    identification.authMethod === 'sms'
      ? formData.phone
      : identification.authMethod === 'google'
        ? formData.phone || user?.phone || ''
        : user?.phone || ''
  const verifiedEmail =
    identification.authMethod === 'email'
      ? formData.email
      : identification.authMethod === 'google'
        ? formData.email || user?.email || ''
        : user?.email || ''
  const showVerifiedPhone = Boolean(verifiedPhone?.trim())
  const showVerifiedEmail = Boolean(verifiedEmail?.trim()) && isValidEmail(verifiedEmail)

  return (
    <div className={checkoutPanelClassName}>
      <header className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">
          {t('stepLabel', { step: 1 })}
        </p>
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground sm:text-2xl">
          <User className="h-5 w-5 text-primary" />
          {t('contactTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isAuthenticated
            ? t('contactConfirmed')
            : sessionPending
              ? t('loadingProfile')
              : t('contactHint')}
        </p>
      </header>

      {isAuthenticated ? (
        <div
          className={cn(
            checkoutInsetPanelClassName,
            'flex items-start justify-between gap-3 border-primary/30 bg-primary/10 p-4',
          )}
        >
          <div className="min-w-0">
            <p className="font-serif text-lg font-semibold text-foreground">
              {formData.lastName} {formData.firstName}
            </p>
            {showVerifiedPhone && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatPhoneDisplay(verifiedPhone)}
              </p>
            )}
            {showVerifiedEmail && (
              <p className="mt-0.5 text-sm text-muted-foreground">{verifiedEmail}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {t('signedInVia', { method: authMethodLabel })}
            </p>
          </div>
          <Button
            className="shrink-0"
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {tc('logout')}
          </Button>
        </div>
      ) : sessionPending ? (
        <div className={cn(checkoutInsetPanelClassName, 'flex items-center justify-center gap-2 p-8')}>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t('checkingSession')}</span>
        </div>
      ) : (
        <div className="space-y-5">
          {step === 'identifier' ? (
            <Tabs value={channel} onValueChange={handleChannelChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="phone" className="gap-2">
                  <Phone className="h-4 w-4" />
                  {tc('phoneTab')}
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  {tc('email')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 px-2 text-muted-foreground"
              disabled={submitting}
              onClick={handleBackToAuthMethod}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToAuthMethod')}
            </Button>
          )}

          {step === 'identifier' ? (
            <div className="space-y-4">
              {channel === 'phone' ? (
                <div className="space-y-2">
                  <RequiredLabel htmlFor="phone">{tc('phoneNumber')}</RequiredLabel>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <InputWithClear
                        ref={phoneInputRef}
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+380 XX XXX XX XX"
                        leadingIcon={phoneLeadingIcon}
                        className={cn(
                          checkoutInputClassName,
                          phoneTouched && phoneError && 'border-destructive/80 ring-destructive/30',
                        )}
                        aria-invalid={Boolean(phoneTouched && phoneError)}
                        value={formData.phone}
                        onBlur={() => setPhoneTouched(true)}
                        onChange={(e) => onPatchForm({ phone: sanitizeCheckoutPhoneInput(e.target.value) })}
                        onClear={() => onPatchForm({ phone: '' })}
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full shrink-0 sm:w-auto sm:self-center"
                      disabled={submitting || !canSendIdentifierCode}
                      onClick={handleContinue}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tc('sending')}
                        </>
                      ) : (
                        tc('continue')
                      )}
                    </Button>
                  </div>
                  <FieldHint id="phone-error" show={phoneTouched} message={phoneError} />
                </div>
              ) : (
                <div className="space-y-2">
                  <RequiredLabel htmlFor="checkout-email">{tc('email')}</RequiredLabel>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <InputWithClear
                        id="checkout-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder={ta('emailPlaceholder')}
                        leadingIcon={emailLeadingIcon}
                        className={cn(
                          checkoutInputClassName,
                          emailTouched && emailError && 'border-destructive/80 ring-destructive/30',
                        )}
                        aria-invalid={Boolean(emailTouched && emailError)}
                        value={formData.email}
                        onBlur={() => setEmailTouched(true)}
                        onChange={(e) => onPatchForm({ email: sanitizeEmail(e.target.value) })}
                        onClear={() => onPatchForm({ email: '' })}
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full shrink-0 sm:w-auto sm:self-center"
                      disabled={submitting || !canSendIdentifierCode}
                      onClick={handleContinue}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tc('sending')}
                        </>
                      ) : (
                        tc('continue')
                      )}
                    </Button>
                  </div>
                  <FieldHint id="checkout-email-error" show={emailTouched} message={emailError} />
                </div>
              )}
            </div>
          ) : null}

          {step === 'otp' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {channel === 'phone'
                  ? tc('codeSentToPhone', { phone: identifierLabel })
                  : tc('codeSentToEmail', { email: identifierLabel })}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-3">
                  <Label htmlFor="checkout-otp">
                    {channel === 'phone' ? tc('codeFromSms') : tc('codeFromEmail')}
                  </Label>
                  <InputOTP
                    id="checkout-otp"
                    maxLength={4}
                    value={code}
                    onChange={(value) => {
                      setCode(value)
                      setCodeError(null)
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={code.length < 4 || submitting}
                    onClick={handleVerifyCode}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {tc('verifying')}
                      </>
                    ) : (
                      tc('confirm')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={submitting}
                    onClick={handleContinue}
                  >
                    {tc('resend')}
                  </Button>
                </div>
              </div>
              {codeError && (
                <p className="text-xs text-destructive" role="alert">
                  {codeError}
                </p>
              )}
            </div>
          ) : null}

          {step === 'profile' ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {channel === 'phone'
                    ? t('phoneVerifiedProfileHint')
                    : t('emailVerifiedProfileHint')}
                </p>
                <p className="text-sm text-muted-foreground">{identifierLabel}</p>
              </div>
              <NameFields
                formData={formData}
                contactTouched={contactTouched}
                showError={showError}
                onBlurField={onBlurField}
                onPatchForm={onPatchForm}
              />
              {codeError && (
                <p className="text-xs text-destructive" role="alert">
                  {codeError}
                </p>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={submitting || !canSaveProfile}
                  onClick={handleSaveProfile}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tc('saving')}
                    </>
                  ) : (
                    t('saveAndContinue')
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 'identifier' ? (
            <>
              <OrDivider />
              <AuthOAuthButtons googleLoading={googleLoading} onGoogleClick={handleGoogleLogin} />
            </>
          ) : null}
        </div>
      )}

      {showStepNav ? (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            className={cn(
              'w-full gap-0 sm:w-auto',
              !canProceed && 'translate-y-px opacity-45 shadow-inner saturate-50',
            )}
            onClick={onContinue}
            disabled={!canProceed}
          >
            {t('nextShipping')}
            <ChevronRight className="ml-3 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  )
})
