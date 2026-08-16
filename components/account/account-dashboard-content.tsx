'use client'

import { useEffect, useState } from 'react'
import { Gift, Heart, MessageSquare, Package, Bell, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

import {
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { fetchAccountDashboard, type AccountDashboardStats } from '@/lib/account/api'
import { fetchMyReferralSummary } from '@/lib/referrals/api'
import type { MyReferralSummary } from '@/lib/referrals/types'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function AccountDashboardContent() {
  const t = useTranslations('account')

  const cards: Array<{
    key: keyof AccountDashboardStats
    label: string
    href: string
    icon: LucideIcon
  }> = [
    { key: 'ordersCount', label: t('cards.orders'), href: '/account/orders', icon: Package },
    { key: 'favoritesCount', label: t('cards.favorites'), href: '/account/favorites', icon: Heart },
    { key: 'reviewsCount', label: t('cards.reviews'), href: '/account/reviews', icon: MessageSquare },
    {
      key: 'notificationsCount',
      label: t('cards.notifications'),
      href: '/account/notifications',
      icon: Bell,
    },
  ]

  const [stats, setStats] = useState<AccountDashboardStats | null>(null)
  const [referral, setReferral] = useState<MyReferralSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void Promise.all([
      fetchAccountDashboard(),
      fetchMyReferralSummary().catch(() => null),
    ])
      .then(([dashboard, ref]) => {
        if (cancelled) return
        setStats(dashboard)
        setReferral(ref)
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

  const retry = () => setReloadToken((n) => n + 1)

  if (loading) {
    return <AccountPageLoading />
  }

  if (error || !stats) {
    return <AccountPageError message={error ?? t('loadError')} onRetry={retry} />
  }

  return (
    <div className="space-y-8">
      {referral?.eligible && referral.program?.isActive ? (
        <Link
          href="/account/referrals"
          className={cn(
            'pressable group relative block overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-secondary/90 to-card p-6 transition-shadow hover:shadow-md',
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-md">
              <div className="flex items-center gap-2 text-primary">
                <Gift className="h-5 w-5" />
                <span className="text-sm font-semibold">{t('cards.referrals')}</span>
              </div>
              <p className="mt-2 break-words font-serif text-xl font-bold text-foreground sm:text-2xl">
                {t('referralsBalanceLabel')}: {referral.balance}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('referralsSubtitle')}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5">
              {t('referralsOpen')}
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </Link>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            className={cn(
              'pressable group border-b border-border/70 py-4 transition-colors hover:border-primary/40',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 font-serif text-2xl font-bold text-foreground sm:text-3xl">
                  {stats[key] ?? 0}
                </p>
              </div>
              <Icon className="h-5 w-5 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border/60 pt-6 text-sm">
        <Link href="/account/settings" className="text-muted-foreground underline-offset-4 hover:underline">
          {t('settings')}
        </Link>
      </div>
    </div>
  )
}
