'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, RefreshCw, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { CountryDisplay } from '@/components/backstage/country-display'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { resolveBackstageThumbnailSrc } from '@/lib/category-image'
import {
  fetchBackstageCart,
  fetchBackstageCarts,
  type BackstageCartDetail,
  type BackstageCartListItem,
  type BackstageCartsQuery,
} from '@/lib/backstage/carts'
import { formatOrderMoney } from '@/lib/backstage/order-detail-helpers'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import type { BackstageCountryLocale } from '@/lib/backstage/country-display'
import type { CartActivityState } from '@/lib/carts/types'
import { cn } from '@/lib/utils'

function formatAge(ageMs: number): string {
  const minutes = Math.floor(ageMs / 60000)
  if (minutes < 60) return `${minutes} хв`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours} год`
  return `${Math.floor(hours / 24)} д`
}

function formatPiiCleanupDate(iso: string, locale: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  void locale
  return `${day}.${month}.${year}`
}

function daysUntil(iso: string, now = new Date()): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 0
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  )
}

function DetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-md border border-border/70 bg-background/80 p-3 shadow-sm',
        className,
      )}
    >
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-foreground/80 uppercase">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function CartStateBadge({
  state,
  label,
}: {
  state: BackstageCartListItem['state']
  label: string
}) {
  const abandoned = state === 'CART_ABANDONED' || state === 'CHECKOUT_ABANDONED'
  return <Badge variant={abandoned ? 'destructive' : 'secondary'}>{label}</Badge>
}

function KindBadge({ kind, guest, registered }: { kind: 'guest' | 'user'; guest: string; registered: string }) {
  return kind === 'guest' ? (
    <Badge variant="outline">{guest}</Badge>
  ) : (
    <Badge>{registered}</Badge>
  )
}

function PiiCleanupLabel({
  cart,
  t,
}: {
  cart: Pick<
    BackstageCartListItem,
    'hasCheckoutDraftPii' | 'piiCleanupAt' | 'piiStatus' | 'piiRetentionDays'
  >
  t: (key: string, values?: Record<string, string | number | Date>) => string
}) {
  if (!cart.hasCheckoutDraftPii || cart.piiStatus === 'none') {
    return <span className="text-muted-foreground">{t('piiNone')}</span>
  }
  if (cart.piiStatus === 'pending_cleanup') {
    return <span className="text-amber-700 dark:text-amber-400">{t('piiPending')}</span>
  }
  if (!cart.piiCleanupAt) return null
  const date = formatPiiCleanupDate(cart.piiCleanupAt, 'uk')
  const days = daysUntil(cart.piiCleanupAt)
  return (
    <span>
      {t('piiWillClean')}: <strong className="font-medium text-foreground">{date}</strong>
      {days > 0 ? (
        <span className="text-muted-foreground"> ({t('piiInDays', { days })})</span>
      ) : null}
    </span>
  )
}

function CartDetailPanel({
  cartId,
  locale,
}: {
  cartId: string
  locale: BackstageCountryLocale
}) {
  const t = useTranslations('pages.carts')
  const [detail, setDetail] = useState<BackstageCartDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stateLabel = useCallback(
    (state: CartActivityState | null | undefined) => {
      switch (state) {
        case 'CART_ONLY':
          return t('stateCartOnlyLabel')
        case 'CHECKOUT_ACTIVE':
          return t('stateCheckoutActiveLabel')
        case 'CART_ABANDONED':
          return t('stateCartAbandonedLabel')
        case 'CHECKOUT_ABANDONED':
          return t('stateCheckoutAbandonedLabel')
        default:
          return '—'
      }
    },
    [t],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchBackstageCart(cartId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null)
          setError(err instanceof Error ? err.message : t('detailError'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cartId, t])

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('loadingDetail')}
      </div>
    )
  }

  if (error || !detail) {
    return (
      <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {error ?? t('noData')}
      </p>
    )
  }

  return (
    <div className="mt-3 rounded-lg border border-border/80 bg-muted/35 p-3 ring-1 ring-border/40 sm:p-4">
      <div className="grid gap-3 lg:grid-cols-2">
        {detail.accountCustomer ? (
          <DetailSection title={t('accountCustomer')}>
            <MetaRow label={t('name')}>{detail.accountCustomer.name || '—'}</MetaRow>
            <MetaRow label={t('email')}>{detail.accountCustomer.email || '—'}</MetaRow>
            <MetaRow label={t('phone')}>{detail.accountCustomer.phone || '—'}</MetaRow>
          </DetailSection>
        ) : null}

        <DetailSection title={t('savedCheckoutData')}>
          {detail.savedCheckoutData ? (
            <>
              <MetaRow label={t('name')}>{detail.savedCheckoutData.name || '—'}</MetaRow>
              <MetaRow label={t('email')}>{detail.savedCheckoutData.email || '—'}</MetaRow>
              <MetaRow label={t('phone')}>{detail.savedCheckoutData.phone || '—'}</MetaRow>
              {detail.savedCheckoutData.companyLegalName ? (
                <MetaRow label={t('company')}>{detail.savedCheckoutData.companyLegalName}</MetaRow>
              ) : null}
              {detail.savedCheckoutData.companyIco ? (
                <MetaRow label="IČO">{detail.savedCheckoutData.companyIco}</MetaRow>
              ) : null}
              {detail.savedCheckoutData.companyVatId ? (
                <MetaRow label="VAT ID">
                  {(detail.savedCheckoutData.vatCountryCode ?? '') +
                    detail.savedCheckoutData.companyVatId}
                </MetaRow>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('piiNone')}</p>
          )}
        </DetailSection>

        <DetailSection title={t('siteSource')}>
          <MetaRow label={t('siteCountry')}>
            <CountryDisplay code={detail.site.countryCode} locale={locale} variant="compact" />
          </MetaRow>
          <MetaRow label={t('locale')}>{detail.site.locale || '—'}</MetaRow>
          <MetaRow label={t('type')}>
            <KindBadge
              kind={detail.kind}
              guest={t('guest')}
              registered={t('registered')}
            />
          </MetaRow>
        </DetailSection>

        <DetailSection title={t('deliveryCard')}>
          <MetaRow label={t('deliveryCountry')}>
            <CountryDisplay code={detail.delivery.countryCode} locale={locale} variant="compact" />
          </MetaRow>
          <MetaRow label={t('method')}>{detail.delivery.method || '—'}</MetaRow>
          {detail.delivery.postOfficeLabel || detail.delivery.postOffice ? (
            <MetaRow label="Packeta / відділення">
              {detail.delivery.postOfficeLabel || detail.delivery.postOffice}
            </MetaRow>
          ) : null}
          {(detail.delivery.street || detail.delivery.city) && (
            <MetaRow label={t('address')}>
              {[
                [detail.delivery.street, detail.delivery.houseNumber].filter(Boolean).join(' '),
                detail.delivery.city,
                detail.delivery.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </MetaRow>
          )}
        </DetailSection>

        <DetailSection title={t('billingPayment')}>
          <MetaRow label={t('billingCountry')}>
            <CountryDisplay code={detail.billing.countryCode} locale={locale} variant="compact" />
          </MetaRow>
          {(detail.billing.street || detail.billing.city) && (
            <MetaRow label={t('address')}>
              {[
                [detail.billing.street, detail.billing.houseNumber].filter(Boolean).join(' '),
                detail.billing.city,
                detail.billing.postalCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </MetaRow>
          )}
          <MetaRow label={t('payment')}>{detail.payment.method || '—'}</MetaRow>
        </DetailSection>

        <DetailSection title={t('cartCard')} className="lg:col-span-2">
          <ul className="space-y-3">
            {detail.items.map((item) => (
              <li key={item.productVariantId} className="flex gap-3 text-sm">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveBackstageThumbnailSrc(item.imageUrl)}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.productName}</p>
                  {item.latinName?.trim() ? (
                    <p className="truncate text-xs italic text-muted-foreground">
                      {item.latinName.trim()}
                    </p>
                  ) : null}
                  {item.variantLabel ? (
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p>
                    {item.quantity} {t('pcs')}
                  </p>
                  <p className="text-muted-foreground">
                    {item.lineTotal != null
                      ? formatOrderMoney(item.lineTotal, detail.currency)
                      : '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right text-sm font-medium">
            {t('productsSubtotal')}:{' '}
            {formatOrderMoney(detail.productsSubtotal, detail.currency)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {t('currentRetail')}
            </span>
          </p>
        </DetailSection>

        <DetailSection title={t('activityCard')}>
          <MetaRow label={t('created')}>
            {formatDateTime(detail.createdAt, locale, 'datetime')}
          </MetaRow>
          <MetaRow label={t('checkoutStarted')}>
            {detail.checkoutStartedAt
              ? formatDateTime(detail.checkoutStartedAt, locale, 'datetime')
              : '—'}
          </MetaRow>
          <MetaRow label={t('lastActivity')}>
            {formatDateTime(detail.updatedAt, locale, 'datetime')}
          </MetaRow>
          <MetaRow label={t('age')}>{formatAge(detail.ageMs)}</MetaRow>
          <MetaRow label={t('status')}>
            {detail.state ? (
              <CartStateBadge state={detail.state} label={stateLabel(detail.state)} />
            ) : (
              '—'
            )}
          </MetaRow>
        </DetailSection>

        <DetailSection title={t('retentionCard')}>
          <MetaRow label={t('piiRetentionPeriod')}>
            {t('piiRetentionDays', { days: detail.piiRetentionDays })}
          </MetaRow>
          <div className="text-sm">
            <PiiCleanupLabel cart={detail} t={t} />
          </div>
        </DetailSection>
      </div>
    </div>
  )
}

export default function CartsPage() {
  const t = useTranslations('pages.carts')
  const { locale } = useBackstageUiLocale()
  const uiLocale = (locale === 'uk' || locale === 'sk' ? locale : 'en') as BackstageCountryLocale
  const [carts, setCarts] = useState<BackstageCartListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'guest' | 'user'>('all')
  const [stateFilter, setStateFilter] =
    useState<NonNullable<BackstageCartsQuery['state']>>('all')
  const [localeFilter, setLocaleFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stateLabel = useCallback(
    (state: CartActivityState | null | undefined) => {
      switch (state) {
        case 'CART_ONLY':
          return t('stateCartOnlyLabel')
        case 'CHECKOUT_ACTIVE':
          return t('stateCheckoutActiveLabel')
        case 'CART_ABANDONED':
          return t('stateCartAbandonedLabel')
        case 'CHECKOUT_ABANDONED':
          return t('stateCheckoutAbandonedLabel')
        default:
          return '—'
      }
    },
    [t],
  )

  const loadCarts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageCarts({
        search: search.trim() || undefined,
        kind: kindFilter,
        state: stateFilter,
        locale: localeFilter === 'all' ? undefined : localeFilter,
        page,
        pageSize: 20,
      })
      setCarts(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      if (data.page > data.totalPages && data.totalPages >= 1) {
        setPage(1)
      }
    } catch (err) {
      setCarts([])
      setTotal(0)
      setError(err instanceof Error ? err.message : t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [search, kindFilter, stateFilter, localeFilter, page, t])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCarts()
    }, search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [loadCarts, search])

  useEffect(() => {
    setPage(1)
  }, [search, kindFilter, stateFilter, localeFilter])

  const emptyMessage = useMemo(() => {
    if (loading) return null
    if (error) return null
    if (carts.length === 0) return t('empty')
    return null
  }, [loading, error, carts.length, t])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button variant="outline" onClick={() => void loadCarts()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:flex-wrap">
            <div className="relative min-w-[12rem] flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={kindFilter}
              onValueChange={(value) => setKindFilter(value as typeof kindFilter)}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t('type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('kindAll')}</SelectItem>
                <SelectItem value="guest">{t('kindGuest')}</SelectItem>
                <SelectItem value="user">{t('kindUser')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={stateFilter}
              onValueChange={(value) => setStateFilter(value as typeof stateFilter)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('stateAll')}</SelectItem>
                <SelectItem value="active">{t('stateActive')}</SelectItem>
                <SelectItem value="abandoned">{t('stateAbandoned')}</SelectItem>
                <SelectItem value="cart_only">{t('stateCartOnly')}</SelectItem>
                <SelectItem value="checkout_started">{t('stateCheckoutStarted')}</SelectItem>
                <SelectItem value="cart_abandoned">{t('stateCartAbandoned')}</SelectItem>
                <SelectItem value="checkout_abandoned">{t('stateCheckoutAbandoned')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={localeFilter} onValueChange={setLocaleFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder={t('locale')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('locale')}</SelectItem>
                <SelectItem value="uk">uk</SelectItem>
                <SelectItem value="en">en</SelectItem>
                <SelectItem value="sk">sk</SelectItem>
                <SelectItem value="cs">cs</SelectItem>
                <SelectItem value="hu">hu</SelectItem>
                <SelectItem value="de">de</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading && carts.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('loading')}
          </div>
        ) : null}

        {emptyMessage ? (
          <p className="py-8 text-center text-muted-foreground">{emptyMessage}</p>
        ) : null}

        <div className="space-y-3">
          {carts.map((cart) => {
            const expanded = expandedId === cart.id
            return (
              <Card
                key={cart.id}
                className={cn(
                  'transition-[border-color,box-shadow] duration-150',
                  expanded && 'border-primary/35 shadow-sm ring-1 ring-primary/15',
                )}
              >
                <CardContent className="p-4">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    className="flex w-full items-start gap-3 text-left"
                    onClick={() => setExpandedId(expanded ? null : cart.id)}
                  >
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
                        expanded && 'rotate-180 text-foreground',
                      )}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CartStateBadge state={cart.state} label={stateLabel(cart.state)} />
                          <KindBadge
                            kind={cart.kind}
                            guest={t('guest')}
                            registered={t('registered')}
                          />
                          <span className="text-sm text-muted-foreground">
                            {cart.itemCount} поз. · {cart.totalQuantity} {t('pcs')} ·{' '}
                            {formatOrderMoney(cart.productsSubtotal, cart.currency)}
                          </span>
                        </div>
                        <p className="font-medium text-foreground">
                          {cart.customerName ||
                            (cart.kind === 'guest'
                              ? `${t('session')}: ${cart.guestSessionId?.slice(0, 8)}…`
                              : t('noName'))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[cart.customerPhone, cart.customerEmail].filter(Boolean).join(' · ') ||
                            '—'}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            {t('site')}:{' '}
                            <CountryDisplay
                              code={cart.siteCountryCode}
                              locale={uiLocale}
                              variant="compact"
                            />
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {t('delivery')}:{' '}
                            <CountryDisplay
                              code={cart.deliveryCountryCode}
                              locale={uiLocale}
                              variant="compact"
                            />
                          </span>
                          <span className="inline-flex items-center gap-1">
                            {t('billing')}:{' '}
                            <CountryDisplay
                              code={cart.billingCountryCode}
                              locale={uiLocale}
                              variant="compact"
                            />
                          </span>
                          {cart.locale ? (
                            <span>
                              {t('locale')}: {cart.locale}
                            </span>
                          ) : null}
                          {cart.deliveryMethod ? <span>{cart.deliveryMethod}</span> : null}
                          {cart.paymentMethod ? <span>{cart.paymentMethod}</span> : null}
                        </div>
                        <div className="hidden text-xs sm:block">
                          <PiiCleanupLabel cart={cart} t={t} />
                        </div>
                      </div>
                      <div className="shrink-0 space-y-1 text-sm text-muted-foreground">
                        <div>
                          {t('activity')}: {formatDateTime(cart.updatedAt, locale, 'datetime')}
                        </div>
                        <div>
                          {t('age')}: {formatAge(cart.ageMs)}
                        </div>
                        <div>
                          {t('checkout')}:{' '}
                          {cart.checkoutStartedAt
                            ? formatDateTime(cart.checkoutStartedAt, locale, 'datetime')
                            : t('checkoutNo')}
                        </div>
                        {cart.hasCheckoutDraftPii && cart.piiCleanupAt ? (
                          <div className="hidden sm:block">
                            {t('piiWillClean')}: {formatPiiCleanupDate(cart.piiCleanupAt, locale)}
                          </div>
                        ) : null}
                        <div className="sm:hidden">
                          <PiiCleanupLabel cart={cart} t={t} />
                        </div>
                      </div>
                    </div>
                  </button>

                  {expanded ? <CartDetailPanel cartId={cart.id} locale={uiLocale} /> : null}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('cartsPage', { total, page, totalPages })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('prev')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('cartsCount', { total })}</p>
        )}
      </div>
    </AdminLayout>
  )
}
