'use client'

import { memo, useCallback, useEffect, useState, type ReactNode, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, ArrowLeftRight, ChevronRight, Loader2, LogOut, Mail, Phone, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AuthOAuthButtons } from '@/components/auth/auth-oauth-buttons'
import { FieldHint, OrDivider, RequiredLabel } from '@/components/auth/auth-form-ui'
import { useSession } from '@/components/providers/session-provider'
import { startGoogleOAuth } from '@/lib/auth/google-oauth-client'
import { isGoogleOAuthConfigured } from '@/lib/auth/google-oauth'
import { useOAuthReturn, type OAuthReturnPayload } from '@/lib/auth/use-oauth-return'
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
  verifyAuthSmsCode,
  verifyCheckoutSmsCode,
  type CustomerLookupResult,
} from '@/lib/checkout-customer-lookup'
import {
  fetchCheckoutIdentityHint,
  type CheckoutIdentityHint,
} from '@/lib/checkout/identity-hint'
import { buildVerifiedCheckoutContactPatch } from '@/lib/checkout/verified-contact-patch'
import { CheckoutIdentityHintPanel } from '@/components/checkout/checkout-identity-hint-panel'
import { CheckoutAccountLockedError } from '@/lib/checkout/account-lock'
import { CHECKOUT_ACCOUNT_LOCKED } from '@/lib/auth/constants'
import { cn } from '@/lib/utils'
import {
  checkoutInsetPanelClassName,
  checkoutPanelClassName,
  checkoutInputClassName,
} from '@/components/checkout/checkout-utils'
import {
  CheckoutSkAuthModeToggle,
  type SkCheckoutAuthMode,
} from '@/components/checkout/checkout-sk-auth-mode-toggle'
import { useRouter } from '@/i18n/navigation'
import {
  customerNeedsCheckoutNameEntry,
  formatPhoneDisplay,
  getCheckoutContactFieldError,
  sanitizeCheckoutPhoneInput,
  sanitizeCyrillicName,
  sanitizeLatinName,
  type CheckoutContactFieldKey,
  type CheckoutFormValues,
  type CheckoutIdentificationState,
  type CheckoutMarketRegion,
} from '@/lib/validation/checkout-form'
import {
  isValidCyrillicName,
  isValidEmail,
  isValidLatinName,
  sanitizeEmail,
} from '@/lib/validation/register-form'
import {
  DEFAULT_MARKET_SETTINGS,
  isOtpChannelEnabled,
  isValidPhoneForPolicy,
  phoneErrorForPolicy,
  phonePlaceholderForPolicy,
  type MarketSettings,
} from '@/lib/settings/market'

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
  marketRegion = 'ua',
}: {
  formData: CheckoutFormValues
  contactTouched: Partial<Record<CheckoutContactFieldKey, boolean>>
  showError: (field: CheckoutContactFieldKey) => boolean
  onBlurField: (field: CheckoutContactFieldKey) => void
  onPatchForm: (patch: Partial<CheckoutFormValues>) => void
  marketRegion?: CheckoutMarketRegion
}) {
  const tc = useTranslations('common')
  const sanitizeName = marketRegion === 'sk' ? sanitizeLatinName : sanitizeCyrillicName
  const errorOptions = { marketRegion }

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
          onChange={(e) => onPatchForm({ firstName: sanitizeName(e.target.value) })}
          onClear={() => onPatchForm({ firstName: '' })}
        />
        <FieldHint
          id="firstName-error"
          show={Boolean(contactTouched.firstName)}
          message={getCheckoutContactFieldError('firstName', formData, errorOptions)}
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
          onChange={(e) => onPatchForm({ lastName: sanitizeName(e.target.value) })}
          onClear={() => onPatchForm({ lastName: '' })}
        />
        <FieldHint
          id="lastName-error"
          show={Boolean(contactTouched.lastName)}
          message={getCheckoutContactFieldError('lastName', formData, errorOptions)}
        />
      </div>
    </div>
  )
}

function getPhoneError(
  phone: string,
  phonePolicy: MarketSettings['authPhonePolicy'],
  tc: (key: string) => string,
): string | null {
  if (!phone.trim()) return tc('requiredField')
  const err = phoneErrorForPolicy(phone, phonePolicy)
  if (err && err !== 'Обовʼязкове поле') return err
  if (err) return tc('requiredField')
  return null
}

