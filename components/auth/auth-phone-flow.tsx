'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, LogOut, Mail, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { AuthOAuthButtons } from '@/components/auth/auth-oauth-buttons'
import { AuthConsentNotice } from '@/components/auth/auth-consent-notice'
import { FieldHint, OrDivider, RequiredLabel } from '@/components/auth/auth-form-ui'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  sendAuthEmailCode,
  sendAuthSmsCode,
  verifyAuthEmailCode,
  verifyAuthSmsCode,
} from '@/lib/checkout-customer-lookup'
import { startGoogleOAuth } from '@/lib/auth/google-oauth-client'
import { isGoogleOAuthConfigured } from '@/lib/auth/google-oauth'
import { useOAuthReturn, type OAuthReturnPayload } from '@/lib/auth/use-oauth-return'
import { cn } from '@/lib/utils'
import { isValidEmail, sanitizeEmail } from '@/lib/validation/register-form'
import { useRouter } from '@/i18n/navigation'
import {
  formatPhoneDisplay,
  sanitizeCheckoutPhoneInput,
} from '@/lib/validation/auth-phone-form'
import {
  DEFAULT_MARKET_SETTINGS,
  isOtpChannelEnabled,
  phoneErrorForPolicy,
  phonePlaceholderForPolicy,
  type OtpPurpose,
  type MarketSettings,
} from '@/lib/settings/market'
import { fetchPublicSiteSettingsFromApiRoute, getMarketSettings } from '@/lib/settings/fetch'

type AuthChannel = 'phone' | 'email'
type AuthStep = 'identifier' | 'otp'

const phoneLeadingIcon = <Phone className="h-4 w-4" />
const emailLeadingIcon = <Mail className="h-4 w-4" />

async function createPhoneSession(phone: string, verificationToken: string) {
  const res = await fetch('/api/auth/phone-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      phone: phone.trim(),
      verificationToken,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    user?: { email: string; role: 'admin' | 'customer' }
  }
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'SESSION_CREATE_FAILED')
  }
  return data.user
}

async function createEmailSession(email: string, verificationToken: string) {
  const res = await fetch('/api/auth/email-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      verificationToken,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    error?: string
    user?: { email: string; role: 'admin' | 'customer' }
  }
  if (!res.ok || !data.user) {
    throw new Error(data.error || 'SESSION_CREATE_FAILED')
  }
  return data.user
}

function getEmailError(
  email: string,
  messages: { required: string; invalid: string },
): string | null {
  if (!email.trim()) return messages.required
  if (!isValidEmail(email)) return messages.invalid
  return null
}

function pickDefaultChannel(
  smsEnabled: boolean,
  emailEnabled: boolean,
  preferEmail = false,
): AuthChannel | null {
  if (preferEmail) {
    if (emailEnabled) return 'email'
    if (smsEnabled) return 'phone'
    return null
  }
  if (smsEnabled) return 'phone'
  if (emailEnabled) return 'email'
  return null
}

