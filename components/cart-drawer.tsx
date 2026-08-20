'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronUp, ShoppingBag } from 'lucide-react'

import { CartLineRow } from '@/components/cart/cart-line-row'
import { CartOrderTotalsBreakdown } from '@/components/cart/cart-order-totals-breakdown'
import { CartPromoGiftLines } from '@/components/cart/cart-promo-gift-lines'
import { MinOrderPolicyBanner } from '@/components/cart/min-order-policy-banner'
import { CheckoutPromoCode } from '@/components/checkout/checkout-promo-code'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useFormatPrice } from '@/lib/commerce/use-format-price'
import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'
import { getInStockCartItems } from '@/lib/cart-availability'
import { cartLineKey } from '@/lib/cart-normalize'
import { buildPricingQuoteLineItems } from '@/lib/pricing/quote-line-items'
import { quoteLinesByVariantId } from '@/lib/pricing/quote'
import { usePricingQuote, promoCodesKey, resolveDisplayedAppliedPromos } from '@/lib/pricing/use-pricing-quote'
import { tryApplyPromoCode } from '@/lib/pricing/try-apply-promo-code'
import { resolveRemovedPromoInfo } from '@/lib/pricing/promo-messages'
import {
  useCartActions,
  useCartAppliedPromoCodes,
  useCartHasCheckoutableItems,
  useCartIsOpen,
  useCartItems,
  useCartPromoCode,
  useCartTotalPrice,
} from '@/lib/cart-store'
import type { CartItem, Plant, ProductVariant } from '@/lib/types'
import { Link } from '@/i18n/navigation'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { useSession } from '@/components/providers/session-provider'
import {
  fetchPublicSiteSettingsFromApiRoute,
  getCartCheckoutSettings,
} from '@/lib/settings/fetch'

