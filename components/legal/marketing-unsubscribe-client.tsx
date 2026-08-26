'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

export function MarketingUnsubscribeClient() {
  const t = useTranslations('marketingConsent')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(t('unsubscribeMissingToken'))
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(
          `/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`,
          { cache: 'no-store' },
        )
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean
          message?: string
        }
        if (cancelled) return
        if (res.ok && data.ok) {
          setStatus('ok')
          setMessage(t('unsubscribeSuccess'))
        } else {
          setStatus('error')
          setMessage(data.message || t('unsubscribeError'))
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage(t('unsubscribeError'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, t])

  return (
    <div className={cn(siteContentShellClassName, 'py-16')}>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="mb-4 font-serif text-2xl font-bold text-foreground">
          {t('unsubscribeTitle')}
        </h1>
        <p className="text-muted-foreground">
          {status === 'loading' ? t('unsubscribeLoading') : message}
        </p>
      </div>
    </div>
  )
}
