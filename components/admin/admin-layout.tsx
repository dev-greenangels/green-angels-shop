'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBasket,
  Users,
  FolderTree,
  Tags,
  SlidersHorizontal,
  FileText,
  MessageSquareQuote,
  Percent,
  Gift,
  Settings,
  Languages,
  Scale,
  ArrowRightLeft,
  Camera,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileUp,
  CalendarDays,
  Landmark,
  ScrollText,
  Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { BrandLogo } from '@/components/brand-logo'
import { BackstageContentLocaleSwitcher } from '@/components/backstage/backstage-content-locale'
import { BackstageUiLocaleSwitcher } from '@/components/backstage/backstage-ui-locale'
import { fetchWholesaleInquiriesNewCount } from '@/lib/backstage/wholesale-inquiries'
import { cn } from '@/lib/utils'
import type { BackstageSession } from '@/lib/backstage-auth/types'

const WHOLESALE_NEW_COUNT_EVENT = 'ga:wholesale-new-count-refresh'
const WHOLESALE_NEW_COUNT_POLL_MS = 60_000

type NavItem = {
  href: string
  labelKey: string
  icon: typeof LayoutDashboard
  matchPrefix?: string
}

type NavGroup = {
  id: string
  labelKey: string
  items: NavItem[]
}

const topNavItem: NavItem = {
  href: '/backstage',
  labelKey: 'overview',
  icon: LayoutDashboard,
}

const navGroups: NavGroup[] = [
  {
    id: 'catalog',
    labelKey: 'groupCatalog',
    items: [
      { href: '/backstage/categories', labelKey: 'categories', icon: FolderTree },
      { href: '/backstage/attributes', labelKey: 'attributes', icon: Tags },
      { href: '/backstage/characteristics', labelKey: 'characteristics', icon: SlidersHorizontal },
      {
        href: '/backstage/products',
        labelKey: 'products',
        icon: Package,
        matchPrefix: '/backstage/products',
      },
      { href: '/backstage/import', labelKey: 'import', icon: FileUp },
      { href: '/backstage/photos', labelKey: 'photos', icon: Camera },
    ],
  },
  {
    id: 'sales',
    labelKey: 'groupSales',
    items: [
      { href: '/backstage/orders', labelKey: 'orders', icon: ShoppingCart },
      { href: '/backstage/order-dictionaries', labelKey: 'orderDictionaries', icon: ClipboardList },
      {
        href: '/backstage/dispatch-calendar',
        labelKey: 'dispatchCalendar',
        icon: CalendarDays,
      },
      { href: '/backstage/carts', labelKey: 'carts', icon: ShoppingBasket },
      {
        href: '/backstage/users',
        labelKey: 'users',
        icon: Users,
        matchPrefix: '/backstage/users',
      },
      { href: '/backstage/promotions', labelKey: 'promotions', icon: Percent },
      { href: '/backstage/referrals', labelKey: 'referrals', icon: Gift },
    ],
  },
  {
    id: 'content',
    labelKey: 'groupContent',
    items: [
      { href: '/backstage/blog', labelKey: 'blog', icon: FileText },
      { href: '/backstage/legal', labelKey: 'legal', icon: ScrollText },
      { href: '/backstage/reviews', labelKey: 'reviews', icon: MessageSquareQuote },
      { href: '/backstage/wholesale-inquiries', labelKey: 'wholesaleInquiries', icon: Warehouse },
    ],
  },
  {
    id: 'site',
    labelKey: 'groupSite',
    items: [
      { href: '/backstage/localization', labelKey: 'localization', icon: Languages },
      { href: '/backstage/navigation', labelKey: 'navigation', icon: Menu },
      { href: '/backstage/redirects', labelKey: 'redirects', icon: ArrowRightLeft },
      { href: '/backstage/reference-data', labelKey: 'referenceData', icon: Scale },
      { href: '/backstage/tedb', labelKey: 'tedb', icon: Landmark },
    ],
  },
]

const settingsNavItem: NavItem = {
  href: '/backstage/settings',
  labelKey: 'settings',
  icon: Settings,
}

const allNavItems = [
  topNavItem,
  ...navGroups.flatMap((group) => group.items),
  settingsNavItem,
]

type NavLabelKey = (typeof allNavItems)[number]['labelKey']

interface AdminLayoutProps {
  children: React.ReactNode
  addClassName?: string
}

function isNavActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/backstage') return pathname === '/backstage'
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function SidebarFooter({
  employee,
  onLogout,
}: {
  employee: BackstageSession | null
  onLogout: () => void
}) {
  const t = useTranslations('common')

  return (
    <div className="mt-auto shrink-0 border-t border-sidebar-border p-4">
      {employee ? (
        <div className="mb-3 px-2 text-right">
          <p className="text-sm font-medium text-sidebar-foreground">
            {employee.firstName} {employee.lastName}
          </p>
          <p className="text-xs text-sidebar-foreground/60">{employee.email}</p>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-end gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
      >
        <LogOut className="h-5 w-5" />
        {t('logout')}
      </button>
    </div>
  )
}

function formatBadgeCount(count: number): string {
  return count > 99 ? '99+' : String(count)
}

function NavLink({
  item,
  pathname,
  badgeCount = 0,
}: {
  item: NavItem
  pathname: string
  badgeCount?: number
}) {
  const tNav = useTranslations('nav')
  const active = isNavActive(pathname, item)

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{tNav(item.labelKey)}</span>
      {badgeCount > 0 ? (
        <span className="ml-auto shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
          {formatBadgeCount(badgeCount)}
        </span>
      ) : null}
    </Link>
  )
}

function NavGroupSection({
  group,
  pathname,
  open,
  onToggle,
  badgeByHref,
}: {
  group: NavGroup
  pathname: string
  open: boolean
  onToggle: () => void
  badgeByHref?: Record<string, number>
}) {
  const tNav = useTranslations('nav')
  const hasActive = group.items.some((item) => isNavActive(pathname, item))

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors',
          hasActive
            ? 'text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/50 hover:text-sidebar-foreground/80',
        )}
      >
        <span>{tNav(group.labelKey)}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? (
        <div className="space-y-0.5 pl-1">
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              badgeCount={badgeByHref?.[item.href] ?? 0}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Sidebar({
  employee,
  onLogout,
}: {
  employee: BackstageSession | null
  onLogout: () => void
}) {
  const pathname = usePathname()
  const tCommon = useTranslations('common')
  const [wholesaleNewCount, setWholesaleNewCount] = useState(0)

  const initiallyOpen = useMemo(() => {
    const open: Record<string, boolean> = {}
    for (const group of navGroups) {
      open[group.id] = group.items.some((item) => isNavActive(pathname, item))
    }
    return open
  }, [pathname])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initiallyOpen)

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev }
      for (const group of navGroups) {
        if (group.items.some((item) => isNavActive(pathname, item))) {
          next[group.id] = true
        }
      }
      return next
    })
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      try {
        const count = await fetchWholesaleInquiriesNewCount()
        if (!cancelled) setWholesaleNewCount(count)
      } catch {
        if (!cancelled) setWholesaleNewCount(0)
      }
    }

    void refresh()
    const intervalId = window.setInterval(() => {
      void refresh()
    }, WHOLESALE_NEW_COUNT_POLL_MS)
    const onRefresh = () => {
      void refresh()
    }
    window.addEventListener(WHOLESALE_NEW_COUNT_EVENT, onRefresh)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener(WHOLESALE_NEW_COUNT_EVENT, onRefresh)
    }
  }, [])

  const badgeByHref = useMemo(
    () => ({
      '/backstage/wholesale-inquiries': wholesaleNewCount,
    }),
    [wholesaleNewCount],
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="shrink-0 border-b border-sidebar-border p-6">
        <Link href="/backstage" className="mb-3 block">
          <BrandLogo alt="Зелені Янголи" variant="onDark" imgClassName="max-h-8 md:max-h-9" />
        </Link>
        <div className="space-y-2">
          <span className="text-xs text-sidebar-foreground/60">{tCommon('backstageLabel')}</span>
          <BackstageUiLocaleSwitcher variant="sidebar" className="w-full" />
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <NavLink item={topNavItem} pathname={pathname} />
        {navGroups.map((group) => (
          <NavGroupSection
            key={group.id}
            group={group}
            pathname={pathname}
            open={openGroups[group.id] ?? false}
            onToggle={() =>
              setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
            }
            badgeByHref={badgeByHref}
          />
        ))}
        <NavLink item={settingsNavItem} pathname={pathname} />
      </nav>

      <SidebarFooter employee={employee} onLogout={onLogout} />
    </div>
  )
}

export function AdminLayout({ children, addClassName }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [employee, setEmployee] = useState<BackstageSession | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const tNav = useTranslations('nav')
  const tBread = useTranslations('breadcrumbs')
  const tCommon = useTranslations('common')

  const navLabelKeys = useMemo(() => new Set(allNavItems.map((item) => item.labelKey)), [])

  const breadcrumbLabel = (segment: string): string => {
    if (segment === 'backstage') return tBread('home')
    if (segment === 'profile') return tBread('profile')
    if (segment in { 'add-plant': 1, edit: 1, table: 1 }) {
      return tBread(segment as 'add-plant' | 'edit' | 'table')
    }
    if (navLabelKeys.has(segment as NavLabelKey)) {
      return tNav(segment as NavLabelKey)
    }
    return segment
  }

  useEffect(() => {
    let cancelled = false
    void fetch('/api/backstage/auth/session', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { user?: BackstageSession | null }) => {
        if (!cancelled && data.user) setEmployee(data.user)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/backstage/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/backstage/login')
    router.refresh()
  }

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: { href: string; label: string }[] = []
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    let path = ''
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]
      path += `/${segment}`

      if (uuidPattern.test(segment)) {
        if (segments[index - 1] === 'users') {
          breadcrumbs.push({ href: path, label: tBread('profile') })
        }
        continue
      }

      breadcrumbs.push({
        href: path,
        label: breadcrumbLabel(segment),
      })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="bg-background">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border lg:block">
          <Sidebar employee={employee} onLogout={handleLogout} />
        </aside>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="flex h-full w-64 flex-col gap-0 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{tCommon('menuTitle')}</SheetTitle>
              <SheetDescription>{tCommon('menuDescription')}</SheetDescription>
            </SheetHeader>
            <Sidebar employee={employee} onLogout={handleLogout} />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-screen min-w-0 flex-col lg:pl-64" data-backstage-panel>
          <header className="sticky top-0 z-40 h-9 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-md">
            <div className="flex h-full items-center justify-between gap-2 px-3 lg:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>

                <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1">
                      {index > 0 && (
                        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                      )}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="truncate font-medium text-foreground">{crumb.label}</span>
                      ) : (
                        <Link
                          href={crumb.href}
                          className="truncate text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {crumb.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
              <BackstageContentLocaleSwitcher className="shrink-0" />
            </div>
          </header>

          <main
            className={cn(
              'flex-1 bg-gradient-to-br from-secondary via-background to-accent p-4 pb-4 lg:p-6',
              addClassName,
            )}
          >
            {children}
          </main>
        </div>
      </div>
  )
}
