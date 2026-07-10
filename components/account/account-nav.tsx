'use client'

import {
  Bell,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { usePathname } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/account', labelKey: 'dashboard', icon: LayoutDashboard, exact: true },
  { href: '/account/orders', labelKey: 'orders', icon: Package },
  { href: '/account/favorites', labelKey: 'favorites', icon: Heart },
  { href: '/account/settings', labelKey: 'settings', icon: Settings },
  { href: '/account/reviews', labelKey: 'reviews', icon: MessageSquare },
  { href: '/account/notifications', labelKey: 'notifications', icon: Bell },
] as const

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AccountNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const t = useTranslations('account')

  return (
    <nav className={cn('space-y-1', className)} aria-label={t('navLabel')}>
      {NAV_ITEMS.map((item) => {
        const { href, labelKey, icon: Icon } = item
        const exact = 'exact' in item ? item.exact : undefined
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'pressable flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-muted hover:text-primary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {t(labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
