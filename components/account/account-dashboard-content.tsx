'use client'

import { useEffect, useState } from 'react'
import { Heart, Loader2, MessageSquare, Package, Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'

import { fetchAccountDashboard, type AccountDashboardStats } from '@/lib/account/api'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function AccountDashboardContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetchAccountDashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : t('loadError')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ key, label, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className={cn(
            'pressable rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 font-serif text-3xl font-bold text-foreground">
                {stats?.[key] ?? 0}
              </p>
            </div>
            <Icon className="h-5 w-5 shrink-0 text-primary/70" />
          </div>
        </Link>
      ))}
    </div>
  )
}
