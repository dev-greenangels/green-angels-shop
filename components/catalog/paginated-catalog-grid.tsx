'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import {
  CatalogLoadMoreButton,
  CatalogPaginationControls,
} from '@/components/catalog/catalog-pagination-controls'
import { ProductCard } from '@/components/product-card'
import {
  CatalogProductListRows,
  type CatalogDiscountQuantityFilter,
} from '@/components/catalog/product-catalog-list-item'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { CATALOG_PAGE_SIZE } from '@/lib/catalog/constants'
import { serializeCatalogFiltersForListing, type CatalogFilters } from '@/lib/catalog/filter-plants'
import { useProductGridClassName } from '@/components/providers/catalog-settings-provider'
import {
  fetchCatalogProductsPage,
  type CatalogProductsPageMeta,
  type CatalogProductsParams,
} from '@/lib/catalog/products'
import type { Plant } from '@/lib/types'
import type { CatalogViewMode } from '@/lib/catalog/view-mode'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

const EMPTY_QUERY_PARAMS: Omit<CatalogProductsParams, 'limit' | 'page' | 'pageSize'> = {}

function mergeUniquePlants(current: Plant[], incoming: Plant[]) {
  const seen = new Set(current.map((plant) => plant.id))
  const merged = [...current]
  for (const plant of incoming) {
    if (seen.has(plant.id)) continue
    seen.add(plant.id)
    merged.push(plant)
  }
  return merged
}

function readPageFromSearchParams(searchParams: URLSearchParams) {
  return Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
}

function buildFetchKey(queryKey: string, sortBy: string, filtersKey: string, page: number) {
  return `${queryKey}|${sortBy}|${filtersKey}|${page}`
}

export type PaginatedCatalogGridInitialData = {
  plants: Plant[]
  meta: CatalogProductsPageMeta
}

