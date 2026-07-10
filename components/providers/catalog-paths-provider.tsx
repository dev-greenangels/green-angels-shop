'use client'

import { createContext, useContext, useMemo } from 'react'

import {
  catalogRootHref,
  categoryHref,
  productHref,
  resolveCatalogHref,
} from '@/lib/catalog/paths'

type CatalogPathsState = {
  catalogRootSlug: string | null
  catalogHref: string
  categoryHref: (slug: string) => string
  productHref: (categorySlug: string, productSlug: string) => string
}

const CatalogPathsContext = createContext<CatalogPathsState>({
  catalogRootSlug: null,
  catalogHref: '/catalog',
  categoryHref,
  productHref,
})

export function CatalogPathsProvider({
  catalogRootSlug,
  children,
}: {
  catalogRootSlug: string | null
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({
      catalogRootSlug,
      catalogHref: resolveCatalogHref(catalogRootSlug),
      categoryHref,
      productHref,
    }),
    [catalogRootSlug],
  )

  return <CatalogPathsContext.Provider value={value}>{children}</CatalogPathsContext.Provider>
}

export function useCatalogPaths(): CatalogPathsState {
  return useContext(CatalogPathsContext)
}

export function useCatalogHref(): string {
  return useContext(CatalogPathsContext).catalogHref
}

export function useCatalogRootSlug(): string | null {
  return useContext(CatalogPathsContext).catalogRootSlug
}

export { catalogRootHref, categoryHref, productHref }
