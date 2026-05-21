'use client'

import { useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'

import { AuthBackButton } from '@/components/auth/auth-back-button'
import { BrandLogo } from '@/components/brand-logo'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { safeAuthRedirect } from '@/lib/auth/redirect'
import { cn } from '@/lib/utils'
import {
  getLoginFieldError,
  isLoginFormValid,
  sanitizeEmail,
  type LoginFieldKey,
  type LoginFormValues,
} from '@/lib/validation/login-form'

const authInputClassName =
  'border-border/90 bg-background shadow-sm ring-1 ring-border/70 focus-visible:border-primary focus-visible:ring-primary/25'

function RequiredLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <Label htmlFor={htmlFor} className="gap-0.5">
      {children}
      <span className="text-destructive" aria-hidden="true">
        {' '}
        *
      </span>
    </Label>
  )
}

function FieldHint({
  id,
  show,
  message,
}: {
  id: string
  show: boolean
  message: string | null
}) {
  if (!show || !message) return null
  return (
    <p id={id} role="alert" className="text-xs leading-snug text-destructive">
      {message}
    </p>
  )
}

function LoginForm() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useSession()
  const redirectTo = safeAuthRedirect(searchParams.get('redirect'))
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginFormValues>({
    email: '',
    password: '',
    remember: false,
  })
  const [touched, setTouched] = useState<Partial<Record<LoginFieldKey, boolean>>>({})

  const canSubmit = useMemo(() => isLoginFormValid(formData), [formData])

  const markTouched = (field: LoginFieldKey) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }))
  }

  const showFieldError = (field: LoginFieldKey) =>
    Boolean(touched[field] && getLoginFieldError(field, formData))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    setTouched({ email: true, password: true })
    if (!canSubmit || isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        user?: { email: string; role: 'admin' | 'customer' }
      }

      if (!res.ok) {
        setError(data.error || t('errorInvalid'))
        setIsLoading(false)
        return
      }

      if (data.user) {
        setUser(data.user)
      }

      let target =
        data.user?.role === 'admin'
          ? redirectTo.startsWith('/admin')
            ? redirectTo
            : '/admin'
          : redirectTo

      if (data.user?.role === 'customer' && target.startsWith('/admin')) {
        target = '/account'
      }

      router.push(target)
      router.refresh()
    } catch {
      setError(t('errorServer'))
    } finally {
      setIsLoading(false)
    }
  }

  const registerHref =
    redirectTo !== '/'
      ? `/auth/register?redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/register'

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col overflow-x-hidden lg:flex-row">
      <div className="hidden flex-1 items-center justify-center bg-primary p-12 lg:flex">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 flex justify-center">
            <BrandLogo
              alt={tc('brand')}
              variant="onDark"
              width={180}
              height={56}
              imgClassName="max-h-16 w-auto md:max-h-20"
            />
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold">{t('welcomeTitle')}</h2>
          <p className="mb-8 text-lg opacity-90">{t('welcomeBody')}</p>
          <div className="flex justify-center gap-8 text-sm opacity-80">
            <div>
              <p className="text-2xl font-bold">170+</p>
              <p>сортів рослин</p>
            </div>
            <div>
              <p className="text-2xl font-bold">5000+</p>
              <p>клієнтів</p>
            </div>
            <div>
              <p className="text-2xl font-bold">14</p>
              <p>років досвіду</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 opacity-5" aria-hidden>
          <div className="absolute top-16 left-6 h-48 w-48 rounded-full bg-primary blur-3xl sm:left-10 sm:h-64 sm:w-64" />
          <div className="absolute right-6 bottom-16 h-56 w-56 rounded-full bg-primary blur-3xl sm:right-10 sm:h-80 sm:w-80" />
        </div>

        <div className="relative flex flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:justify-center lg:px-8 lg:py-12 xl:px-12">
          <div className="mx-auto w-full min-w-0 max-w-sm">
            <AuthBackButton fallbackHref={redirectTo} className="mb-4" />

            <div className="mb-6 flex justify-center sm:mb-8">
              <Link href="/" className="inline-flex">
                <BrandLogo
                  alt={tc('brand')}
                  width={220}
                  height={72}
                  className="justify-center"
                  imgClassName="max-h-14 w-auto object-center sm:max-h-16 sm:max-w-[min(260px,78vw)]"
                />
              </Link>
            </div>

            <div className="mb-6 text-center sm:mb-8">
              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
                {t('loginTitle')}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">{t('loginSubtitle')}</p>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{t('loginHint')}</p>
            </div>

            {error && (
              <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              <div className="space-y-2">
                <RequiredLabel htmlFor="email">{t('email')}</RequiredLabel>
                <div>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t('emailPlaceholder')}
                    className={cn(
                      authInputClassName,
                      showFieldError('email') && 'border-destructive/80 ring-destructive/30'
                    )}
                    aria-invalid={showFieldError('email')}
                    aria-describedby={showFieldError('email') ? 'email-error' : undefined}
                    value={formData.email}
                    onBlur={() => markTouched('email')}
                    onChange={(e) =>
                      setFormData({ ...formData, email: sanitizeEmail(e.target.value) })
                    }
                  />
                  <FieldHint
                    id="email-error"
                    show={Boolean(touched.email)}
                    message={getLoginFieldError('email', formData)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <RequiredLabel htmlFor="password">{t('password')}</RequiredLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="shrink-0 text-sm text-primary hover:underline"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('passwordPlaceholder')}
                      className={cn(
                        authInputClassName,
                        'pr-10',
                        showFieldError('password') && 'border-destructive/80 ring-destructive/30'
                      )}
                      aria-invalid={showFieldError('password')}
                      aria-describedby={
                        showFieldError('password') ? 'password-error' : undefined
                      }
                      value={formData.password}
                      onBlur={() => markTouched('password')}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Приховати пароль' : 'Показати пароль'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldHint
                    id="password-error"
                    show={Boolean(touched.password)}
                    message={getLoginFieldError('password', formData)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, remember: checked === true })
                  }
                  className="size-5 shrink-0 border-2 border-border bg-background shadow-sm data-[state=checked]:border-primary"
                />
                <Label htmlFor="remember" className="cursor-pointer text-sm font-normal">
                  {t('remember')}
                </Label>
              </div>

              <Button
                type="submit"
                size="lg"
                className={cn(
                  'w-full shadow-md transition-all',
                  (!canSubmit || isLoading) &&
                    'translate-y-px opacity-45 shadow-inner saturate-50'
                )}
                disabled={!canSubmit || isLoading}
                aria-disabled={!canSubmit || isLoading}
              >
                {isLoading ? t('submitting') : t('submit')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-8">
              {t('noAccount')}{' '}
              <Link href={registerHref} className="font-medium text-primary hover:underline">
                {t('register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] min-h-screen items-center justify-center bg-gradient-to-br from-secondary via-background to-accent">
          <BrandLogo
            alt="Зелені Янголи"
            className="animate-pulse"
            imgClassName="max-h-10 opacity-60"
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
