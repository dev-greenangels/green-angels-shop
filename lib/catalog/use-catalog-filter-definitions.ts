'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale } from 'next-intl'

import {
  fetchCatalogFilterDefinitions,
  serializeCatalogFilters,
  type CatalogFilterDefinitions,
} from '@/lib/backstage/characteristics'
import type { CatalogFilters } from '@/lib/catalog/filter-plants'
import type { CatalogPriceBounds } from '@/lib/catalog/filter-plants'

export type CatalogFilterScope = {
  categorySlug?: string
  search?: string
}

const EMPTY_DEFINITIONS: CatalogFilterDefinitions = {
  characteristics: [],
  variantAttributes: [],
  price: { min: 0, max: 0 },
}

const FACET_DEBOUNCE_MS = 280

function buildFacetFetchKey(scopeKey: string, filtersKey: string) {
  return `${scopeKey}|${filtersKey}`
}

export function useCatalogFilterDefinitions(
  scope?: CatalogFilterScope,
  filters?: CatalogFilters,
  options?: {
    initialDefinitions?: CatalogFilterDefinitions
    initialFetchKey?: string
  },
) {
  const locale = useLocale()
  const scopeKey = JSON.stringify(scope ?? {})
  const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
  const fetchKey = buildFacetFetchKey(scopeKey, filtersKey)

  const [definitions, setDefinitions] = useState<CatalogFilterDefinitions | null>(
    options?.initialDefinitions ?? null,
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const skippedInitialKeyRef = useRef(options?.initialFetchKey ?? null)
  const definitionsRef = useRef(definitions)
  definitionsRef.current = definitions

  useEffect(() => {
    if (skippedInitialKeyRef.current === fetchKey) {
      skippedInitialKeyRef.current = null
      return
    }

    let cancelled = false
    if (definitionsRef.current != null) {
      setIsRefreshing(true)
    }

    const serialized = filters ? serializeCatalogFilters(filters) : null
    const timer = window.setTimeout(() => {
      void fetchCatalogFilterDefinitions({
        locale,
        ...scope,
        characteristics: serialized?.characteristics || undefined,
        variantAttributes: serialized?.variantAttributes || undefined,
        priceMin: serialized?.priceMin,
        priceMax: serialized?.priceMax,
      })
        .then((data) => {
          if (!cancelled) {
            setDefinitions(data)
            setIsRefreshing(false)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setDefinitions(EMPTY_DEFINITIONS)
            setIsRefreshing(false)
          }
        })
    }, FACET_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [locale, scopeKey, filtersKey, fetchKey, scope, filters])

  const priceBounds: CatalogPriceBounds = definitions?.price ?? { min: 0, max: 0 }

  return {
    definitions,
    priceBounds,
    loading: definitions == null,
    isRefreshing,
  }
}
