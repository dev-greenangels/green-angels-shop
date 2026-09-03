'use client'

import { Suspense, useEffect, useState } from 'react'
import { AlertTriangle, Home, Loader2, ShoppingBag, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

import { BrandLogo } from '@/components/brand-logo'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { useMarketRegion } from '@/components/providers/market-region-provider'
import {
  checkoutPageContentClassName,
  checkoutPageShellClassName,
} from '@/components/checkout/checkout-utils'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getMarketBranding } from '@/lib/branding/market-branding'
import { fetchOrderConfirmation } from '@/lib/orders/fetch-order-confirmation'
import { cn } from '@/lib/utils'

type CancelView =
  | { kind: 'loading' }
  | { kind: 'cancelled'; orderNumber: string }
  | { kind: 'unverified' }

function CancelledContent() {
  const t = useTranslations('checkout.paymentCancelled')
  const searchParams = useSearchParams()
  const catalogHref = useCatalogHref()
  const marketRegion = useMarketRegion()
  const brandAlt = getMarketBranding(marketRegion).applicationName
  const orderNumber = searchParams.get('order')?.trim() ?? ''
  const confirmationToken = searchParams.get('confirmation')?.trim() ?? ''

  const [view, setView] = useState<CancelView>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!orderNumber || !confirmationToken) {
        if (!cancelled) setView({ kind: 'unverified' })
        return
      }
      const order = await fetchOrderConfirmation(orderNumber, confirmationToken)
      if (cancelled) return
      if (order?.status === 'CANCELLED') {
        setView({ kind: 'cancelled', orderNumber: order.orderNumber })
        return
      }
      setView({ kind: 'unverified' })
    })()
    return () => {
      cancelled = true
    }
  }, [orderNumber, confirmationToken])

  return (
    <div className={checkoutPageShellClassName}>
      <ClientPublicPageBreadcrumbs
        items={[
          { label: t('breadcrumbCheckout'), href: '/checkout' },
          { label: t('breadcrumbCurrent') },
        ]}
      />
      <div
        className={cn(
          checkoutPageContentClassName,
          siteContentShellClassName,
          'py-10 sm:py-16',
        )}
      >
        <div className="mx-auto max-w-lg text-center">
          <BrandLogo alt={brandAlt} className="mx-auto mb-6" imgClassName="max-h-10 opacity-90" />

          {view.kind === 'loading' ? (
            <>
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            </>
          ) : view.kind === 'cancelled' ? (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-8 w-8" aria-hidden />
              </div>

              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground break-words sm:text-3xl">
                {t('title')}
              </h1>

              <p className="mb-1 text-sm text-muted-foreground">{t('orderLabel')}</p>
              <p className="mb-4 font-mono text-xl font-bold tabular-nums break-all text-foreground">
                {view.orderNumber}
              </p>
              <p className="mb-2 text-sm text-muted-foreground">
                {t('description', { number: view.orderNumber })}
              </p>
              <p className="mb-8 text-sm text-muted-foreground">{t('hint')}</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-700">
                <AlertTriangle className="h-8 w-8" aria-hidden />
              </div>
              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground break-words sm:text-3xl">
                {t('unverifiedTitle')}
              </h1>
              <p className="mb-8 text-sm text-muted-foreground">{t('unverifiedBody')}</p>
            </>
          )}

          {view.kind !== 'loading' ? (
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline" size="lg" className="w-full flex-1 sm:w-auto">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  {t('home')}
                </Link>
              </Button>
              <Button asChild size="lg" className="w-full flex-1 sm:w-auto">
                <Link href={catalogHref}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {t('catalog')}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function CheckoutCancelledPage() {
  const t = useTranslations('checkout.paymentCancelled')

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  )
}
