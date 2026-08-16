'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Gift } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import {
  AccountPageEmpty,
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { fetchMyReferralSummary } from '@/lib/referrals/api'
import type { MyReferralSummary } from '@/lib/referrals/types'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { cn } from '@/lib/utils'

export function AccountReferralsContent() {
  const t = useTranslations('account')
  const locale = useLocale()

  const [data, setData] = useState<MyReferralSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchMyReferralSummary()
      .then((summary) => {
        if (!cancelled) setData(summary)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : t('loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken, t])

  if (loading) {
    return <AccountPageLoading />
  }

  if (error) {
    return (
      <AccountPageError message={error} onRetry={() => setReloadToken((n) => n + 1)} />
    )
  }

  if (!data?.eligible || !data.program?.isActive) {
    return (
      <AccountPageEmpty
        icon={Gift}
        title={t('referralsUnavailableTitle')}
        body={t('referralsUnavailableBody')}
      />
    )
  }

  const shareUrl =
    typeof window !== 'undefined' && data.sharePath
      ? `${window.location.origin}${data.sharePath}`
      : data.sharePath

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-10">
      <section className="max-w-xl space-y-4">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t('referralsBalanceLabel')}</p>
            <p className="font-serif text-3xl font-bold text-foreground sm:text-4xl">{data.balance}</p>
          </div>
          {data.program.referrerPoints > 0 ? (
            <p className="max-w-none text-sm text-muted-foreground sm:max-w-[14rem] sm:text-right">
              {t('referralsEarnHint', { points: data.program.referrerPoints })}
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">{t('referralsShareLabel')}</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={shareUrl ?? data.code ?? ''}
              className="h-11 min-w-0 flex-1 rounded-md border border-border bg-input px-3 text-sm text-foreground"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyLink()}
              className="min-h-11 w-full shrink-0 sm:w-auto"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t('referralsCopied') : t('referralsCopy')}
            </Button>
          </div>
          {data.code ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('referralsCodeLabel')}: <span className="font-mono">{data.code}</span>
            </p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-semibold text-foreground">{t('referralsHistoryTitle')}</h2>
        {data.ledger.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('referralsHistoryEmpty')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60">
            {data.ledger.map((entry) => (
              <li
                key={entry.id}
                className={cn('flex items-center justify-between gap-4 py-3 text-sm')}
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-foreground">{entry.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(entry.createdAt, locale, 'datetime')}
                  </p>
                </div>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    entry.delta >= 0 ? 'text-primary' : 'text-destructive',
                  )}
                >
                  {entry.delta >= 0 ? '+' : ''}
                  {entry.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
