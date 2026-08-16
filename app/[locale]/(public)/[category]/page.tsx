import type { Metadata } from 'next'
import { getLocale, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { CatalogLandingClient } from '@/components/catalog/catalog-landing-client'
import { CategoryCatalogClient } from '@/components/catalog/category-catalog-client'
import { Navigation } from '@/components/navigation'
import { fetchCatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import {
  fetchCatalogCategoryVisibleCards,
  fetchCategoryTreeWithStatus,
  resolveCatalogLandingContent,
} from '@/lib/catalog/categories'
import { CATALOG_PAGE_SIZE } from '@/lib/catalog/constants'
import { shouldShowProducts } from '@/lib/catalog/display'
import { buildCatalogLandingMetadata, buildCategoryMetadata } from '@/lib/catalog/metadata'
import { fetchCatalogProductsPage } from '@/lib/catalog/products'
import { fetchPublicSiteSettings, getCatalogPageSettings } from '@/lib/settings/fetch'

type PageProps = {
  params: Promise<{ category: string; locale: string }>
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category, locale } = await params
  const resolved = await searchParams
  const page = Math.max(1, Number(resolved.page ?? '1') || 1)
  const sort = resolved.sort?.trim() || 'name'
  const tree = await fetchCategoryTreeWithStatus(locale)
  const rootSlug = findCatalogRootNode(tree.data)?.slug
  if (rootSlug && category === rootSlug) {
    return buildCatalogLandingMetadata(locale, { page, sort })
  }
  return buildCategoryMetadata(category, locale, { page, sort })
}

export default async function CategoryOrCatalogPage({ params, searchParams }: PageProps) {
  const { category: categorySlug } = await params
  const locale = await getLocale()
  setRequestLocale(locale)

  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page ?? '1') || 1)
  const sort = resolvedSearchParams.sort?.trim() || 'name'

  const [settingsResult, treeResult] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchCategoryTreeWithStatus(locale),
  ])

  const catalogSettings = getCatalogPageSettings(settingsResult)
  const catalogRootSlug = treeResult.unavailable
    ? null
    : findCatalogRootNode(treeResult.data)?.slug ?? null

  if (catalogRootSlug && categorySlug === catalogRootSlug) {
    const landing = resolveCatalogLandingContent(treeResult.data)
    const childCount = landing.subcategories.length
    const showProducts = shouldShowProducts(catalogSettings.categoryDisplay, childCount)

    const [productsResult, filterDefinitions] = await Promise.all([
      showProducts
        ? fetchCatalogProductsPage({
            categorySlug: landing.productCategorySlug,
            locale,
            page,
            pageSize: CATALOG_PAGE_SIZE,
            sort,
          })
        : Promise.resolve(null),
      fetchCatalogFilterDefinitions({
        locale,
        categorySlug: landing.productCategorySlug,
      }),
    ])

    return (
      <>
        <Navigation />
        <main className="flex flex-1 flex-col bg-transparent [overflow-anchor:none]">
          <CatalogLandingClient
            catalogRoot={landing.root}
            subcategories={landing.subcategories}
            productCategorySlug={landing.productCategorySlug}
            categoryDisplay={catalogSettings.categoryDisplay}
            initialProducts={productsResult?.data}
            initialFilterDefinitions={filterDefinitions}
            unavailable={treeResult.unavailable || productsResult?.unavailable === true}
            initialPage={page}
            initialSort={sort}
          />
        </main>
      </>
    )
  }

  const [categoryResult, productsResult, filterDefinitions] = await Promise.all([
    fetchCatalogCategoryVisibleCards(categorySlug, locale),
    fetchCatalogProductsPage({
      categorySlug,
      locale,
      page,
      pageSize: CATALOG_PAGE_SIZE,
      sort,
    }),
    fetchCatalogFilterDefinitions({
      locale,
      categorySlug,
    }),
  ])

  if (!categoryResult.data) {
    notFound()
  }

  return (
    <>
      <Navigation />
      <main className="flex flex-1 flex-col bg-transparent [overflow-anchor:none]">
        <CategoryCatalogClient
          categorySlug={categorySlug}
          category={categoryResult.data.detail}
          visibleCards={categoryResult.data.visibleCards}
          catalogRootSlug={catalogRootSlug}
          initialProducts={productsResult.data}
          initialFilterDefinitions={filterDefinitions}
          unavailable={categoryResult.unavailable || productsResult.unavailable}
          initialPage={page}
          initialSort={sort}
        />
      </main>
    </>
  )
}
