'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import {
  Heart,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { CartBadge } from '@/components/cart-badge'
import { FavoritesBadge } from '@/components/favorites/favorites-badge'
import { useSession } from '@/components/providers/session-provider'
import { useMarketRegion } from '@/components/providers/market-region-provider'
import { useStoreSettings } from '@/components/providers/store-settings-provider'
import { SocialLinks } from '@/components/social/social-links'
import { Button } from '@/components/ui/button'
import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'
import { buildLogoutHref } from '@/lib/auth/logout-redirect'
import { getMarketBranding } from '@/lib/branding/market-branding'
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

import { MobileCatalogNav } from './navigation/mobile-catalog-nav'
import { NavAccountMenu } from './navigation/nav-account-menu'
import { SiteSearchField } from './search/site-search-field'
import { Link, usePathname } from '@/i18n/navigation'
import { useBodyScrollLock } from '@/lib/body-scroll-lock'

const CartDrawer = dynamic(
  () => import('./cart-drawer').then((mod) => ({ default: mod.CartDrawer })),
  { ssr: false },
)

const MOBILE_ACTION_SLOT_CLASS = 'flex h-9 w-9 shrink-0 items-center justify-center overflow-visible'
const MOBILE_PANEL_ANIM_MS = 400
const MOBILE_PANEL_EASE = 'duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]'
/** Висота меню: під хедером, знизу відступ трохи більший ніж з боків (px-3 = 0.75rem → ~1.25rem). */
const MOBILE_MENU_MAX_H = 'max-h-[calc(100dvh-5.75rem)]'

