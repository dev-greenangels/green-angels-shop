'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Lock } from 'lucide-react'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { cn } from '@/lib/utils'
import { isValidEmail } from '@/lib/validation/register-form'

export function BackstageLoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter()
  const t = useTranslations('pages.login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email.trim())) {
      setError(t('invalidEmail'))
      return
    }
    if (!password) {
      setError(t('passwordRequired'))
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/backstage/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || t('loginFailed'))
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError(t('connectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <RequiredLabel htmlFor="backstage-email">Email</RequiredLabel>
        <InputWithClear
          id="backstage-email"
          type="email"
          autoComplete="username"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onClear={() => setEmail('')}
        />
      </div>

      <div className="space-y-2">
        <RequiredLabel htmlFor="backstage-password">{t('passwordLabel')}</RequiredLabel>
        <InputWithClear
          id="backstage-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onClear={() => setPassword('')}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('loggingIn')}
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            {t('submit')}
          </>
        )}
      </Button>

      <p className={cn('text-center text-xs text-muted-foreground')}>{t('staffOnlyHint')}</p>
    </form>
  )
}
