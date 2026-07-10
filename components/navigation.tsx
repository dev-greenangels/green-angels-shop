'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  BookOpen,
  Heart,
  Home,
  Info,
  LayoutGrid,
  LogOut,
  Menu,
  Percent,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { CartBadge } from '@/components/cart-badge'
import { FavoritesBadge } from '@/components/favorites/favorites-badge'
import { useSession } from '@/components/providers/session-provider'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import { SocialLinks } from '@/components/social/social-links'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'
import { buildLogoutHref } from '@/lib/auth/logout-redirect'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { useCartActions, useCartTotalItems } from '@/lib/cart-store'
import { useFavoritesCount } from '@/lib/favorites-store'
import { useCatalogHref, useCatalogRootSlug } from '@/components/providers/catalog-paths-provider'
import { useNavigationSettings } from '@/components/providers/navigation-settings-provider'
import { isCatalogSectionActive } from '@/lib/catalog/paths'
import {
  resolveNavigationIcon,
  resolveNavigationItemHref,
  resolveNavigationItemLabel,
} from '@/lib/navigation/resolve-menu'
import { cn } from '@/lib/utils'
import type { AppLocale } from '@/i18n/routing'

import { CartDrawer } from './cart-drawer'
import { MobileCatalogNav } from './navigation/mobile-catalog-nav'
import { NavAccountMenu } from './navigation/nav-account-menu'
import { SiteSearchField } from './search/site-search-field'
import { Link, usePathname } from '@/i18n/navigation'

const MOBILE_COMPACT_ENTER_Y = 48
const MOBILE_COMPACT_EXIT_Y = 8
const MOBILE_COMPACT_ANIM_MS = 280
const MOBILE_ACTION_SLOT_CLASS = 'flex h-9 w-9 shrink-0 items-center justify-center overflow-visible'

