'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { mapListItemToPlant } from '@/lib/catalog/map-product'
import { PRODUCT_CARD_CAROUSEL_SLOT_CLASS } from '@/lib/catalog/product-card-layout'
import type { CatalogProductListItem } from '@/lib/catalog/types'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import {
  registerRecentlyViewedSettingsLoader,
  useRecentlyViewedIds,
} from '@/lib/recently-viewed-store'
import { DEFAULT_RECENTLY_VIEWED_SETTINGS } from '@/lib/settings/recently-viewed'
import type { RecentlyViewedPageKey, RecentlyViewedSettings } from '@/lib/settings/recently-viewed'
import { cn } from '@/lib/utils'

let cachedSettings: RecentlyViewedSettings | null = null
let settingsPromise: Promise<RecentlyViewedSettings> | null = null

async function loadRecentlyViewedSettings(): Promise<RecentlyViewedSettings> {
  if (cachedSettings) return cachedSettings
  if (!settingsPromise) {
    settingsPromise = fetch('/api/catalog/settings', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return DEFAULT_RECENTLY_VIEWED_SETTINGS
        const data = (await res.json()) as { recentlyViewed?: RecentlyViewedSettings }
        return data.recentlyViewed ?? DEFAULT_RECENTLY_VIEWED_SETTINGS
      })
      .catch(() => DEFAULT_RECENTLY_VIEWED_SETTINGS)
      .then((settings) => {
        cachedSettings = settings
        return settings
      })
  }
  return settingsPromise
}

registerRecentlyViewedSettingsLoader(async () => {
  const settings = await loadRecentlyViewedSettings()
  return { enabled: settings.enabled, maxItems: settings.maxItems }
})

export function clearRecentlyViewedSettingsCache() {
  cachedSettings = null
  settingsPromise = null
}

const SCROLL_NAV_CLASS =
  'size-9 shrink-0 rounded-full border-border/60 bg-background/90 shadow-sm backdrop-blur-sm hover:border-primary/30 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-30'

function RecentlyViewedSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={PRODUCT_CARD_CAROUSEL_SLOT_CLASS}>
          <div className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </>
  )
}

type RecentlyViewedSectionProps = {
  page: RecentlyViewedPageKey
  excludeProductId?: string
  className?: string
  shell?: boolean
  initialSettings?: RecentlyViewedSettings
}

export function RecentlyViewedSection({
  page,
  excludeProductId,
  className,
  shell = true,
  initialSettings,
}: RecentlyViewedSectionProps) {
  const t = useTranslations('recentlyViewed')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const productIds = useRecentlyViewedIds()
  if (initialSettings && !cachedSettings) {
    cachedSettings = initialSettings
  }
  const [settings, setSettings] = useState<RecentlyViewedSettings | null>(
    initialSettings ?? cachedSettings,
  )
  const [plants, setPlants] = useState<CatalogProductListItem[]>([])
  const [loading, setLoading] = useState(false)

  const visibleIds = useMemo(() => {
    const filtered = excludeProductId
      ? productIds.filter((id) => id !== excludeProductId)
      : productIds
    const cap = settings?.maxItems ?? DEFAULT_RECENTLY_VIEWED_SETTINGS.maxItems
    return filtered.slice(0, cap)
  }, [excludeProductId, productIds, settings?.maxItems])

  const idsKey = useMemo(() => visibleIds.join(','), [visibleIds])
  const skeletonCount = Math.min(visibleIds.length, 4)
  const itemCount = plants.length || visibleIds.length

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollPrev(el.scrollLeft > 4)
    setCanScrollNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scrollByPage = useCallback((direction: 'prev' | 'next') => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.75, 240)
    el.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (initialSettings) return
    let cancelled = false
    void loadRecentlyViewedSettings().then((next) => {
      if (!cancelled) setSettings(next)
    })
    return () => {
      cancelled = true
    }
  }, [initialSettings])

  useEffect(() => {
    if (!visibleIds.length) {
      setPlants([])
      return
    }

    let cancelled = false
    setLoading(true)

    void fetch(`/api/catalog/products?ids=${encodeURIComponent(idsKey)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return []
        const data = (await res.json()) as CatalogProductListItem[]
        return Array.isArray(data) ? data : []
      })
      .then((rows) => {
        if (cancelled) return
        const order = new Map(visibleIds.map((id, index) => [id, index]))
        const sorted = [...rows].sort(
          (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
        )
        setPlants(sorted)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [idsKey, visibleIds])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
    }
  }, [loading, plants, updateScrollState])

  if (!settings?.enabled || !settings.pages[page]) return null
  if (!visibleIds.length) return null
  if (!loading && !plants.length) return null

  const inner = (
    <>
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-serif text-2xl font-medium leading-snug text-foreground md:text-3xl">
              {settings.title}
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              {t('count', { count: itemCount })}
            </p>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={SCROLL_NAV_CLASS}
            disabled={!canScrollPrev}
            onClick={() => scrollByPage('prev')}
            aria-label={t('prevSlide')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={SCROLL_NAV_CLASS}
            disabled={!canScrollNext}
            onClick={() => scrollByPage('next')}
            aria-label={t('nextSlide')}
          >
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] md:-mx-0 md:px-0 pb-4 md:pb-4"
      >
        <div className="flex w-max gap-4">
          {loading && !plants.length ? (
            <RecentlyViewedSkeleton count={skeletonCount} />
          ) : (
            plants.map((item) => (
              <div key={item.id} className={PRODUCT_CARD_CAROUSEL_SLOT_CLASS}>
                <ProductCard plant={mapListItemToPlant(item)} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )

  if (!shell) {
    return (
      <section
        className={cn(
          className,
          'relative overflow-hidden rounded-2xl border border-border/50 bg-muted/40 p-5 shadow-sm md:p-7',
        )}
        aria-label={settings.title}
      >
        {inner}
      </section>
    )
  }

  return (
    <section
      className="relative overflow-hidden border-y border-border/40 bg-transparent py-8 md:py-10"
      aria-label={settings.title}
    >
      <div className={cn(siteContentShellClassName, className)}>{inner}</div>
    </section>
  )
}
