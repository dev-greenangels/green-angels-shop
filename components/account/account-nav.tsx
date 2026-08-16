'use client'

import {
  Bell,
  Gift,
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
  { href: '/account/referrals', labelKey: 'referrals', icon: Gift },
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
    <nav
      className={cn(
        'flex gap-1 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:space-y-0.5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden',
        className,
      )}
      aria-label={t('navLabel')}
    >
      {NAV_ITEMS.map((item) => {
        const { href, labelKey, icon: Icon } = item
        const exact = 'exact' in item ? item.exact : undefined
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'pressable flex min-h-11 shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors lg:gap-3',
              active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{t(labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
