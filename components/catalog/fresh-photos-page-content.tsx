'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Navigation } from '@/components/navigation'
import { ClientPublicPageBreadcrumbs } from '@/components/client-public-page-breadcrumbs'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'
import { CatalogPaginationControls } from '@/components/catalog/catalog-pagination-controls'
import { FreshPhotoCard, FreshPhotoCardSkeleton } from '@/components/catalog/fresh-photo-card'
import { FreshPhotoLightbox } from '@/components/catalog/fresh-photo-lightbox'
import { Button } from '@/components/ui/button'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Skeleton } from '@/components/ui/skeleton'
import { usePathname, useRouter } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import {
  resolveCatalogLandingContent,
  type CategoryTreeNode,
} from '@/lib/catalog/categories'
import { formatNumberForLocale } from '@/lib/i18n/intl-locale'
import {
  siteContentShellClassName,
  siteStickyToolbarControlsClusterClassName,
  siteStickyToolbarInnerClassName,
  siteStickyToolbarOuterClassName,
} from '@/lib/layout/site-shell'
import type { CatalogPhotoItem, CatalogPhotosPage } from '@/lib/variant-photos/types'
import { cn } from '@/lib/utils'

type EnrichedPhoto = CatalogPhotoItem

type EnrichedPhotosPage = {
  items: EnrichedPhoto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const FRESH_PHOTOS_GRID_CLASS = cn(
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
)

function FreshPhotosGridSkeleton() {
  return (
    <div className={FRESH_PHOTOS_GRID_CLASS}>
      {Array.from({ length: 12 }).map((_, index) => (
        <FreshPhotoCardSkeleton key={index} />
      ))}
    </div>
  )
}

function FreshPhotosChipsSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="flex min-w-0 items-center overflow-hidden">
        <div className="flex w-0 min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

function toEnrichedPhoto(photo: CatalogPhotoItem): EnrichedPhoto {
  return photo
}

export function FreshPhotosPageContent() {
  const locale = useLocale()
  const t = useTranslations('catalog')
  const tNav = useTranslations('nav')
  const catalogHref = useCatalogHref()
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
  const searchFromUrl = searchParams.get('q')?.trim() || ''
  const categoryFromUrl = searchParams.get('category')?.trim() || ''
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const [searchFocused, setSearchFocused] = useState(false)
  const blurHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [data, setData] = useState<EnrichedPhotosPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EnrichedPhoto | null>(null)
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const filterCategories = useMemo(
    () => resolveCatalogLandingContent(categoryTree).subcategories,
    [categoryTree],
  )

  const showCategoryChips = searchFocused || Boolean(categoryFromUrl)

  useEffect(() => {
    setSearchInput(searchFromUrl)
  }, [searchFromUrl])

  useEffect(() => {
    return () => {
      if (blurHideTimerRef.current) clearTimeout(blurHideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    void fetch(`/api/catalog/categories?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((json: CategoryTreeNode[]) => {
        if (!cancelled) setCategoryTree(Array.isArray(json) ? json : [])
      })
      .catch(() => {
        if (!cancelled) setCategoryTree([])
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', '24')
    params.set('locale', locale)
    if (searchFromUrl) params.set('search', searchFromUrl)
    if (categoryFromUrl) params.set('category', categoryFromUrl)

    void fetch(`/api/catalog/photos?${params.toString()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: CatalogPhotosPage | null) => {
        if (cancelled || !json) {
          if (!cancelled) setData(null)
          return
        }
        setData({
          ...json,
          items: (json.items ?? []).map(toEnrichedPhoto),
        })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, searchFromUrl, categoryFromUrl, locale])

  const isInitialLoading = loading && !data
  const isRefreshing = loading && Boolean(data)

  const pushQuery = useCallback(
    (next: { q?: string; category?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      let shouldScrollToTop = false
      if (next.q !== undefined) {
        if (next.q.trim()) params.set('q', next.q.trim())
        else params.delete('q')
        params.delete('page')
        shouldScrollToTop = true
      }
      if (next.category !== undefined) {
        if (next.category.trim()) params.set('category', next.category.trim())
        else params.delete('category')
        params.delete('page')
        shouldScrollToTop = true
      }
      if (next.page !== undefined) {
        if (next.page > 1) params.set('page', String(next.page))
        else params.delete('page')
        shouldScrollToTop = true
      }
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
      if (shouldScrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [pathname, router, searchParams],
  )

  const openPhoto = useCallback((photo: EnrichedPhoto) => {
    setSelected(photo)
  }, [])

  const hasActiveFilters = Boolean(searchFromUrl || categoryFromUrl)

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
        <div className={cn(siteContentShellClassName, 'min-w-0 py-10 md:py-14')}>
          <ClientPublicPageBreadcrumbs
            className="mb-4"
            items={[
              { label: tNav('catalog'), href: catalogHref },
              { label: tNav('freshPhotos') },
            ]}
          />

          <div className="mb-8 max-w-3xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {t('freshPhotosTitle')}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{t('freshPhotosSubtitle')}</p>
            {data && !isInitialLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('freshPhotosCount', { count: formatNumberForLocale(data.total, locale) })}
              </p>
            ) : isInitialLoading ? (
              <Skeleton className="mt-2 h-4 w-28" />
            ) : null}
          </div>

          <div className={cn(siteStickyToolbarOuterClassName, 'overflow-x-hidden')}>
            <div
              className={cn(
                siteStickyToolbarInnerClassName,
                'w-full min-w-0 flex-col gap-2 py-2.5 lg:flex-row lg:items-center lg:gap-2 lg:py-2',
              )}
            >
              <form
                className="flex w-full shrink-0 items-center gap-2 lg:w-auto lg:max-w-[18rem]"
                onSubmit={(event) => {
                  event.preventDefault()
                  pushQuery({ q: searchInput })
                }}
              >
                <InputWithClear
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => {
                    if (blurHideTimerRef.current) {
                      clearTimeout(blurHideTimerRef.current)
                      blurHideTimerRef.current = null
                    }
                    setSearchFocused(true)
                  }}
                  onBlur={() => {
                    blurHideTimerRef.current = setTimeout(() => {
                      setSearchFocused(false)
                      blurHideTimerRef.current = null
                    }, 180)
                  }}
                  onClear={() => {
                    setSearchInput('')
                    pushQuery({ q: '' })
                  }}
                  placeholder={t('freshPhotosSearchPlaceholder')}
                  leadingIcon={<Search className="h-4 w-4" />}
                  className="pl-10"
                  clearPaddingClass="pr-10"
                  aria-label={t('freshPhotosSearchPlaceholder')}
                />
                <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                  {tc('search')}
                </Button>
              </form>

              {showCategoryChips ? (
                categoriesLoading ? (
                  <FreshPhotosChipsSkeleton />
                ) : filterCategories.length > 0 ? (
                  <div className="flex w-full min-w-0 items-center gap-1.5 lg:flex-1">
                    <div
                      className={cn(
                        'flex min-w-0 flex-1 items-center overflow-hidden',
                        '-mx-[var(--site-shell-padding-x)] pl-[var(--site-shell-padding-x)] lg:mx-0 lg:pl-0',
                      )}
                    >
                      <div
                        className={cn(
                          'flex w-0 min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5',
                          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                        )}
                      >
                        {filterCategories.map((category) => {
                          const active = categoryFromUrl === category.slug
                          return (
                            <Button
                              key={category.id}
                              type="button"
                              size="sm"
                              variant={active ? 'default' : 'outline'}
                              className="h-7 shrink-0 rounded-full px-2.5 text-xs"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() =>
                                pushQuery({
                                  category: active ? '' : category.slug,
                                })
                              }
                            >
                              {category.name}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                    {hasActiveFilters ? (
                      <div className={cn(siteStickyToolbarControlsClusterClassName, 'pl-1.5')}>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7 shrink-0 rounded-full border border-border/70 bg-background shadow-sm hover:bg-muted"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setSearchInput('')
                            pushQuery({ q: '', category: '' })
                          }}
                          aria-label={t('freshPhotosResetFilters')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null
              ) : hasActiveFilters ? (
                <div className={cn(siteStickyToolbarControlsClusterClassName, 'self-end lg:self-auto')}>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 shrink-0 rounded-full border border-border/70 bg-background shadow-sm hover:bg-muted"
                    onClick={() => {
                      setSearchInput('')
                      pushQuery({ q: '', category: '' })
                    }}
                    aria-label={t('freshPhotosResetFilters')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          {isInitialLoading ? (
            <FreshPhotosGridSkeleton />
          ) : !data?.items.length ? (
            <p className="py-16 text-center text-muted-foreground">{t('freshPhotosEmpty')}</p>
          ) : (
            <div className={cn(isRefreshing && 'pointer-events-none opacity-60 transition-opacity')}>
              <div className={FRESH_PHOTOS_GRID_CLASS}>
                {data.items.map((photo) => (
                  <FreshPhotoCard
                    key={photo.id}
                    photo={photo}
                    locale={locale}
                    onImageClick={() => openPhoto(photo)}
                  />
                ))}
              </div>

              <CatalogPaginationControls
                className="mt-10"
                page={page}
                totalPages={data.totalPages}
                total={data.total}
                shownCount={data.items.length}
                disabled={isRefreshing}
                onPageChange={(nextPage) => pushQuery({ page: nextPage })}
              />
            </div>
          )}
        </div>
      </main>

      <FreshPhotoLightbox photo={selected} onClose={() => setSelected(null)} />
    </>
  )
}
