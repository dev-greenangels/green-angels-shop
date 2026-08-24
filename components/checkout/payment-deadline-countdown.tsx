'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function formatAbsolute(iso: string, locale: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export function PaymentDeadlineCountdown({
  paymentExpiresAt,
}: {
  paymentExpiresAt?: string | null
}) {
  const t = useTranslations('checkout.stripe')
  const locale = useLocale()
  const expiresMs = useMemo(() => {
    if (!paymentExpiresAt) return null
    const ms = new Date(paymentExpiresAt).getTime()
    return Number.isNaN(ms) ? null : ms
  }, [paymentExpiresAt])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (expiresMs == null) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiresMs])

  if (expiresMs == null) return null

  const absolute = paymentExpiresAt ? formatAbsolute(paymentExpiresAt, locale) : null
  const remainingMs = Math.max(0, expiresMs - now)
  const remaining = formatRemaining(remainingMs)
  const expired = remainingMs <= 0

  return (
    <div className="rounded-md border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <p className="font-medium tabular-nums">
        {expired ? t('deadlineExpired') : t('deadlineRemaining', { time: remaining })}
      </p>
      {absolute ? (
        <p className="mt-0.5 text-xs opacity-90">{t('deadline', { time: absolute })}</p>
      ) : null}
      <p className="mt-1 text-xs opacity-90">{t('deadlineHint')}</p>
    </div>
  )
}
