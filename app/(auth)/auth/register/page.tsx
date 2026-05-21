'use client'

import { useCallback, useMemo, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AuthBackButton } from '@/components/auth/auth-back-button'
import { BrandLogo } from '@/components/brand-logo'
import { safeAuthRedirect } from '@/lib/auth/redirect'
import { cn } from '@/lib/utils'
import {
  formatPhoneDisplay,
  getRegisterFieldError,
  isRegisterFormValid,
  sanitizeCyrillicName,
  sanitizeEmail,
  sanitizePhoneInput,
  type RegisterFieldKey,
  type RegisterFormValues,
} from '@/lib/validation/register-form'

const registerInputClassName =
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

const initialFormData: RegisterFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeAuthRedirect(searchParams.get('redirect'))
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  const movePhoneCursorToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      const el = phoneInputRef.current
      if (!el) return
      const end = el.value.length
      el.setSelectionRange(end, end)
    })
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RegisterFormValues>(initialFormData)
  const [touched, setTouched] = useState<Partial<Record<RegisterFieldKey, boolean>>>({})

  const canSubmit = useMemo(() => isRegisterFormValid(formData), [formData])

  const markTouched = (field: RegisterFieldKey) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }))
  }

  const showError = (field: RegisterFieldKey) =>
    Boolean(touched[field] && getRegisterFieldError(field, formData))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isLoading) return

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    })

    if (!isRegisterFormValid(formData)) return

    setIsLoading(true)

    // Simulate registration - in real app, this would call an API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    router.push(redirectTo)
    setIsLoading(false)
  }

  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col overflow-x-hidden lg:flex-row">
      <div className="hidden flex-1 items-center justify-center bg-primary p-12 lg:flex">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 flex justify-center">
            <BrandLogo
              alt="Зелені Янголи"
              variant="onDark"
              width={180}
              height={56}
              imgClassName="max-h-16 w-auto md:max-h-20"
            />
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold">Приєднуйтесь до нас</h2>
          <p className="mb-8 text-lg opacity-90">
            Створіть акаунт, щоб отримувати персональні рекомендації, відстежувати
            замовлення та зберігати улюблені рослини.
          </p>
          <div className="space-y-4 rounded-xl bg-primary-foreground/10 p-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold">
                1
              </div>
              <span>Історія всіх ваших замовлень</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold">
                2
              </div>
              <span>Персональні знижки та акції</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-bold">
                3
              </div>
              <span>Швидке оформлення замовлень</span>
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
                  alt="Зелені Янголи"
                  width={220}
                  height={72}
                  className="justify-center"
                  imgClassName="max-h-14 w-auto object-center sm:max-h-16 sm:max-w-[min(260px,78vw)]"
                />
              </Link>
            </div>

            <div className="mb-6 text-center sm:mb-8">
              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
                Реєстрація
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Створіть акаунт для зручних покупок
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="firstName">Ім&apos;я</RequiredLabel>
                  <div>
                  <Input
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="введіть ім'я.."
                    className={cn(
                      registerInputClassName,
                      showError('firstName') && 'border-destructive/80 ring-destructive/30'
                    )}
                    aria-invalid={showError('firstName')}
                    aria-describedby={showError('firstName') ? 'firstName-error' : undefined}
                    value={formData.firstName}
                    onBlur={() => markTouched('firstName')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstName: sanitizeCyrillicName(e.target.value),
                      })
                    }
                  />
                  <FieldHint
                    id="firstName-error"
                    show={Boolean(touched.firstName)}
                    message={getRegisterFieldError('firstName', formData)}
                  />
                  </div>
                </div>

                <div className="space-y-2">
                  <RequiredLabel htmlFor="lastName">Прізвище</RequiredLabel>
                  <div>
                  <Input
                    id="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="введіть прізвище.."
                    className={cn(
                      registerInputClassName,
                      showError('lastName') && 'border-destructive/80 ring-destructive/30'
                    )}
                    aria-invalid={showError('lastName')}
                    aria-describedby={showError('lastName') ? 'lastName-error' : undefined}
                    value={formData.lastName}
                    onBlur={() => markTouched('lastName')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastName: sanitizeCyrillicName(e.target.value),
                      })
                    }
                  />
                  <FieldHint
                    id="lastName-error"
                    show={Boolean(touched.lastName)}
                    message={getRegisterFieldError('lastName', formData)}
                  />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ваш@email.com"
                  className={cn(
                    registerInputClassName,
                    showError('email') && 'border-destructive/80 ring-destructive/30'
                  )}
                  aria-invalid={showError('email')}
                  aria-describedby={showError('email') ? 'email-error' : undefined}
                  value={formData.email}
                  onBlur={() => markTouched('email')}
                  onChange={(e) =>
                    setFormData({ ...formData, email: sanitizeEmail(e.target.value) })
                  }
                />
                <FieldHint
                  id="email-error"
                  show={Boolean(touched.email)}
                  message={getRegisterFieldError('email', formData)}
                />
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="phone">Телефон</RequiredLabel>
                <div>
                <Input
                  ref={phoneInputRef}
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+380 00 000 0000"
                  className={cn(
                    registerInputClassName,
                    showError('phone') && 'border-destructive/80 ring-destructive/30'
                  )}
                  aria-invalid={showError('phone')}
                  aria-describedby={showError('phone') ? 'phone-error' : undefined}
                  value={formatPhoneDisplay(formData.phone)}
                  onFocus={movePhoneCursorToEnd}
                  onClick={movePhoneCursorToEnd}
                  onBlur={() => markTouched('phone')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: sanitizePhoneInput(e.target.value),
                    })
                  }
                />
                <FieldHint
                  id="phone-error"
                  show={Boolean(touched.phone)}
                  message={getRegisterFieldError('phone', formData)}
                />
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="password">Пароль</RequiredLabel>
                <div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Мінімум 8 символів"
                    className={cn(
                      registerInputClassName,
                      'pr-10',
                      showError('password') && 'border-destructive/80 ring-destructive/30'
                    )}
                    aria-invalid={showError('password')}
                    aria-describedby={showError('password') ? 'password-error' : undefined}
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
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldHint
                  id="password-error"
                  show={Boolean(touched.password)}
                  message={getRegisterFieldError('password', formData)}
                />
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="confirmPassword">Підтвердіть пароль</RequiredLabel>
                <div>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Повторіть пароль"
                    className={cn(
                      registerInputClassName,
                      'pr-10',
                      showError('confirmPassword') && 'border-destructive/80 ring-destructive/30'
                    )}
                    aria-invalid={showError('confirmPassword')}
                    aria-describedby={
                      showError('confirmPassword') ? 'confirmPassword-error' : undefined
                    }
                    value={formData.confirmPassword}
                    onBlur={() => markTouched('confirmPassword')}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Приховати пароль' : 'Показати пароль'}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldHint
                  id="confirmPassword-error"
                  show={Boolean(touched.confirmPassword)}
                  message={getRegisterFieldError('confirmPassword', formData)}
                />
                </div>
              </div>

              <div>
              <label
                htmlFor="terms"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm transition-colors hover:bg-card/90 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/30"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    markTouched('agreeTerms')
                  }
                }}
              >
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center pt-0.5">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreeTerms: checked === true })
                    }
                    className="h-5 w-5 min-h-5 min-w-5 border-2 border-border bg-background shadow-sm data-[state=checked]:border-primary"
                  />
                </span>
                <span className="text-sm leading-relaxed text-foreground/90">
                  <span className="font-medium text-foreground">
                    Я погоджуюсь
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  </span>{' '}
                  з{' '}
                  <Link
                    href="/terms"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    умовами використання
                  </Link>{' '}
                  та{' '}
                  <Link
                    href="/terms"
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    політикою конфіденційності
                  </Link>
                  .
                </span>
              </label>
              <FieldHint
                id="agreeTerms-error"
                show={Boolean(touched.agreeTerms)}
                message={getRegisterFieldError('agreeTerms', formData)}
              />
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
                {isLoading ? 'Реєстрація...' : 'Зареєструватися'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-8">
              Вже маєте акаунт?{' '}
              <Link
                href={`/auth/login${redirectTo !== '/' ? `?redirect=${redirectTo}` : ''}`}
                className="font-medium text-primary hover:underline"
              >
                Увійти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
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
      <RegisterForm />
    </Suspense>
  )
}
