'use client'

import { useCallback, useState } from 'react'
import { Loader2, LogOut, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

import { AuthOAuthButtons } from '@/components/auth/auth-oauth-buttons'
import { FieldHint, OrDivider, RequiredLabel } from '@/components/auth/auth-form-ui'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  sendAuthEmailCode,
  sendCheckoutSmsCode,
  verifyAuthEmailCode,
  verifyCheckoutSmsCode,
} from '@/lib/checkout-customer-lookup'
import { startGoogleOAuth } from '@/lib/auth/google-oauth-client'
import { isGoogleOAuthConfigured } from '@/lib/auth/google-oauth'
import { useOAuthReturn } from '@/lib/auth/use-oauth-return'
import { cn } from '@/lib/utils'
import { isValidEmail, sanitizeEmail } from '@/lib/validation/register-form'
import { useRouter } from '@/i18n/navigation'
import {
  formatPhoneDisplay,
  sanitizeCheckoutPhoneInput,
} from '@/lib/validation/auth-phone-form'
import { isValidUkrPhone } from '@/lib/validation/checkout-form'

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
    throw new Error(data.error || 'Не вдалося створити сесію')
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
    throw new Error(data.error || 'Не вдалося створити сесію')
  }
  return data.user
}

function getPhoneError(phone: string): string | null {
  if (!phone.trim()) return 'Обовʼязкове поле'
  if (!isValidUkrPhone(phone)) return 'Введіть коректний український номер (+380)'
  return null
}

function getEmailError(email: string): string | null {
  if (!email.trim()) return 'Обовʼязкове поле'
  if (!isValidEmail(email)) return 'Невірний формат email'
  return null
}

export function AuthPhoneFlow({
  redirectTo,
  onSuccess,
}: {
  redirectTo: string
  onSuccess: (target: string) => void
}) {
  const router = useRouter()
  const { user, setUser } = useSession()

  const [channel, setChannel] = useState<AuthChannel>('phone')
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

  const phoneError = getPhoneError(phone)
  const emailError = getEmailError(email)
  const identifier =
    channel === 'phone' ? phone.trim() : email.trim().toLowerCase()

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
    (payload: {
      user: {
        email: string
        role: 'customer' | 'admin'
        firstName?: string | null
        lastName?: string | null
        phone?: string | null
      }
    }) => {
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
      toast.error(
        'Вхід через Google тимчасово недоступний. Налаштуйте NEXT_PUBLIC_GOOGLE_CLIENT_ID.',
      )
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
        await sendCheckoutSmsCode(phone)
        toast.success('Код надіслано SMS')
      } else {
        await sendAuthEmailCode(email)
        toast.success('Код надіслано на email')
      }
      setStep('otp')
      setCode('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не вдалося надіслати код')
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async () => {
    if (code.length < 4) return

    setSubmitting(true)
    setCodeError(null)
    try {
      if (channel === 'phone') {
        const { verificationToken } = await verifyCheckoutSmsCode(phone, code)
        const sessionUser = await createPhoneSession(phone, verificationToken)
        setUser(sessionUser)
      } else {
        const { verificationToken } = await verifyAuthEmailCode(email, code)
        const sessionUser = await createEmailSession(email, verificationToken)
        setUser(sessionUser)
      }

      router.refresh()
      onSuccess(redirectTo)
      toast.success('Вітаємо!')
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : 'Помилка входу')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setSubmitting(true)
    setCodeError(null)
    try {
      if (channel === 'phone') {
        await sendCheckoutSmsCode(phone)
        toast.success('Код надіслано SMS')
      } else {
        await sendAuthEmailCode(email)
        toast.success('Код надіслано на email')
      }
      setCode('')
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : 'Не вдалося надіслати код')
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
    toast.success('Ви вийшли')
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
          Вийти
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AuthOAuthButtons googleLoading={googleLoading} onGoogleClick={handleGoogleLogin} />
      <OrDivider />

      <Tabs value={channel} onValueChange={handleChannelChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phone">Телефон</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
      </Tabs>

      {step === 'identifier' ? (
        <div className="space-y-4">
          {channel === 'phone' ? (
            <div className="space-y-2">
              <RequiredLabel htmlFor="auth-phone">Номер телефону</RequiredLabel>
              <InputWithClear
                id="auth-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+380 XX XXX XX XX"
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
          ) : (
            <div className="space-y-2">
              <RequiredLabel htmlFor="auth-email">Email</RequiredLabel>
              <InputWithClear
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ваш@email.com"
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
          )}

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={submitting}
            onClick={handleContinue}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Надсилання…
              </>
            ) : (
              'Продовжити'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {channel === 'phone' ? (
              <>
                Код надіслано на{' '}
                <span className="font-medium text-foreground">{formatPhoneDisplay(identifier)}</span>
              </>
            ) : (
              <>
                Код надіслано на{' '}
                <span className="font-medium text-foreground">{identifier}</span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <Label htmlFor="auth-code">
              {channel === 'phone' ? 'Код з SMS' : 'Код з email'}
            </Label>
            <InputOTP
              id="auth-code"
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
            <p className="text-xs text-muted-foreground">Введіть 4-значний код</p>
            {codeError && (
              <p className="text-xs text-destructive" role="alert">
                {codeError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={code.length < 4 || submitting}
                onClick={handleVerify}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Перевірка…
                  </>
                ) : (
                  'Увійти'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={submitting}
                onClick={handleResend}
              >
                Надіслати ще раз
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={submitting}
                onClick={resetFlow}
              >
                Змінити {channel === 'phone' ? 'номер' : 'email'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