export function Navigation() {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const locale = useLocale()
  const pathname = usePathname()
  const catalogHref = useCatalogHref()
  const catalogRootSlug = useCatalogRootSlug()
  const navigationSettings = useNavigationSettings()
  const { user, setUser } = useSession()
  const store = useStoreSettings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCompact, setMobileCompact] = useState(false)
  const [mobileSearchPinned, setMobileSearchPinned] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const mobileCompactRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const scrollCompactLockUntilRef = useRef(0)
  const headerRef = useRef<HTMLElement>(null)
  const { openCart } = useCartActions()
  const totalItems = useCartTotalItems()
  const favoritesCount = useFavoritesCount()

  useEffect(() => {
    setMounted(true)
    clearBodyScrollLock()
  }, [])

  useEffect(() => {
    mobileCompactRef.current = false
    scrollCompactLockUntilRef.current = 0
    setMobileCompact(false)
    setMobileSearchPinned(false)
    setSearchQuery('')
  }, [pathname])

  useEffect(() => {
    if (!searchOpen) return
    const frame = window.requestAnimationFrame(() => {
      desktopSearchRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [searchOpen])

  useEffect(() => {
    if (!mobileSearchPinned) return

    const frame = window.requestAnimationFrame(() => {
      mobileSearchRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mobileSearchPinned])

  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const applyCompact = (next: boolean) => {
      if (next === mobileCompactRef.current) return
      mobileCompactRef.current = next
      scrollCompactLockUntilRef.current = Date.now() + MOBILE_COMPACT_ANIM_MS
      setMobileCompact(next)
      if (next) setMobileSearchPinned(false)
    }

    const updateCompact = () => {
      if (Date.now() < scrollCompactLockUntilRef.current) return

      const y = window.scrollY
      const prevY = lastScrollYRef.current
      const scrollingDown = y > prevY + 2
      lastScrollYRef.current = y

      if (y <= MOBILE_COMPACT_EXIT_Y) {
        applyCompact(false)
        return
      }

      if (y >= MOBILE_COMPACT_ENTER_Y && scrollingDown) {
        applyCompact(true)
      }
    }

    const onScrollToTop = () => {
      mobileCompactRef.current = false
      lastScrollYRef.current = 0
      scrollCompactLockUntilRef.current = Date.now() + MOBILE_COMPACT_ANIM_MS
      setMobileCompact(false)
      setMobileSearchPinned(false)
    }

    updateCompact()
    window.addEventListener('scroll', updateCompact, { passive: true })
    window.addEventListener('site:scroll-to-top', onScrollToTop)
    return () => {
      window.removeEventListener('scroll', updateCompact)
      window.removeEventListener('site:scroll-to-top', onScrollToTop)
    }
  }, [])

  const openMobileSearch = () => {
    setMobileSearchPinned(true)
  }

  const closeMobileSearchIfScrolled = () => {
    if (window.scrollY >= MOBILE_COMPACT_ENTER_Y) {
      setMobileSearchPinned(false)
    }
  }

  const showMobileSearchRow = !mobileCompact || mobileSearchPinned
  const showMobileToolbarSearch = mobileCompact && !mobileSearchPinned

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    let frame = 0
    const syncHeaderOffset = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          '--site-header-offset',
          `${header.offsetHeight}px`,
        )
      })
    }

    syncHeaderOffset()
    const observer = new ResizeObserver(syncHeaderOffset)
    observer.observe(header)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [showMobileSearchRow, mobileCompact])

  const navLinks = useMemo(
    () =>
      navigationSettings.items
        .filter((item) => item.visible)
        .map((item) => {
          const href = resolveNavigationItemHref(item, catalogHref)
          const Icon = resolveNavigationIcon(item.icon) ?? LayoutGrid
          return {
            id: item.id,
            href,
            label: resolveNavigationItemLabel(item, locale as AppLocale, t),
            icon: Icon,
            useCatalogHref: item.useCatalogHref === true,
            openInNewTab: item.openInNewTab === true,
          }
        }),
    [navigationSettings.items, catalogHref, locale, t],
  )

  const cartCount = mounted ? totalItems : 0
  const favoritesBadgeCount = mounted ? favoritesCount : 0

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    window.setTimeout(clearBodyScrollLock, 300)
  }

  const handleMenuOpenChange = (open: boolean) => {
    setMobileMenuOpen(open)
    if (!open) window.setTimeout(clearBodyScrollLock, 300)
  }

  const isActiveLink = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  const linkClassName = (href: string, withIcon = false) =>
    cn(
      'transition-colors',
      withIcon
        ? cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold tracking-wide',
            isActiveLink(href)
              ? 'bg-primary/12 text-primary'
              : 'text-foreground/85 hover:bg-accent hover:text-foreground',
          )
        : cn(
            'text-base font-medium hover:text-foreground',
            isActiveLink(href) ? 'text-foreground' : 'text-muted-foreground',
          ),
    )

  return (
    <>
      <header
        ref={headerRef}
        id="site-header"
        className="sticky top-0 z-50 w-full overflow-visible border-b border-border/40 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className={siteContentShellClassName}>
          <div className="overflow-visible lg:hidden -mx-1">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-1 overflow-visible pb-1.5 pt-3">
              <div className={MOBILE_ACTION_SLOT_CLASS}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label={tc('menu')}
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              <Link
                href="/"
                className="flex min-w-0 items-center justify-center"
                aria-label={tc('brand')}
              >
                <BrandLogo
                  alt={tc('brand')}
                  className="opacity-90 hover:opacity-100"
                  imgClassName="max-h-8 object-center"
                />
              </Link>

              <div className={MOBILE_ACTION_SLOT_CLASS}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-9 w-9 transition-opacity duration-200',
                    showMobileToolbarSearch
                      ? 'pointer-events-auto opacity-100'
                      : 'pointer-events-none opacity-0',
                  )}
                  aria-label={tc('search')}
                  aria-hidden={!showMobileToolbarSearch}
                  tabIndex={showMobileToolbarSearch ? 0 : -1}
                  onClick={openMobileSearch}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>

              <div className={MOBILE_ACTION_SLOT_CLASS}>
                <Link href="/favorites" className="inline-flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 overflow-visible"
                    aria-label={tc('favorites')}
                  >
                    <Heart className="h-5 w-5" />
                    <FavoritesBadge count={favoritesBadgeCount} />
                  </Button>
                </Link>
              </div>

              <div className={MOBILE_ACTION_SLOT_CLASS}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 overflow-visible"
                  aria-label={tc('cart')}
                  onClick={() => openCart()}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <CartBadge count={cartCount} />
                </Button>
              </div>
            </div>

            <div
              className={cn(
                'grid px-0.5',
                showMobileSearchRow
                  ? 'grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out'
                  : 'grid-rows-[0fr] transition-none',
                mobileSearchPinned ? 'overflow-visible' : 'overflow-hidden',
              )}
            >
              <div className={cn('min-h-0', mobileSearchPinned ? 'overflow-visible' : 'overflow-hidden')}>
                <div className="pb-2">
                  <SiteSearchField
                    value={searchQuery}
                    onChange={setSearchQuery}
                    inputRef={mobileSearchRef}
                    placeholder={tc('searchPlants')}
                    onBlur={closeMobileSearchIfScrolled}
                    onClear={closeMobileSearchIfScrolled}
                    onNavigate={closeMobileSearchIfScrolled}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden min-h-16 items-center gap-4 py-2 lg:flex xl:gap-5">
            <Link href="/" className="flex shrink-0 items-center">
              <BrandLogo alt={tc('brand')} className="opacity-90 hover:opacity-100" />
            </Link>

            <div className="relative flex min-w-0 flex-1 items-center justify-center">
              <nav
                className={cn(
                  'flex flex-wrap items-center justify-center gap-0.5 transition-opacity xl:gap-1',
                  searchOpen && 'pointer-events-none opacity-0',
                )}
                aria-hidden={searchOpen}
              >
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.id}
                      href={link.href}
                      className={linkClassName(link.href, true)}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
                      <span className="text-[0.9rem]">{link.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div
                className={cn(
                  'absolute inset-0 flex items-center gap-2 transition-opacity',
                  searchOpen
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0',
                )}
              >
                <SiteSearchField
                  value={searchQuery}
                  onChange={setSearchQuery}
                  inputRef={desktopSearchRef}
                  placeholder={tc('searchPlants')}
                  className="min-w-0 flex-1"
                  inputClassName="h-10"
                  panelVariant="header"
                  onNavigate={() => setSearchOpen(false)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">{tc('closeSearch')}</span>
                </Button>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                {!searchOpen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                    <span className="sr-only">{tc('search')}</span>
                  </Button>
                ) : null}
              </div>

              <NavAccountMenu
                isLoggedIn={Boolean(user)}
                logoutHref={buildLogoutHref(pathname)}
                onLogout={() => setUser(null)}
              />

              <Link href="/favorites">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative overflow-visible"
                  aria-label={tc('favorites')}
                >
                  <Heart className="h-5 w-5" />
                  <FavoritesBadge count={favoritesBadgeCount} />
                </Button>
              </Link>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative overflow-visible"
                aria-label={tc('cart')}
                onClick={() => openCart()}
              >
                <ShoppingCart className="h-5 w-5" />
                <CartBadge count={cartCount} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <Sheet open onOpenChange={handleMenuOpenChange}>
          <SheetContent
            side="left"
            closeOnOverlay
            className="flex w-[84%] flex-col border-border/40 p-0 gap-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{tc('menu')}</SheetTitle>
              <SheetDescription>{tc('menuDescription')}</SheetDescription>
            </SheetHeader>

            <div className="border-b border-border px-4 py-4">
              {user ? (
                <div className="space-y-2">
                  <Link
                    href="/account"
                    className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/15"
                    onClick={closeMobileMenu}
                  >
                    <User className="h-5 w-5 shrink-0 fill-primary/25" strokeWidth={2} />
                    <span className="truncate">{t('accountCabinet')}</span>
                  </Link>
                  <Link
                    href="/account/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                    onClick={closeMobileMenu}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    {t('accountSettings')}
                  </Link>
                  <a
                    href={buildLogoutHref(pathname)}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      setUser(null)
                      closeMobileMenu()
                    }}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t('logout')}
                  </a>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-3 text-lg font-semibold text-primary transition-colors hover:bg-primary/15"
                  onClick={closeMobileMenu}
                >
                  <User className="h-5 w-5 shrink-0" />
                  {t('login')}
                </Link>
              )}
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              {navLinks.map((link) => {
                const Icon = link.icon
                const showFavoritesBadge = link.href === '/favorites' && favoritesBadgeCount > 0

                if (link.useCatalogHref) {
                  return (
                    <MobileCatalogNav
                      key={link.id}
                      label={link.label}
                      pathname={pathname}
                      isCatalogActive={isCatalogSectionActive(pathname, catalogRootSlug)}
                      onNavigate={closeMobileMenu}
                    />
                  )
                }

                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary',
                      isActiveLink(link.href) ? 'bg-primary/10 text-primary' : 'text-foreground',
                    )}
                    onClick={closeMobileMenu}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{link.label}</span>
                    {showFavoritesBadge ? (
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[12px] font-semibold text-primary-foreground">
                        {favoritesBadgeCount > 99 ? '99+' : favoritesBadgeCount}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-border pr-0 p-4">
              <p className="mb-3 text-sm font-medium text-muted-foreground">Ми в соцмережах</p>
              <SocialLinks
                social={store.social}
                size="md"
                iconClassName="border-border bg-muted/60 text-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      <CartDrawer />
    </>
  )
}