function getEmailFieldError(
  email: string,
  tc: (key: string) => string,
  required: boolean,
): string | null {
  if (!email.trim()) return required ? tc('requiredField') : null
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
  onSwitchAccount,
  showStepNav = true,
  marketSettings = DEFAULT_MARKET_SETTINGS,
  skAuthMode: skAuthModeProp,
  onSkAuthModeChange,
  billingSlot,
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
  onSwitchAccount?: () => void
  showStepNav?: boolean
  marketSettings?: MarketSettings
  skAuthMode?: SkCheckoutAuthMode
  onSkAuthModeChange?: (mode: SkCheckoutAuthMode) => void
  billingSlot?: ReactNode
}) {
  const t = useTranslations('checkout')
  const tc = useTranslations('common')
  const ta = useTranslations('auth')
  const router = useRouter()
  const { user, setUser } = useSession()

  const marketRegion: CheckoutMarketRegion = marketSettings.region === 'sk' ? 'sk' : 'ua'
  const checkoutEmailRequired = marketSettings.checkoutEmailRequired
  const contactErrorOptions = {
    marketRegion,
    checkoutEmailRequired,
    authPhonePolicy: marketSettings.authPhonePolicy,
    deliveryPhonePolicy: marketSettings.deliveryPhonePolicy,
  }

  const smsEnabled = isOtpChannelEnabled(marketSettings, 'sms', 'checkout')
  const emailEnabled = isOtpChannelEnabled(marketSettings, 'email', 'checkout')
  const isSoftGuestMode = marketSettings.guestCheckoutMode === 'soft'
  const isTrueGuestMode = marketSettings.guestCheckoutMode === 'true_guest'

  const [internalSkAuthMode, setInternalSkAuthMode] = useState<SkCheckoutAuthMode>('guest')
  const skAuthMode = skAuthModeProp ?? internalSkAuthMode
  const handleSkAuthModeChange = onSkAuthModeChange ?? setInternalSkAuthMode

  const [channel, setChannel] = useState<AuthChannel>(() =>
    emailEnabled && !smsEnabled
      ? 'email'
      : smsEnabled && !emailEnabled
        ? 'phone'
        : marketSettings.region === 'sk'
          ? emailEnabled
            ? 'email'
            : 'phone'
          : smsEnabled
            ? 'phone'
            : 'email',
  )
  const [step, setStep] = useState<AuthStep>('identifier')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [identityHint, setIdentityHint] = useState<CheckoutIdentityHint | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [activeAuthChannel, setActiveAuthChannel] = useState<AuthChannel | null>(null)
  const [conflictAuthPath, setConflictAuthPath] = useState<'email' | 'phone' | null>(null)
  const [sessionLockUserId, setSessionLockUserId] = useState<string | null>(null)

  const isAuthenticated = identification.returningVerified
  const sessionPending = sessionHydrationPending
  const showGuestForm =
    !isAuthenticated &&
    !sessionPending &&
    (isSoftGuestMode || (isTrueGuestMode && skAuthMode === 'guest'))
  const showAuthToggle = isTrueGuestMode && !user && !isAuthenticated && !sessionPending
  const channelLocked = Boolean(conflictAuthPath)

  const phoneError = getPhoneError(formData.phone, marketSettings.authPhonePolicy, tc)
  const emailError = getEmailFieldError(formData.email, tc, checkoutEmailRequired)
  const emailReadyForHint =
    emailEnabled && Boolean(formData.email.trim()) && isValidEmail(formData.email.trim())
  const phoneReadyForHint =
    smsEnabled &&
    Boolean(formData.phone.trim()) &&
    isValidPhoneForPolicy(formData.phone.trim(), marketSettings.authPhonePolicy)
  const contactsReadyForHint =
    isSoftGuestMode &&
    showGuestForm &&
    (emailEnabled || smsEnabled) &&
    !phoneError &&
    !emailError &&
    (emailReadyForHint || phoneReadyForHint)
  const canSendIdentifierCode =
    channel === 'phone'
      ? isValidPhoneForPolicy(formData.phone.trim(), marketSettings.authPhonePolicy)
      : Boolean(formData.email.trim()) && isValidEmail(formData.email.trim())
  const canSaveProfile =
    marketRegion === 'sk'
      ? isValidLatinName(formData.firstName) && isValidLatinName(formData.lastName)
      : isValidCyrillicName(formData.firstName) && isValidCyrillicName(formData.lastName)

  const showError = (field: CheckoutContactFieldKey) =>
    Boolean(
      contactTouched[field] && getCheckoutContactFieldError(field, formData, contactErrorOptions),
    )

  const resetAuthFlow = useCallback(() => {
    setStep('identifier')
    setCode('')
    setCodeError(null)
    setVerificationToken(null)
    setPhoneTouched(false)
    setEmailTouched(false)
  }, [])

  useEffect(() => {
    if (!isSoftGuestMode) {
      setIdentityHint(null)
      setHintLoading(false)
      return
    }

    setActiveAuthChannel(null)
    setConflictAuthPath(null)
    resetAuthFlow()

    if (!contactsReadyForHint) {
      setIdentityHint(null)
      setHintLoading(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setHintLoading(true)
      try {
        const hint = await fetchCheckoutIdentityHint(formData.email, formData.phone)
        if (!cancelled) setIdentityHint(hint)
      } catch {
        if (!cancelled) {
          setIdentityHint({ identityResolution: 'none', suggestedAuth: null })
        }
      } finally {
        if (!cancelled) setHintLoading(false)
      }
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isSoftGuestMode, contactsReadyForHint, formData.email, formData.phone, resetAuthFlow])

  useEffect(() => {
    if (channel === 'phone' && !smsEnabled && emailEnabled) {
      setChannel('email')
      resetAuthFlow()
    } else if (channel === 'email' && !emailEnabled && smsEnabled) {
      setChannel('phone')
      resetAuthFlow()
    }
  }, [smsEnabled, emailEnabled, channel, resetAuthFlow])

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
    ): Partial<CheckoutFormValues> =>
      buildVerifiedCheckoutContactPatch(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
        profile,
        method,
      ),
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
      const nextUserId = profile.user?.id
      if (sessionLockUserId && nextUserId && nextUserId !== sessionLockUserId) {
        toast.error(t('identityHint.accountLocked'))
        return false
      }

      onPatchForm(buildVerifiedContactPatch(profile, method))
      if (profile.user) {
        setUser(profile.user)
      }
      if (conflictAuthPath && nextUserId) {
        setSessionLockUserId(nextUserId)
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
      return true
    },
    [
      buildVerifiedContactPatch,
      conflictAuthPath,
      onAuthenticated,
      onIdentificationChange,
      onPatchForm,
      onReturningCustomerVerified,
      router,
      sessionLockUserId,
      setUser,
      t,
    ],
  )

  const completeGoogleCheckout = useCallback(
    (payload: OAuthReturnPayload) => {
      const applied = applyCustomerProfile(
        {
          firstName: payload.profile?.firstName ?? payload.user.firstName ?? '',
          lastName: payload.profile?.lastName ?? payload.user.lastName ?? '',
          phone: payload.profile?.phone ?? payload.user.phone ?? '',
          email: payload.user.email ?? '',
          personalDiscountPercent: payload.profile?.personalDiscountPercent ?? 0,
          user: {
            ...payload.user,
            email: payload.user.email ?? '',
          },
        },
        'google',
      )
      if (applied) toast.success(tc('personalPricesApplied'))
    },
    [applyCustomerProfile, tc],
  )

  useOAuthReturn(completeGoogleCheckout, {
    errorMessages: {
      [CHECKOUT_ACCOUNT_LOCKED]: t('identityHint.accountLocked'),
    },
  })

  const handleChannelChange = (value: string) => {
    if (channelLocked) {
      toast.error(t('identityHint.useSelectedAccount'))
      return
    }
    const next = value as AuthChannel
    setChannel(next)
    resetAuthFlow()
    onPatchForm(next === 'phone' ? { email: '' } : { phone: '' })
  }

  const sendCodeForChannel = useCallback(
    async (authChannel: AuthChannel, lockedPath: 'email' | 'phone' | null = conflictAuthPath) => {
      if (lockedPath && authChannel !== lockedPath) {
        toast.error(t('identityHint.useSelectedAccount'))
        return
      }
      if (authChannel === 'phone') {
        setPhoneTouched(true)
        if (phoneError) return
      } else {
        setEmailTouched(true)
        if (emailError) return
      }

      setSubmitting(true)
      setCodeError(null)
      setCode('')
      try {
        if (authChannel === 'phone') {
          await sendCheckoutSmsCode(formData.phone)
          toast.success(tc('codeSentSms'))
        } else {
          await sendCheckoutEmailCode(formData.email)
          toast.success(tc('codeSentEmail'))
        }
        setStep('otp')
      } catch (e) {
        setStep('identifier')
        toast.error(e instanceof Error ? e.message : tc('sendCodeFailed'))
      } finally {
        setSubmitting(false)
      }
    },
    [conflictAuthPath, emailError, formData.email, formData.phone, phoneError, t, tc],
  )

  const startSoftInlineAuth = useCallback(
    (nextChannel: AuthChannel, isConflict: boolean) => {
      if (nextChannel === 'phone') {
        setPhoneTouched(true)
        if (phoneError) return
      } else {
        setEmailTouched(true)
        if (emailError) return
      }

      const locked = isConflict ? nextChannel : null
      // Mount OTP in the click handler so autoFocus still counts as a user gesture (iOS).
      flushSync(() => {
        setConflictAuthPath(locked)
        setChannel(nextChannel)
        setActiveAuthChannel(nextChannel)
        setStep('otp')
        setCode('')
        setCodeError(null)
        setVerificationToken(null)
      })
      void sendCodeForChannel(nextChannel, locked)
    },
    [emailError, phoneError, sendCodeForChannel],
  )

  const startSoftSignInEmail = useCallback(() => {
    startSoftInlineAuth('email', false)
  }, [startSoftInlineAuth])

  const startSoftSignInPhone = useCallback(() => {
    startSoftInlineAuth('phone', false)
  }, [startSoftInlineAuth])

  const startConflictEmailAccount = useCallback(() => {
    startSoftInlineAuth('email', true)
  }, [startSoftInlineAuth])

  const startConflictPhoneAccount = useCallback(() => {
    startSoftInlineAuth('phone', true)
  }, [startSoftInlineAuth])

  const cancelSoftInlineAuth = useCallback(() => {
    setActiveAuthChannel(null)
    setConflictAuthPath(null)
    resetAuthFlow()
  }, [resetAuthFlow])

  const handleContinueAsGuest = useCallback(() => {
    setActiveAuthChannel(null)
    setConflictAuthPath(null)
    resetAuthFlow()
    if (canProceed) onContinue()
  }, [canProceed, onContinue, resetAuthFlow])

  const handleContinue = () => {
    if (isSoftGuestMode && step === 'identifier') {
      if (channel === 'phone') {
        setPhoneTouched(true)
        if (phoneError) return
      } else {
        setEmailTouched(true)
        if (emailError) return
      }
      flushSync(() => {
        setStep('otp')
        setCode('')
        setCodeError(null)
      })
    }
    void sendCodeForChannel(channel)
  }

  const handleVerifyCode = async () => {
    if (code.length < 6) return

    setSubmitting(true)
    setCodeError(null)
    try {
      const result =
        channel === 'phone'
          ? await verifyCheckoutSmsCode(formData.phone, code)
          : await verifyAuthEmailCode(formData.email, code, 'checkout')

      setVerificationToken(result.verificationToken)

      const identity = await resolveCheckoutIdentity({
        ...(channel === 'phone'
          ? { phone: formData.phone.trim() }
          : { email: formData.email.trim() }),
        verificationToken: result.verificationToken,
        ...(formData.firstName.trim() ? { firstName: formData.firstName.trim() } : {}),
        ...(formData.lastName.trim() ? { lastName: formData.lastName.trim() } : {}),
      })

      if (identity.needsProfile || !identity.found) {
        if (isSoftGuestMode) {
          onBlurField('firstName')
          onBlurField('lastName')
          setCodeError(
            getCheckoutContactFieldError('firstName', formData, contactErrorOptions) ||
              getCheckoutContactFieldError('lastName', formData, contactErrorOptions) ||
              t('identityHint.namesRequired'),
          )
          return
        }
        setStep('profile')
        return
      }

      applyCustomerProfile(
        identity,
        channel === 'phone' ? 'sms' : 'email',
      )
      toast.success(tc('personalPricesApplied'))
    } catch (e) {
      if (e instanceof CheckoutAccountLockedError) {
        setCodeError(t('identityHint.accountLocked'))
        return
      }
      setCodeError(e instanceof Error ? e.message : tc('invalidCode'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveProfile = async () => {
    onBlurField('firstName')
    onBlurField('lastName')
    if (
      getCheckoutContactFieldError('firstName', formData, contactErrorOptions) ||
      getCheckoutContactFieldError('lastName', formData, contactErrorOptions)
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
      if (e instanceof CheckoutAccountLockedError) {
        setCodeError(t('identityHint.accountLocked'))
        return
      }
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
    if (conflictAuthPath === 'phone') {
      toast.error(t('identityHint.chooseEmailAccountFirst'))
      return
    }
    if (identityHint?.identityResolution === 'conflict' && !conflictAuthPath) {
      toast.error(t('identityHint.chooseEmailAccountFirst'))
      return
    }
    if (sessionLockUserId) {
      toast.error(t('identityHint.accountLocked'))
      return
    }
    if (!isGoogleOAuthConfigured()) {
      toast.error(tc('googleSignInUnavailable'))
      return
    }
    setGoogleLoading(true)
    startGoogleOAuth('/checkout', 'checkout')
  }

  const handleSwitchAccount = async () => {
    try {
      await fetch('/api/auth/checkout/switch-account', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      /* best-effort */
    }
    setUser(null)
    resetAuthFlow()
    setIdentityHint(null)
    setConflictAuthPath(null)
    setActiveAuthChannel(null)
    setSessionLockUserId(null)
    onIdentificationChange({
      lookupDone: false,
      customerFound: null,
      returningVerified: false,
      skippedReturningLogin: true,
      attemptingReturningLogin: false,
      authMethod: null,
    })
    handleSkAuthModeChange('guest')
    onSwitchAccount?.()
    router.refresh()
    toast.success(t('identityHint.switchedAccount'))
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* best-effort */
    }
    setUser(null)
    resetAuthFlow()
    setIdentityHint(null)
    setConflictAuthPath(null)
    setActiveAuthChannel(null)
    setSessionLockUserId(null)
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

  const showBillingSlot = Boolean(billingSlot) && (isAuthenticated || !sessionPending)

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
                : showGuestForm
                ? isSoftGuestMode
                  ? t(
                      checkoutEmailRequired
                        ? 'softContactHint'
                        : 'softContactHintEmailOptional',
                    )
                  : t(
                      emailEnabled && smsEnabled
                        ? 'skGuestContactHintBoth'
                        : emailEnabled
                          ? 'skGuestContactHintEmail'
                          : smsEnabled
                            ? 'skGuestContactHintPhone'
                            : 'skGuestContactHintName',
                    )
                : t(
                    emailEnabled && smsEnabled
                      ? 'contactHintBoth'
                      : emailEnabled
                        ? 'contactHintEmail'
                        : smsEnabled
                          ? 'contactHintPhone'
                          : 'contactHintGoogle',
                  )}
        </p>
      </header>

      {showAuthToggle ? (
        <CheckoutSkAuthModeToggle mode={skAuthMode} onChange={handleSkAuthModeChange} />
      ) : null}

      {isAuthenticated ? (
        <div
          className={cn(
            checkoutInsetPanelClassName,
            'flex flex-col gap-3 border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-start sm:justify-between',
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
            <p className="mt-1 text-xs text-primary">{t('identityHint.accountSelected')}</p>
          </div>
          {sessionLockUserId || conflictAuthPath ? (
            <Button
              className="w-full shrink-0 sm:w-auto"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSwitchAccount}
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              {t('identityHint.switchAccount')}
            </Button>
          ) : (
            <Button
              className="w-full shrink-0 sm:w-auto"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {tc('logout')}
            </Button>
          )}
        </div>
      ) : null}

      {isAuthenticated && marketRegion === 'sk' ? (
        <div className="mt-4 space-y-4">
          {!showVerifiedPhone ? (
            <div className="space-y-2">
              <RequiredLabel htmlFor="checkout-auth-phone">{tc('phone')}</RequiredLabel>
              <InputWithClear
                ref={phoneInputRef}
                id="checkout-auth-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={phonePlaceholderForPolicy(marketSettings.authPhonePolicy)}
                leadingIcon={phoneLeadingIcon}
                className={cn(
                  checkoutInputClassName,
                  (contactTouched.phone || phoneTouched) &&
                    phoneError &&
                    'border-destructive/80 ring-destructive/30',
                )}
                value={formData.phone}
                onBlur={() => {
                  setPhoneTouched(true)
                  onBlurField('phone')
                }}
                onChange={(e) =>
                  onPatchForm({ phone: sanitizeCheckoutPhoneInput(e.target.value) })
                }
                onClear={() => onPatchForm({ phone: '' })}
              />
              <FieldHint
                id="checkout-auth-phone-error"
                show={Boolean(contactTouched.phone || phoneTouched)}
                message={phoneError}
              />
            </div>
          ) : null}
          {!showVerifiedEmail ? (
            <div className="space-y-2">
              {checkoutEmailRequired ? (
                <RequiredLabel htmlFor="checkout-auth-email">{tc('email')}</RequiredLabel>
              ) : (
                <Label htmlFor="checkout-auth-email">{tc('email')}</Label>
              )}
              <InputWithClear
                id="checkout-auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                leadingIcon={emailLeadingIcon}
                className={cn(
                  checkoutInputClassName,
                  showError('email') && 'border-destructive/80 ring-destructive/30',
                )}
                value={formData.email}
                onBlur={() => onBlurField('email')}
                onChange={(e) => onPatchForm({ email: sanitizeEmail(e.target.value) })}
                onClear={() => onPatchForm({ email: '' })}
              />
              <FieldHint
                id="checkout-auth-email-error"
                show={Boolean(contactTouched.email)}
                message={getCheckoutContactFieldError('email', formData, contactErrorOptions)}
              />
            </div>
          ) : null}
          {customerNeedsCheckoutNameEntry(formData, identification, { marketRegion }) ? (
            <NameFields
              formData={formData}
              contactTouched={contactTouched}
              showError={showError}
              onBlurField={onBlurField}
              onPatchForm={onPatchForm}
              marketRegion={marketRegion}
            />
          ) : null}
        </div>
      ) : null}

      {!isAuthenticated && sessionPending ? (
        <div className={cn(checkoutInsetPanelClassName, 'flex items-center justify-center gap-2 p-8')}>
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t('checkingSession')}</span>
        </div>
      ) : !isAuthenticated && showGuestForm ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              {checkoutEmailRequired ? (
                <RequiredLabel htmlFor="checkout-guest-email">{tc('email')}</RequiredLabel>
              ) : (
                <Label htmlFor="checkout-guest-email">{tc('email')}</Label>
              )}
              <InputWithClear
                id="checkout-guest-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={ta('emailPlaceholder')}
                leadingIcon={emailLeadingIcon}
                className={cn(
                  checkoutInputClassName,
                  showError('email') && 'border-destructive/80 ring-destructive/30',
                )}
                aria-invalid={showError('email')}
                value={formData.email}
                onBlur={() => onBlurField('email')}
                onChange={(e) => onPatchForm({ email: sanitizeEmail(e.target.value) })}
                onClear={() => onPatchForm({ email: '' })}
              />
              <FieldHint
                id="checkout-guest-email-error"
                show={Boolean(contactTouched.email)}
                message={getCheckoutContactFieldError('email', formData, contactErrorOptions)}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="checkout-guest-phone">{tc('phone')}</RequiredLabel>
              <InputWithClear
                ref={phoneInputRef}
                id="checkout-guest-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={phonePlaceholderForPolicy(marketSettings.authPhonePolicy)}
                leadingIcon={phoneLeadingIcon}
                className={cn(
                  checkoutInputClassName,
                  (contactTouched.phone || phoneTouched) &&
                    phoneError &&
                    'border-destructive/80 ring-destructive/30',
                )}
                aria-invalid={Boolean((contactTouched.phone || phoneTouched) && phoneError)}
                value={formData.phone}
                onBlur={() => {
                  setPhoneTouched(true)
                  onBlurField('phone')
                }}
                onChange={(e) =>
                  onPatchForm({ phone: sanitizeCheckoutPhoneInput(e.target.value) })
                }
                onClear={() => onPatchForm({ phone: '' })}
              />
              <FieldHint
                id="checkout-guest-phone-error"
                show={Boolean(contactTouched.phone || phoneTouched)}
                message={phoneError}
              />
            </div>
          </div>
          <NameFields
            formData={formData}
            contactTouched={contactTouched}
            showError={showError}
            onBlurField={onBlurField}
            onPatchForm={onPatchForm}
            marketRegion={marketRegion}
          />
          {isSoftGuestMode ? (
            <CheckoutIdentityHintPanel
              hint={identityHint}
              hintLoading={hintLoading}
              smsEnabled={smsEnabled}
              emailEnabled={emailEnabled}
              googleEnabled={isGoogleOAuthConfigured()}
              googleLoading={googleLoading}
              emailReady={Boolean(formData.email.trim()) && isValidEmail(formData.email.trim())}
              phoneReady={isValidPhoneForPolicy(
                formData.phone.trim(),
                marketSettings.authPhonePolicy,
              )}
              inlineAuthChannel={activeAuthChannel}
              inlineAuth={
                activeAuthChannel ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {identityHint?.identityResolution === 'none'
                            ? activeAuthChannel === 'phone'
                              ? t('identityHint.inlineAuthPhoneRegister')
                              : t('identityHint.inlineAuthEmailRegister')
                            : activeAuthChannel === 'phone'
                              ? t('identityHint.inlineAuthPhone')
                              : t('identityHint.inlineAuthEmail')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{identifierLabel}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        disabled={submitting}
                        onClick={cancelSoftInlineAuth}
                      >
                        {identityHint?.identityResolution === 'none'
                          ? t('identityHint.cancelRegister')
                          : t('identityHint.cancelAuth')}
                      </Button>
                    </div>

                    {step === 'identifier' ? (
                      <Button
                        type="button"
                        className="w-full sm:w-auto"
                        disabled={submitting || !canSendIdentifierCode}
                        onClick={handleContinue}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {tc('sending')}
                          </>
                        ) : (
                          t('identityHint.sendCode')
                        )}
                      </Button>
                    ) : null}

                    {step === 'otp' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {channel === 'phone'
                            ? tc('codeSentToPhone', { phone: identifierLabel })
                            : tc('codeSentToEmail', { email: identifierLabel })}
                        </p>
                        <Label htmlFor="checkout-soft-otp">
                          {channel === 'phone' ? tc('codeFromSms') : tc('codeFromEmail')}
                        </Label>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                          <InputOTP
                            id="checkout-soft-otp"
                            maxLength={6}
                            autoFocus
                            autoComplete="one-time-code"
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
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <Button
                              type="button"
                              disabled={code.length < 6 || submitting}
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
                      </div>
                    ) : null}

                    {codeError ? (
                      <p className="text-xs text-destructive" role="alert">
                        {codeError}
                      </p>
                    ) : null}

                    {identityHint?.identityResolution !== 'none' &&
                    activeAuthChannel === 'email' &&
                    isGoogleOAuthConfigured() &&
                    conflictAuthPath !== 'phone' ? (
                      <>
                        <OrDivider />
                        <AuthOAuthButtons googleLoading={googleLoading} onGoogleClick={handleGoogleLogin} />
                      </>
                    ) : null}
                  </div>
                ) : null
              }
              onSignInEmail={startSoftSignInEmail}
              onSignInPhone={startSoftSignInPhone}
              onGoogleSignIn={handleGoogleLogin}
              onConflictEmailAccount={startConflictEmailAccount}
              onConflictPhoneAccount={startConflictPhoneAccount}
              onContinueAsGuest={handleContinueAsGuest}
            />
          ) : null}
        </div>
      ) : !isAuthenticated ? (
        <div className="space-y-5">
          {step === 'identifier' ? (
            !smsEnabled && !emailEnabled ? (
              <p className="text-sm text-destructive" role="alert">
                {ta('otpChannelsDisabled')}
              </p>
            ) : smsEnabled && emailEnabled && !channelLocked ? (
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
            ) : null
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
                        placeholder={phonePlaceholderForPolicy(marketSettings.authPhonePolicy)}
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
                    maxLength={6}
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
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={code.length < 6 || submitting}
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
                marketRegion={marketRegion}
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

          {step === 'identifier' &&
          isGoogleOAuthConfigured() &&
          (!conflictAuthPath || conflictAuthPath === 'email') ? (
            <>
              <OrDivider />
              <AuthOAuthButtons googleLoading={googleLoading} onGoogleClick={handleGoogleLogin} />
            </>
          ) : null}
        </div>
      ) : null}

      {showBillingSlot ? billingSlot : null}

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