export function Navigation() {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const tf = useTranslations('footer')
  const locale = useLocale()
  const pathname = usePathname()
  const catalogHref = useCatalogHref()
  const catalogRootSlug = useCatalogRootSlug()
  const navigationSettings = useNavigationSettings()
  const marketRegion = useMarketRegion()
  const branding = getMarketBranding(marketRegion)
  const { user, setUser } = useSession()
  const store = useStoreSettings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const desktopSearchRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const mobileSearchPanelRef = useRef<HTMLDivElement>(null)
  const mobileMenuPanelRef = useRef<HTMLDivElement>(null)
  const { openCart } = useCartActions()
  const totalItems = useCartTotalItems()
  const favoritesCount = useFavoritesCount()

  useEffect(() => {
    setMounted(true)
    clearBodyScrollLock()
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileSearchOpen(false)
    setSearchQuery('')
  }, [pathname])

  useEffect(() => {
    if (!searchOpen) return
    const frame = window.requestAnimationFrame(() => {
      desktopSearchRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [searchOpen])

  const syncHeaderOffset = () => {
    const header = headerRef.current
    if (!header) return
    document.documentElement.style.setProperty(
      '--site-header-offset',
      `${header.offsetHeight}px`,
    )
  }

  const toggleMobileSearch = () => {
    const nextOpen = !mobileSearchOpen
    if (nextOpen && mobileMenuOpen) setMobileMenuOpen(false)

    setMobileSearchOpen(nextOpen)
    if (!nextOpen) setSearchQuery('')

    if (nextOpen) {
      window.setTimeout(() => mobileSearchRef.current?.focus(), MOBILE_PANEL_ANIM_MS)
    }
  }

  const closeMobileSearch = () => {
    if (!mobileSearchOpen) {
      setSearchQuery('')
      return
    }
    setMobileSearchOpen(false)
    setSearchQuery('')
  }

  const toggleMobileMenu = () => {
    const nextOpen = !mobileMenuOpen
    if (nextOpen && mobileSearchOpen) {
      setMobileSearchOpen(false)
      setSearchQuery('')
    }
    setMobileMenuOpen(nextOpen)
  }

  const closeMobileMenu = () => {
    if (!mobileMenuOpen) return
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    let frame = 0
    const onResize = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(syncHeaderOffset)
    }

    syncHeaderOffset()
    const observer = new ResizeObserver(onResize)
    observer.observe(header)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

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

  useBodyScrollLock(mobileMenuOpen || mobileSearchOpen)

  const isActiveLink = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  return (
    <>
      <header
        ref={headerRef}
        id="site-header"
        className="sticky top-0 z-50 w-full overflow-visible px-3 pt-3 pb-0 sm:px-4 sm:pt-4"
      >
        <div className={cn(siteContentShellClassName, '!px-0')}>
          {/*
            Mobile: fixed-height slot so expanding menu (Boty-style, inside nav glass)
            does not push page content. Nav itself is absolute and grows downward.
          */}
          <div className="relative h-[60px] lg:hidden">
            <nav
              className={cn(
                'boty-glass absolute inset-x-0 top-0 z-50 rounded-[1rem]',
                // overflow-hidden only when collapsed — otherwise sticky «Каталог» breaks
                mobileMenuOpen || mobileSearchOpen ? 'overflow-visible' : 'overflow-hidden',
              )}
              aria-label={tc('menu')}
            >
              <div className="grid h-[60px] grid-cols-[1fr_auto_1fr] items-center px-2 sm:px-3">
                <div className={cn(MOBILE_ACTION_SLOT_CLASS, 'justify-self-start')}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 overflow-visible text-foreground/80 hover:bg-transparent hover:text-foreground"
                    aria-label={mobileMenuOpen ? tc('close') : tc('menu')}
                    aria-expanded={mobileMenuOpen}
                    onClick={toggleMobileMenu}
                  >
                    {mobileMenuOpen ? (
                      <X className="h-5 w-5" strokeWidth={2} />
                    ) : (
                      <Menu className="h-5 w-5" strokeWidth={2} />
                    )}
                    {favoritesBadgeCount > 0 ? (
                      <span
                        className="absolute right-1 top-1 h-2 w-2 rounded-full border border-white bg-primary shadow-sm"
                        aria-hidden
                      />
                    ) : null}
                  </Button>
                </div>

                <Link
                  href="/"
                  className="flex min-w-0 items-center justify-center justify-self-center"
                  aria-label={tc('brand')}
                >
                  <BrandLogo
                    alt={tc('brand')}
                    logoSrc={branding.headerLogo}
                    className="opacity-95 hover:opacity-100"
                    imgClassName="max-h-8 object-center"
                  />
                </Link>

                <div className="flex items-center justify-self-end">
                  <div className={MOBILE_ACTION_SLOT_CLASS}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-foreground/70 hover:bg-transparent hover:text-foreground"
                      aria-label={mobileSearchOpen ? tc('closeSearch') : tc('search')}
                      aria-expanded={mobileSearchOpen}
                      onClick={toggleMobileSearch}
                    >
                      {mobileSearchOpen ? (
                        <X className="h-5 w-5" strokeWidth={2} />
                      ) : (
                        <Search className="h-5 w-5" strokeWidth={2} />
                      )}
                    </Button>
                  </div>

                  <div className={MOBILE_ACTION_SLOT_CLASS}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9 overflow-visible text-foreground/70 hover:bg-transparent hover:text-foreground"
                      aria-label={tc('cart')}
                      onClick={() => openCart()}
                    >
                      <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                      <CartBadge count={cartCount} className="-right-0.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  'overflow-hidden transition-[max-height]',
                  MOBILE_PANEL_EASE,
                  mobileSearchOpen ? 'max-h-40' : 'max-h-0',
                )}
                aria-hidden={!mobileSearchOpen}
              >
                <div
                  ref={mobileSearchPanelRef}
                  className="border-t border-border/50 px-3 pb-3 pt-2"
                >
                  <SiteSearchField
                    value={searchQuery}
                    onChange={setSearchQuery}
                    inputRef={mobileSearchRef}
                    placeholder={tc('searchPlants')}
                    panelVariant="header"
                    onNavigate={closeMobileSearch}
                    onClear={() => setSearchQuery('')}
                  />
                </div>
              </div>

              <div
                className={cn(
                  'transition-[max-height]',
                  MOBILE_PANEL_EASE,
                  mobileMenuOpen ? MOBILE_MENU_MAX_H : 'max-h-0 overflow-hidden',
                )}
                aria-hidden={!mobileMenuOpen}
              >
                <div
                  ref={mobileMenuPanelRef}
                  data-mobile-menu-panel
                  className={cn(
                    MOBILE_MENU_MAX_H,
                    'overflow-y-auto overscroll-contain px-4 pb-3 pt-0',
                  )}
                >
                  <div className="mb-3 space-y-1">
                    {user ? (
                      <>
                        <Link
                          href="/account"
                          className="flex items-center gap-2.5 rounded-md px-1 py-2 text-[18px] font-medium tracking-wide text-foreground transition-colors hover:text-primary"
                          onClick={closeMobileMenu}
                        >
                          <User className="h-5 w-5 shrink-0 text-primary" strokeWidth={2} />
                          <span className="truncate">{t('accountCabinet')}</span>
                        </Link>
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-2.5 rounded-md px-1 py-2 text-[18px] tracking-wide text-foreground/80 transition-colors hover:text-foreground"
                          onClick={closeMobileMenu}
                        >
                          <Settings className="h-5 w-5 shrink-0" strokeWidth={2} />
                          {t('accountSettings')}
                        </Link>
                        <a
                          href={buildLogoutHref(pathname)}
                          className="flex items-center gap-2.5 rounded-md px-1 py-2 text-[18px] tracking-wide text-muted-foreground transition-colors hover:text-foreground"
                          onClick={() => {
                            setUser(null)
                            closeMobileMenu()
                          }}
                        >
                          <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
                          {t('logout')}
                        </a>
                      </>
                    ) : (
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-2.5 rounded-md px-1 py-2 text-[18px] font-medium tracking-wide text-primary transition-colors hover:text-primary/80"
                        onClick={closeMobileMenu}
                      >
                        <User className="h-5 w-5 shrink-0" strokeWidth={2} />
                        {t('login')}
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 border-t border-border/40 pt-2 [&>*]:border-b [&>*]:border-[#65954f38] [&>*:last-child]:border-b-0">
                    {navLinks.map((link) => {
                      const Icon = link.icon
                      const showFavoritesBadge =
                        link.href === '/favorites' && favoritesBadgeCount > 0

                      if (link.useCatalogHref) {
                        return (
                          <MobileCatalogNav
                            key={link.id}
                            label={link.label}
                            pathname={pathname}
                            isCatalogActive={isCatalogSectionActive(pathname, catalogRootSlug)}
                            onNavigate={closeMobileMenu}
                            menuOpen={mobileMenuOpen}
                          />
                        )
                      }

                      return (
                        <Link
                          key={link.id}
                          href={link.href}
                          className={cn(
                            'flex items-center gap-2.5 px-1 py-2.5 text-[18px] tracking-wide transition-colors hover:text-foreground',
                            isActiveLink(link.href)
                              ? 'font-medium text-foreground'
                              : 'text-foreground/75',
                          )}
                          onClick={closeMobileMenu}
                        >
                          <Icon className="h-5 w-5 shrink-0 opacity-80" strokeWidth={2} />
                          <span className="flex-1">{link.label}</span>
                          {showFavoritesBadge ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-gradient px-1 text-[11px] font-semibold text-primary-foreground">
                              {favoritesBadgeCount > 99 ? '99+' : favoritesBadgeCount}
                            </span>
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>

                  <div className="mt-3 border-t border-border/40 pt-3">
                    <p className="mb-2 text-sm font-medium tracking-wide text-muted-foreground">
                      {tf('socialTitle')}
                    </p>
                    <SocialLinks
                      social={store.social}
                      size="sm"
                      iconClassName="border-border/60 bg-background/50 text-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                    />
                  </div>
                </div>
              </div>
            </nav>
          </div>

          <nav
            className="boty-glass relative hidden overflow-hidden rounded-[1rem] lg:block"
            aria-label={tc('menu')}
          >
            <div className="flex min-h-[68px] items-center gap-4 px-4 py-2.5 xl:gap-6 xl:px-6">
              <Link href="/" className="shrink-0" aria-label={tc('brand')}>
                <BrandLogo
                  alt={tc('brand')}
                  logoSrc={branding.headerLogo}
                  className="opacity-95 hover:opacity-100"
                  imgClassName="max-h-9 object-left xl:max-h-10"
                />
              </Link>

              <div className="flex min-w-0 flex-1 items-center">
                {searchOpen ? (
                  <div className="flex w-full min-w-0 items-center gap-2">
                    <SiteSearchField
                      value={searchQuery}
                      onChange={setSearchQuery}
                      inputRef={desktopSearchRef}
                      placeholder={tc('searchPlants')}
                      className="min-w-0 flex-1"
                      inputClassName="h-10 rounded-xl border-white/40 bg-white/50"
                      panelVariant="header"
                      onNavigate={() => setSearchOpen(false)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-foreground/70 hover:bg-transparent hover:text-foreground"
                      onClick={() => setSearchOpen(false)}
                    >
                      <X className="h-5 w-5" strokeWidth={2} />
                      <span className="sr-only">{tc('closeSearch')}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 xl:gap-x-7">
                    {navLinks.map((link) => {
                      const active = link.useCatalogHref
                        ? isCatalogSectionActive(pathname, catalogRootSlug)
                        : isActiveLink(link.href)
                      return (
                        <Link
                          key={link.id}
                          href={link.href}
                          className={cn(
                            'shrink-0 text-[15px] tracking-wide transition-colors [text-shadow:0_1px_1px_rgb(0_0_0_/_0.14)] xl:text-base',
                            active
                              ? 'font-bold text-primary'
                              : 'font-semibold text-foreground/75 hover:text-foreground',
                          )}
                          aria-current={active ? 'page' : undefined}
                          target={link.openInNewTab ? '_blank' : undefined}
                          rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                        >
                          {link.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 xl:gap-2">
                {!searchOpen ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-foreground/70 hover:bg-transparent hover:text-foreground"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" strokeWidth={2} />
                    <span className="sr-only">{tc('search')}</span>
                  </Button>
                ) : null}

                <NavAccountMenu
                  isLoggedIn={Boolean(user)}
                  logoutHref={buildLogoutHref(pathname)}
                  onLogout={() => setUser(null)}
                  className="text-foreground/70 hover:bg-transparent hover:text-foreground"
                />

                <Link href="/favorites">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative overflow-visible text-foreground/70 hover:bg-transparent hover:text-foreground"
                    aria-label={tc('favorites')}
                  >
                    <Heart className="h-5 w-5" strokeWidth={2} />
                    <FavoritesBadge count={favoritesBadgeCount} />
                  </Button>
                </Link>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative overflow-visible text-foreground/70 hover:bg-transparent hover:text-foreground"
                  aria-label={tc('cart')}
                  onClick={() => openCart()}
                >
                  <ShoppingCart className="h-5 w-5" strokeWidth={2} />
                  <CartBadge count={cartCount} />
                </Button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <CartDrawer />
    </>
  )
}