export function PaginatedCatalogGrid({
  queryParams,
  filters,
  sortBy = 'name',
  syncPageToUrl = false,
  emptyMessage,
  gridClassName,
  viewMode = 'grid',
  onMetaChange,
  onProductsChange,
  listDiscountFilter,
  initialData,
  initialFetchKey,
}: {
  queryParams?: Omit<CatalogProductsParams, 'limit' | 'page' | 'pageSize'>
  filters?: CatalogFilters
  sortBy?: string
  syncPageToUrl?: boolean
  emptyMessage?: string
  gridClassName?: string
  viewMode?: CatalogViewMode
  onMetaChange?: (meta: CatalogProductsPageMeta) => void
  onProductsChange?: (plants: Plant[]) => void
  listDiscountFilter?: CatalogDiscountQuantityFilter
  initialData?: PaginatedCatalogGridInitialData
  initialFetchKey?: string
}) {
  const productGridClassName = useProductGridClassName()
  const locale = useLocale()
  const te = useTranslations('errors')
  const tc = useTranslations('common')
  const tCatalog = useTranslations('catalog')
  const resolvedEmptyMessage = emptyMessage ?? tCatalog('emptyProducts')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlPage = readPageFromSearchParams(searchParams)
  const queryKey = useMemo(
    () => JSON.stringify(queryParams ?? EMPTY_QUERY_PARAMS),
    [queryParams],
  )
  const stableQueryParams = useMemo(
    () => queryParams ?? EMPTY_QUERY_PARAMS,
    [queryKey],
  )

  const onMetaChangeRef = useRef(onMetaChange)
  onMetaChangeRef.current = onMetaChange
  const onProductsChangeRef = useRef(onProductsChange)
  onProductsChangeRef.current = onProductsChange

  const lastFetchedKeyRef = useRef<string | null>(null)
  const skipUrlFetchRef = useRef(false)
  const prevSortRef = useRef(sortBy)
  const prevQueryRef = useRef(queryKey)

  const skipInitialFetchRef = useRef(initialFetchKey ?? null)

  const [plants, setPlants] = useState<Plant[]>(initialData?.plants ?? [])
  const [page, setPage] = useState(initialData?.meta.page ?? urlPage)
  const [loadedThroughPage, setLoadedThroughPage] = useState(initialData?.meta.page ?? urlPage)
  const [total, setTotal] = useState(initialData?.meta.total ?? 0)
  const [totalPages, setTotalPages] = useState(initialData?.meta.totalPages ?? 1)
  const [loading, setLoading] = useState(!initialData)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const syncUrlPage = useCallback(
    (nextPage: number) => {
      if (!syncPageToUrl) return

      const current = readPageFromSearchParams(searchParams)
      const wantsParam = nextPage > 1
      const hasParam = searchParams.has('page')

      if (nextPage === current && (!wantsParam ? !hasParam : searchParams.get('page') === String(nextPage))) {
        return
      }

      skipUrlFetchRef.current = true
      const params = new URLSearchParams(searchParams.toString())
      if (nextPage <= 1) {
        params.delete('page')
      } else {
        params.set('page', String(nextPage))
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams, syncPageToUrl],
  )

  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
  const serializedFilters = useMemo(
    () =>
      filters
        ? serializeCatalogFiltersForListing(filters)
        : { characteristics: '', variantAttributes: '', stock: 'in_stock' as const },
    [filters],
  )

  const fetchPage = useCallback(
    async (targetPage: number, mode: 'replace' | 'append') => {
      const result = await fetchCatalogProductsPage({
        ...stableQueryParams,
        ...serializedFilters,
        locale,
        page: targetPage,
        pageSize: CATALOG_PAGE_SIZE,
        sort: sortBy,
      })

      setUnavailable(result.unavailable)
      setTotal(result.data.meta.total)
      setTotalPages(result.data.meta.totalPages)
      setPage(targetPage)
      setLoadedThroughPage((current) =>
        mode === 'append' ? Math.max(current, targetPage) : targetPage,
      )
      setPlants((current) =>
        mode === 'append' ? mergeUniquePlants(current, result.data.plants) : result.data.plants,
      )
      onMetaChangeRef.current?.(result.data.meta)

      return result
    },
    [stableQueryParams, sortBy, serializedFilters, locale],
  )

  const runFetch = useCallback(
    async (
      targetPage: number,
      mode: 'replace' | 'append',
      options?: { showLoading?: boolean },
    ) => {
      const showLoading = options?.showLoading ?? mode === 'replace'
      if (showLoading) setLoading(true)
      setError(null)

      try {
        const result = await fetchPage(targetPage, mode)
        if (result.unavailable) {
          if (mode === 'replace') setPlants([])
        }
      } catch (err) {
        lastFetchedKeyRef.current = null
        setUnavailable(false)
        setError(
          err instanceof Error ? err.message : tCatalog('loadingProducts'),
        )
        if (mode === 'replace') setPlants([])
        throw err
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [fetchPage],
  )

  useEffect(() => {
    onProductsChangeRef.current?.(plants)
  }, [plants])

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      const targetPage = syncPageToUrl ? urlPage : 1
      const fetchKey = buildFetchKey(queryKey, sortBy, filtersKey, targetPage)
      if (skipInitialFetchRef.current === fetchKey) {
        skipInitialFetchRef.current = null
        lastFetchedKeyRef.current = fetchKey
        onMetaChangeRef.current?.(initialData!.meta)
        return
      }
      skipInitialFetchRef.current = null
    }

    if (skipUrlFetchRef.current) {
      skipUrlFetchRef.current = false
      return
    }

    const sortOrQueryChanged =
      prevSortRef.current !== sortBy || prevQueryRef.current !== queryKey
    prevSortRef.current = sortBy
    prevQueryRef.current = queryKey

    if (sortOrQueryChanged && syncPageToUrl && urlPage > 1) {
      skipUrlFetchRef.current = true
      syncUrlPage(1)
      return
    }

    const targetPage = syncPageToUrl ? urlPage : 1
    const fetchKey = buildFetchKey(queryKey, sortBy, filtersKey, targetPage)
    if (lastFetchedKeyRef.current === fetchKey) return
    lastFetchedKeyRef.current = fetchKey

    let cancelled = false
    void runFetch(targetPage, 'replace').catch(() => {
      if (!cancelled) lastFetchedKeyRef.current = null
    })

    return () => {
      cancelled = true
    }
  }, [queryKey, sortBy, filtersKey, urlPage, syncPageToUrl, runFetch, syncUrlPage, initialData])

  const displayedPlants = plants

  const canLoadMore = loadedThroughPage < totalPages && plants.length < total

  const handlePageChange = async (nextPage: number) => {
    if (nextPage === page && plants.length > 0) return

    const fetchKey = buildFetchKey(queryKey, sortBy, filtersKey, nextPage)
    lastFetchedKeyRef.current = fetchKey
    skipUrlFetchRef.current = true

    try {
      await runFetch(nextPage, 'replace')
      syncUrlPage(nextPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      lastFetchedKeyRef.current = null
      skipUrlFetchRef.current = false
    }
  }

  const handleLoadMore = async () => {
    if (!canLoadMore || loadingMore) return

    const nextPage = loadedThroughPage + 1
    const fetchKey = buildFetchKey(queryKey, sortBy, filtersKey, nextPage)
    lastFetchedKeyRef.current = fetchKey
    skipUrlFetchRef.current = true

    setLoadingMore(true)
    setError(null)
    try {
      await runFetch(nextPage, 'append', { showLoading: false })
      syncUrlPage(nextPage)
    } catch {
      lastFetchedKeyRef.current = null
      skipUrlFetchRef.current = false
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    )
  }

  if (unavailable) {
    return (
      <ServiceUnavailableNotice
        message={te('catalogUnavailable')}
        className="mx-auto max-w-lg"
      />
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-destructive">{error}</p>
      </div>
    )
  }

  if (displayedPlants.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">{resolvedEmptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div
        className={cn(
          viewMode === 'grid'
            ? (gridClassName ?? productGridClassName)
            : 'flex flex-col gap-2',
        )}
      >
        {displayedPlants.map((plant) =>
          viewMode === 'list' ? (
            <CatalogProductListRows key={plant.id} plant={plant} discountFilter={listDiscountFilter} />
          ) : (
            <ProductCard key={plant.id} plant={plant} layout="grid" />
          ),
        )}
      </div>

      <CatalogLoadMoreButton
        loading={loadingMore}
        disabled={loading}
        remaining={total - plants.length}
        onClick={() => void handleLoadMore()}
      />

      <CatalogPaginationControls
        page={page}
        totalPages={totalPages}
        total={total}
        shownCount={plants.length}
        disabled={loading || loadingMore}
        onPageChange={(nextPage) => void handlePageChange(nextPage)}
      />
    </div>
  )
}
