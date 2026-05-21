'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Search, ShoppingCart, User, Menu, X } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { CartBadge } from '@/components/cart-badge'
import { useSession } from '@/components/providers/session-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'
import { useCartStore } from '@/lib/cart-store'

import { CartDrawer } from './cart-drawer'

export function Navigation() {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const { user, setUser } = useSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const openCart = useCartStore((s) => s.openCart)
  const totalItems = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0)
  )

  useEffect(() => {
    setMounted(true)
    clearBodyScrollLock()
  }, [])

  const navLinks = useMemo(
    () =>
      [
        { href: '/catalog', label: t('catalog') },
        { href: '/catalog/conifers', label: t('conifers') },
        { href: '/catalog/deciduous', label: t('deciduous') },
        { href: '/catalog/perennials', label: t('perennials') },
        { href: '/catalog/shrubs', label: t('shrubs') },
      ] as const,
    [t]
  )

  const accountHref = user ? (user.role === 'admin' ? '/admin' : '/account') : '/auth/login'
  const cartCount = mounted ? totalItems : 0

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
    window.setTimeout(clearBodyScrollLock, 300)
  }

  const handleMenuOpenChange = (open: boolean) => {
    setMobileMenuOpen(open)
    if (!open) window.setTimeout(clearBodyScrollLock, 300)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="hidden items-center justify-between border-b border-border/40 py-2 text-sm text-muted-foreground md:flex">
            <span>{tc('tagline')}</span>
            <div className="flex items-center gap-4">
              <Link href="/shipping" className="transition-colors hover:text-foreground">
                {t('shipping')}
              </Link>
              <Link href="/faq" className="transition-colors hover:text-foreground">
                {t('faq')}
              </Link>
            </div>
          </div>

          {/* Мобільний: лого по центру; пошук — на всю ширину з blur-фоном */}
          <div className="relative flex h-16 items-center gap-2 md:hidden">
            {searchOpen ? (
              <div
                className="absolute inset-0 z-20 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
                aria-hidden
              />
            ) : null}

            <div className="relative z-30 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={tc('menu')}
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>

            {searchOpen ? (
              <div className="relative z-30 flex min-w-0 flex-1 items-center gap-1 pr-1">
                <Input
                  type="search"
                  placeholder={tc('searchPlants')}
                  className="h-9 min-w-0 flex-1 border-border/90 bg-background/95 shadow-sm ring-1 ring-border/70"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  aria-label={tc('search')}
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute left-1/2 top-[50%] z-[1] -translate-x-1/2 -translate-y-1/2">
                  <Link href="/" className="pointer-events-auto block">
                    <BrandLogo alt={tc('brand')} className="opacity-90 hover:opacity-100" />
                  </Link>
                </div>

                <div className="relative z-30 ml-auto flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={tc('search')}
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={tc('cart')}
                    onClick={() => openCart()}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <CartBadge count={cartCount} />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Десктоп */}
          <div className="hidden h-20 items-center justify-between md:flex">
            <Link href="/" className="flex shrink-0 items-center">
              <BrandLogo alt={tc('brand')} className="opacity-90 hover:opacity-100" />
            </Link>

            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {searchOpen ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="search"
                    placeholder={tc('searchPlants')}
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">{tc('search')}</span>
                </Button>
              )}

              <Link href={accountHref}>
                <Button type="button" variant="ghost" size="icon" aria-label={tc('account')}>
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              {user && (
                <a
                  href="/api/auth/logout"
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setUser(null)}
                >
                  {t('logout')}
                </a>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
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
          <SheetContent side="left" className="w-70 border-border/40">
            <SheetHeader className="sr-only">
              <SheetTitle>{tc('menu')}</SheetTitle>
              <SheetDescription>{tc('menuDescription')}</SheetDescription>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4 p-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium transition-colors hover:text-primary"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 border-t border-border pt-4">
                {user ? (
                  <>
                    {user.role === 'admin' ? (
                      <Link
                        href="/admin"
                        className="block text-lg font-medium transition-colors hover:text-primary"
                        onClick={closeMobileMenu}
                      >
                        {t('adminPanel')}
                      </Link>
                    ) : (
                      <Link
                        href="/account"
                        className="block text-lg font-medium transition-colors hover:text-primary"
                        onClick={closeMobileMenu}
                      >
                        {t('accountCabinet')}
                      </Link>
                    )}
                    <a
                      href="/api/auth/logout"
                      className="mt-3 block text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      onClick={() => {
                        setUser(null)
                        closeMobileMenu()
                      }}
                    >
                      {t('logout')}
                    </a>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="text-lg font-medium transition-colors hover:text-primary"
                    onClick={closeMobileMenu}
                  >
                    {t('login')}
                  </Link>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      ) : null}

      <CartDrawer />
    </>
  )
}