export function CartDrawer() {
  const catalogHref = useCatalogHref()
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const tp = useTranslations('promo')
  const formatMoney = useFormatPrice('shelf')
  const { user } = useSession()
  const isOpen = useCartIsOpen()
  const items = useCartItems()
  const fallbackTotalPrice = useCartTotalPrice()
  const hasCheckoutable = useCartHasCheckoutableItems()
  const promoCode = useCartPromoCode()
  const appliedPromoCodes = useCartAppliedPromoCodes()
  const {
    setCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    addItem,
    refreshCatalogData,
    setPromoCode,
    setAppliedPromoCodes,
    removePromoCode,
  } = useCartActions()

  const [cartHydrated, setCartHydrated] = useState(false)
  const [catalogReady, setCatalogReady] = useState(false)
  const [showPromoCode, setShowPromoCode] = useState(true)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [promoInfo, setPromoInfo] = useState<string | null>(null)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const dismissedAutoExpandRef = useRef(false)
  const checkoutableItems = useMemo(
    () => (cartHydrated ? getInStockCartItems(items) : []),
    [cartHydrated, items],
  )
  const quoteLineItems = useMemo(
    () => buildPricingQuoteLineItems(checkoutableItems),
    [checkoutableItems],
  )
  const quoteItemsKey = useMemo(
    () => quoteLineItems.map((item) => `${item.productVariantId}:${item.quantity}`).join('|'),
    [quoteLineItems],
  )
  const { quote, loading: quoteLoading, quoteForPromoCodes } = usePricingQuote({
    items: quoteLineItems,
    itemsKey: quoteItemsKey,
    audienceKey: user?.id ?? null,
    promoCodes: appliedPromoCodes.length ? appliedPromoCodes : undefined,
    enabled: cartHydrated && isOpen && catalogReady && quoteItemsKey.length > 0,
  })
  const quoteByVariant = useMemo(() => quoteLinesByVariantId(quote), [quote])
  const displayedAppliedPromos = useMemo(
    () => resolveDisplayedAppliedPromos(appliedPromoCodes, quote, quoteLoading, quoteForPromoCodes),
    [appliedPromoCodes, quote, quoteLoading, quoteForPromoCodes],
  )
  const unavailableCount = items.length - checkoutableItems.length
  const displayItems = cartHydrated ? items : []
  const checkoutablePieces = useMemo(
    () => checkoutableItems.reduce((sum, item) => sum + item.quantity, 0),
    [checkoutableItems],
  )
  const grandTotal =
    quote?.checkout?.grandTotal ?? quote?.totalAmount ?? fallbackTotalPrice

  useEffect(() => {
    if (!isOpen) {
      setSummaryExpanded(false)
      dismissedAutoExpandRef.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || displayItems.length === 0) return
    const root = scrollContainerRef.current
    if (!root) return

    // Поріг «біля низу», при якому автопідсумок може розгорнутись
    const NEAR_BOTTOM = 24
    // Поріг «достатньо прогорнув угору», щоб знову дозволити автопідсумок
    const REARM_DISTANCE = 160

    const handleScroll = () => {
      const distanceFromBottom = root.scrollHeight - root.scrollTop - root.clientHeight

      if (distanceFromBottom > REARM_DISTANCE) {
        // Користувач прогорнув угору — знову дозволяємо авторозгортання
        dismissedAutoExpandRef.current = false
        return
      }

      if (
        distanceFromBottom <= NEAR_BOTTOM &&
        root.scrollTop > NEAR_BOTTOM &&
        !dismissedAutoExpandRef.current
      ) {
        setSummaryExpanded(true)
      }
    }

    root.addEventListener('scroll', handleScroll, { passive: true })
    return () => root.removeEventListener('scroll', handleScroll)
  }, [isOpen, displayItems.length, catalogReady])

  const toggleSummary = () => {
    setSummaryExpanded((prev) => {
      const next = !prev
      // Ручне закриття блокує авторозгортання, доки користувач не прогорне вгору
      if (!next) dismissedAutoExpandRef.current = true
      return next
    })
  }

  useEffect(() => {
    if (quoteLoading || !quote) return
    if (promoCodesKey(quoteForPromoCodes) !== promoCodesKey(appliedPromoCodes)) return
    const codes = quote.promoCodes ?? []
    if (promoCodesKey(codes) !== promoCodesKey(appliedPromoCodes)) {
      const removedCodes = appliedPromoCodes.filter(
        (code) => !codes.map((item) => item.toUpperCase()).includes(code.toUpperCase()),
      )
      const removedInfo = resolveRemovedPromoInfo(quote, removedCodes)
      if (removedInfo) {
        setPromoInfo(tp('noAdditionalDiscount', { code: removedInfo.code }))
        setPromoError(null)
      } else if (quote.promoMessage) {
        setPromoError(quote.promoMessage)
        setPromoInfo(null)
      }
      setAppliedPromoCodes(codes)
    }
  }, [quote, quoteLoading, quoteForPromoCodes, appliedPromoCodes, setAppliedPromoCodes, tp])

  const handlePromoApply = useCallback(async () => {
    setPromoError(null)
    setPromoInfo(null)
    const result = await tryApplyPromoCode({
      draftCode: promoCode,
      currentCodes: appliedPromoCodes,
      items: quoteLineItems,
    })
    if (!result.ok) {
      if (result.kind === 'info') {
        setPromoInfo(tp('noAdditionalDiscount', { code: result.code }))
        setPromoCode('')
        return false
      }
      setPromoError(result.message)
      return false
    }
    setAppliedPromoCodes(result.codes)
    setPromoCode('')
    return true
  }, [promoCode, appliedPromoCodes, quoteLineItems, setAppliedPromoCodes, setPromoCode, tp])
  useEffect(() => {
    setCartHydrated(true)
  }, [])

  useEffect(() => {
    if (!isOpen || !cartHydrated) {
      setCatalogReady(false)
      return
    }

    let cancelled = false
    void Promise.all([
      refreshCatalogData(),
      fetchPublicSiteSettingsFromApiRoute().then((result) => {
        if (!cancelled) {
          setShowPromoCode(getCartCheckoutSettings(result).showPromoCode !== false)
        }
      }),
    ])
      .then(() => {
        if (!cancelled) setCatalogReady(true)
      })
      .catch(() => {
        if (!cancelled) setCatalogReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, cartHydrated, refreshCatalogData])

  const handleOpenChange = (open: boolean) => {
    setCartOpen(open)
    if (!open) window.setTimeout(clearBodyScrollLock, 300)
  }

  const handleReplace = (
    oldItem: CartItem,
    plant: Plant,
    variant: ProductVariant,
    unitPrice: number,
  ) => {
    if (!oldItem.variantId) return
    const quantity = oldItem.quantity
    removeItem(oldItem.plant.id, oldItem.variantId)
    addItem(plant, quantity, { variant, unitPrice })
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        className={cn(
          'flex h-full w-full min-h-0 flex-col gap-0 border-border/40 p-0 sm:max-w-lg',
          '!bg-white backdrop-blur-none supports-[backdrop-filter]:!bg-white',
          'dark:!bg-card dark:supports-[backdrop-filter]:!bg-card',
        )}
      >
        <SheetHeader className="shrink-0 pb-2.5 pt-2 shadow-sm">
          <SheetTitle className="font-serif text-xl">{t('title')}</SheetTitle>
          <SheetDescription className="sr-only">{t('description')}</SheetDescription>
        </SheetHeader>

        {displayItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 font-serif text-lg font-medium">{t('emptyTitle')}</h3>
            <p className="mb-6 text-sm text-muted-foreground">{t('emptyBody')}</p>
            <Button type="button" onClick={closeCart} asChild>
              <Link href={catalogHref}>{tc('goToCatalog')}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-4 px-2 py-4">
                {displayItems.map((item) => (
                  <CartLineRow
                    key={
                      item.variantId
                        ? cartLineKey(item.plant.id, item.variantId)
                        : item.plant.id
                    }
                    item={item}
                    items={displayItems}
                    updateQuantity={updateQuantity}
                    removeItem={removeItem}
                    replaceItem={handleReplace}
                    onNavigate={closeCart}
                    quoteLine={
                      item.variantId ? quoteByVariant.get(item.variantId) : undefined
                    }
                    showLineStrikethrough={false}
                  />
                ))}
              </div>

              <CartPromoGiftLines
                gifts={quote?.giftLines}
                className="px-2 pb-4"
                onNavigate={closeCart}
              />

              <div className="px-2 pb-3">
                <MinOrderPolicyBanner compact />
              </div>

              <div className="h-40 shrink-0" aria-hidden />
            </div>

            <div
              className={cn(
                'shrink-0 border-t border-border/40 bg-white',
                'shadow-[0_-4px_12px_rgba(0,0,0,0.08)]',
                'dark:bg-card',
              )}
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/25"
                onClick={toggleSummary}
                aria-expanded={summaryExpanded}
                aria-label={summaryExpanded ? tc('collapse') : tc('expand')}
              >
                <p className="min-w-0 text-sm font-medium text-foreground">
                  {t('summaryGoods', {
                    lines: checkoutableItems.length,
                    pieces: checkoutablePieces,
                  })}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-primary">
                    <span className="font-medium text-foreground">{tc('total')}</span>{' '}
                    <span suppressHydrationWarning>
                      {quoteLoading ? '...' : formatMoney(grandTotal)}
                    </span>
                  </p>
                  <ChevronUp
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      summaryExpanded && 'rotate-180',
                    )}
                    aria-hidden
                  />
                </div>
              </button>

              {summaryExpanded ? (
                <>
                  {!hasCheckoutable ? (
                    <p className="border-b border-border/40 px-4 py-3 text-sm text-destructive">
                      {t('allUnavailable')}
                    </p>
                  ) : null}

                  {showPromoCode ? (
                    <div className="border-b border-border/40 px-4 py-3">
                      <CheckoutPromoCode
                        variant="compact"
                        value={promoCode}
                        onChange={(value) => {
                          setPromoCode(value)
                          if (promoError) setPromoError(null)
                          if (promoInfo) setPromoInfo(null)
                        }}
                        appliedPromos={displayedAppliedPromos}
                        message={promoError}
                        infoMessage={promoInfo}
                        loading={quoteLoading}
                        onApply={handlePromoApply}
                        onRemove={(code) => {
                          setPromoError(null)
                          setPromoInfo(null)
                          removePromoCode(code)
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="border-b border-border/40 px-4 py-3">
                    <h3 className="mb-2 font-serif text-base font-semibold text-foreground">
                      {t('orderSummary')}
                    </h3>
                    <CartOrderTotalsBreakdown
                      checkout={quote?.checkout}
                      productsSubtotal={quote?.totalAmount ?? fallbackTotalPrice}
                      discountAmount={Math.max(
                        0,
                        (quote?.subtotalBeforeDiscount ?? fallbackTotalPrice) -
                          (quote?.totalAmount ?? fallbackTotalPrice),
                      )}
                      grandTotal={grandTotal}
                      quoteLoading={quoteLoading}
                      itemCount={checkoutableItems.length}
                      divided
                    />
                    {unavailableCount > 0 ? (
                      <p className="mt-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                        {t('unavailableNote')}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}

              <div className="space-y-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {hasCheckoutable ? (
                <Button className="flex w-full justify-center" size="lg" asChild>
                  <Link href="/checkout" onClick={closeCart}>
                    {t('checkout')}
                  </Link>
                </Button>
              ) : (
                <Button className="flex w-full justify-center" size="lg" disabled>
                  {t('checkout')}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="flex w-full justify-center"
                onClick={closeCart}
              >
                {tc('continueShopping')}
              </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
