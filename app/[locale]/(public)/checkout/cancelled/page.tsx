'use client'

import { Suspense } from 'react'
import { Home, ShoppingBag, XCircle } from 'lucide-react'
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
import { cn } from '@/lib/utils'

function CancelledContent() {
  const t = useTranslations('checkout.paymentCancelled')
  const searchParams = useSearchParams()
  const catalogHref = useCatalogHref()
  const marketRegion = useMarketRegion()
  const brandAlt = getMarketBranding(marketRegion).applicationName
  const orderNumber = searchParams.get('order')?.trim() ?? ''

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

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle className="h-8 w-8" aria-hidden />
          </div>

          <h1 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
            {t('title')}
          </h1>

          {orderNumber ? (
            <>
              <p className="mb-1 text-sm text-muted-foreground">{t('orderLabel')}</p>
              <p className="mb-4 font-mono text-xl font-bold tabular-nums text-foreground">
                {orderNumber}
              </p>
              <p className="mb-2 text-sm text-muted-foreground">
                {t('description', { number: orderNumber })}
              </p>
            </>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">{t('descriptionGeneric')}</p>
          )}

          <p className="mb-8 text-sm text-muted-foreground">{t('hint')}</p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="outline" size="lg" className="flex-1">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('home')}
              </Link>
            </Button>
            <Button asChild size="lg" className="flex-1">
              <Link href={catalogHref}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                {t('catalog')}
              </Link>
            </Button>
          </div>
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