export function AuthPhoneFlow({
  redirectTo,
  onSuccess,
  purpose = 'login',
  market: marketProp,
}: {
  redirectTo: string
  onSuccess: (target: string) => void
  purpose?: OtpPurpose
  market?: MarketSettings
}) {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const { user, setUser } = useSession()

  const [market, setMarket] = useState<MarketSettings>(marketProp ?? DEFAULT_MARKET_SETTINGS)
  const [marketReady, setMarketReady] = useState(Boolean(marketProp))

  const smsEnabled = isOtpChannelEnabled(market, 'sms', purpose)
  const emailEnabled = isOtpChannelEnabled(market, 'email', purpose)
  const preferEmail = market.region === 'sk'

  const [channel, setChannel] = useState<AuthChannel>(
    () => pickDefaultChannel(smsEnabled, emailEnabled, preferEmail) ?? 'email',
  )
  const [step, setStep] = useState<AuthStep>('identifier')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const isLoggedIn = Boolean(user)

  useEffect(() => {
    if (marketProp) {
      setMarket(marketProp)
      setMarketReady(true)
      return
    }
    let cancelled = false
    void fetchPublicSiteSettingsFromApiRoute().then((result) => {
      if (cancelled) return
      setMarket(getMarketSettings(result))
      setMarketReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [marketProp])

  useEffect(() => {
    if (!marketReady) return
    const next = pickDefaultChannel(smsEnabled, emailEnabled, market.region === 'sk')
    if (!next) return
    if (
      (channel === 'phone' && !smsEnabled) ||
      (channel === 'email' && !emailEnabled) ||
      (market.region === 'sk' && emailEnabled && channel === 'phone' && !smsEnabled)
    ) {
      setChannel(next)
      setStep('identifier')
      setCode('')
      setCodeError(null)
    } else if (
      market.region === 'sk' &&
      emailEnabled &&
      channel === 'phone' &&
      step === 'identifier'
    ) {
      // Prefer email tab on SK once market loaded
      setChannel('email')
    }
  }, [marketReady, smsEnabled, emailEnabled, channel, market.region, step])

  const phoneError = phoneErrorForPolicy(phone, market.authPhonePolicy)
  const emailError = getEmailError(email, {
    required: tc('requiredField'),
    invalid: tc('invalidEmail'),
  })
  const identifier =
    channel === 'phone' ? phone.trim() : email.trim().toLowerCase()
  const mapAuthError = (e: unknown, fallbackKey: 'sendCodeFailed' | 'signInError' | 'sessionCreateFailed') => {
    if (e instanceof Error) {
      if (e.message === 'SESSION_CREATE_FAILED') return tc('sessionCreateFailed')
      if (e.message && !e.message.startsWith('SESSION_')) return e.message
    }
    return tc(fallbackKey)
  }

  const channelCount = useMemo(() => {
    let n = 0
    if (smsEnabled) n += 1
    if (emailEnabled) n += 1
    return n
  }, [smsEnabled, emailEnabled])

  const resetFlow = useCallback(() => {
    setStep('identifier')
    setCode('')
    setCodeError(null)
    setSubmitting(false)
  }, [])

  const handleChannelChange = (value: string) => {
    setChannel(value as AuthChannel)
    setPhoneTouched(false)
    setEmailTouched(false)
    resetFlow()
  }

  const completeGoogleAuth = useCallback(
    (payload: OAuthReturnPayload) => {
      setUser(payload.user)
      if (payload.user.phone) setPhone(payload.user.phone)
      if (payload.user.email) setEmail(payload.user.email)
      router.refresh()
      onSuccess(redirectTo)
    },
    [onSuccess, redirectTo, router, setUser],
  )

  useOAuthReturn(completeGoogleAuth)

  const handleGoogleLogin = () => {
    if (googleLoading || isLoggedIn) return
    if (!isGoogleOAuthConfigured()) {
      toast.error(tc('googleSignInUnavailable'))
      return
    }
    setGoogleLoading(true)
    startGoogleOAuth(redirectTo, 'login')
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
        await sendAuthSmsCode(phone, purpose)
        toast.success(tc('codeSentSms'))
      } else {
        await sendAuthEmailCode(email, purpose)
        toast.success(tc('codeSentEmail'))
      }
      setStep('otp')
      setCode('')
    } catch (e) {
      toast.error(mapAuthError(e, 'sendCodeFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async () => {
    if (code.length < 6) return

    setSubmitting(true)
    setCodeError(null)
    try {
      if (channel === 'phone') {
        const { verificationToken } = await verifyAuthSmsCode(phone, code, purpose)
        const sessionUser = await createPhoneSession(phone, verificationToken)
        setUser(sessionUser)
      } else {
        const { verificationToken } = await verifyAuthEmailCode(email, code, purpose)
        const sessionUser = await createEmailSession(email, verificationToken)
        setUser(sessionUser)
      }

      router.refresh()
      onSuccess(redirectTo)
      toast.success(tc('welcome'))
    } catch (e) {
      setCodeError(mapAuthError(e, 'signInError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setSubmitting(true)
    setCodeError(null)
    try {
      if (channel === 'phone') {
        await sendAuthSmsCode(phone, purpose)
        toast.success(tc('codeSentSms'))
      } else {
        await sendAuthEmailCode(email, purpose)
        toast.success(tc('codeSentEmail'))
      }
      setCode('')
    } catch (e) {
      setCodeError(mapAuthError(e, 'sendCodeFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* best-effort */
    }
    setUser(null)
    setPhone('')
    setEmail('')
    setPhoneTouched(false)
    setEmailTouched(false)
    resetFlow()
    router.refresh()
    toast.success(tc('loggedOut'))
  }

  const displayName =
    user?.firstName || user?.lastName
      ? [user.lastName, user.firstName].filter(Boolean).join(' ')
      : null

  if (isLoggedIn && user) {
    return (
      <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
        <div>
          {displayName && (
            <p className="font-serif text-lg font-semibold text-foreground">{displayName}</p>
          )}
          {channel === 'phone' && phone && (
            <p className="mt-1 text-sm text-muted-foreground">{formatPhoneDisplay(phone)}</p>
          )}
          {user.email && (
            <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {tc('logout')}
        </Button>
      </div>
    )
  }

  if (marketReady && channelCount === 0) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {t('otpChannelsDisabled')}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <AuthOAuthButtons googleLoading={googleLoading} onGoogleClick={handleGoogleLogin} />
      <OrDivider />

      {channelCount > 1 ? (
        <Tabs value={channel} onValueChange={handleChannelChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            {smsEnabled ? <TabsTrigger value="phone">{tc('phoneTab')}</TabsTrigger> : null}
            {emailEnabled ? <TabsTrigger value="email">Email</TabsTrigger> : null}
          </TabsList>
        </Tabs>
      ) : null}

      {step === 'identifier' ? (
        <div className="space-y-4">
          {channel === 'phone' && smsEnabled ? (
            <div className="space-y-2">
              <RequiredLabel htmlFor="auth-phone">{tc('phoneNumber')}</RequiredLabel>
              <InputWithClear
                id="auth-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={phonePlaceholderForPolicy(market.authPhonePolicy)}
                leadingIcon={phoneLeadingIcon}
                className={cn(phoneTouched && phoneError && 'border-destructive/80 ring-destructive/30')}
                value={phone}
                onBlur={() => setPhoneTouched(true)}
                onChange={(e) => setPhone(sanitizeCheckoutPhoneInput(e.target.value))}
                onClear={() => setPhone('')}
              />
              <FieldHint
                id="auth-phone-error"
                show={phoneTouched}
                message={phoneError}
              />
            </div>
          ) : null}

          {channel === 'email' && emailEnabled ? (
            <div className="space-y-2">
              <RequiredLabel htmlFor="auth-email">Email</RequiredLabel>
              <InputWithClear
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                leadingIcon={emailLeadingIcon}
                className={cn(emailTouched && emailError && 'border-destructive/80 ring-destructive/30')}
                value={email}
                onBlur={() => setEmailTouched(true)}
                onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                onClear={() => setEmail('')}
              />
              <FieldHint
                id="auth-email-error"
                show={emailTouched}
                message={emailError}
              />
            </div>
          ) : null}

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={submitting || !marketReady}
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
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {channel === 'phone' ? (
              <>
                {tc('codeSentToPhone', { phone: formatPhoneDisplay(identifier) })}
              </>
            ) : (
              <>
                {tc('codeSentToEmail', { email: identifier })}
              </>
            )}
          </p>

          <div className="space-y-3">
            <Label htmlFor="auth-code">
              {channel === 'phone' ? tc('codeFromSms') : tc('codeFromEmail')}
            </Label>
            <InputOTP
              id="auth-code"
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
            <p className="text-xs text-muted-foreground">{tc('enterFourDigitCode')}</p>
            {codeError && (
              <p className="text-xs text-destructive" role="alert">
                {codeError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={code.length < 6 || submitting}
                onClick={handleVerify}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tc('verifying')}
                  </>
                ) : (
                  tc('signIn')
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={submitting}
                onClick={handleResend}
              >
                {tc('resend')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={submitting}
                onClick={resetFlow}
              >
                {channel === 'phone' ? tc('changePhone') : tc('changeEmail')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AuthConsentNotice text={market.authConsentText} />
    </div>
  )
}
