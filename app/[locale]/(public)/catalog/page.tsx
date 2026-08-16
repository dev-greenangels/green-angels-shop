import type { Metadata } from 'next'
import { getLocale, setRequestLocale } from 'next-intl/server'

import { CatalogLandingClient } from '@/components/catalog/catalog-landing-client'
import { Navigation } from '@/components/navigation'
import { fetchCatalogFilterDefinitions } from '@/lib/backstage/characteristics'
import {
  fetchCategoryTreeWithStatus,
  resolveCatalogLandingContent,
} from '@/lib/catalog/categories'
import { CATALOG_PAGE_SIZE } from '@/lib/catalog/constants'
import { shouldShowProducts } from '@/lib/catalog/display'
import { buildCatalogLandingMetadata } from '@/lib/catalog/metadata'
import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import { fetchCatalogProductsPage } from '@/lib/catalog/products'
import { fetchPublicSiteSettings, getCatalogPageSettings } from '@/lib/settings/fetch'
import { redirect } from '@/i18n/navigation'

type PageProps = {
  searchParams: Promise<{ page?: string; sort?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const locale = await getLocale()
  const resolved = await searchParams
  const page = Math.max(1, Number(resolved.page ?? '1') || 1)
  const sort = resolved.sort?.trim() || 'name'
  return buildCatalogLandingMetadata(locale, { page, sort })
}

/**
 * Legacy `/catalog` → канонічний корінь каталогу (`/{rootSlug}`).
 * Якщо кореня немає — рендеримо порожній лендинг (не редіректимо на себе).
 */
export default async function LegacyCatalogPage({ searchParams }: PageProps) {
  const locale = await getLocale()
  setRequestLocale(locale)

  const catalogRootSlug = await fetchCatalogRootSlug(locale)
  if (catalogRootSlug) {
    redirect({ href: resolveCatalogHref(catalogRootSlug), locale })
  }

  const resolvedSearchParams = await searchParams
  const page = Math.max(1, Number(resolvedSearchParams.page ?? '1') || 1)
  const sort = resolvedSearchParams.sort?.trim() || 'name'

  const [settingsResult, treeResult] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchCategoryTreeWithStatus(locale),
  ])

  const catalogSettings = getCatalogPageSettings(settingsResult)
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
