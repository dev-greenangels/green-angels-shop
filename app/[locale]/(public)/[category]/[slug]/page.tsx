import type { Metadata } from 'next'
import { ProductPageView } from '@/components/product/product-page-view'
import { ProductJsonLd } from '@/components/seo/product-json-ld'
import { ServiceUnavailableShell } from '@/components/service-unavailable-shell'
import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { fetchCatalogCategoryDetail, fetchCategoryTree } from '@/lib/catalog/categories'
import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import { RELATED_PRODUCTS_LIMIT } from '@/lib/catalog/constants'
import { productHref } from '@/lib/catalog/paths'
import { fetchCatalogProductBySlug, fetchCatalogProducts } from '@/lib/catalog/products'
import { buildProductPageMetadata } from '@/lib/catalog/product-metadata'
import { fetchCommerceSettings } from '@/lib/commerce/fetch'
import { applyCountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import { localePath } from '@/lib/locale-path'
import { buildPageAlternates } from '@/lib/seo/page-alternates'
import { absoluteCatalogImages } from '@/lib/seo/product-json-ld'
import { resolvePublicOriginFromRequest, resolveSeoRequestContext } from '@/lib/seo/request-context'
import { parseReviewsPage } from '@/lib/reviews/fetch'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { PRODUCT_REVIEWS_PAGE_SIZE } from '@/lib/reviews/types'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
} from '@/lib/settings/fetch'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound, permanentRedirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ category: string; slug: string; locale: string }>
}

async function loadProductReviewsPage(productId: string): Promise<ReviewsPageResult> {
  try {
    const res = await fetchBackend(
      `/reviews?productId=${encodeURIComponent(productId)}&page=1&pageSize=${PRODUCT_REVIEWS_PAGE_SIZE}&sort=newest`,
      { cache: 'no-store' },
    )
    if (!res.ok) return parseReviewsPage([])
    const data = await readBackendJson(res)
    return parseReviewsPage(data)
  } catch {
    return parseReviewsPage([])
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug, locale } = await params
  return buildProductPageMetadata(locale, category, slug)
}

export default async function ProductInCategoryPage({ params }: PageProps) {
  const { category: categorySlug, slug } = await params
  const locale = await getLocale()

  const productResult = await fetchCatalogProductBySlug(slug, locale)
  if (productResult.unavailable) {
    return (
      <ServiceUnavailableShell
        title="Товар тимчасово недоступний"
        message="Не вдалося завантажити інформацію про товар. Спробуйте оновити сторінку пізніше."
      />
    )
  }

  if (!productResult.data) {
    notFound()
  }

  const plant = productResult.data

  if (plant.category && plant.category !== categorySlug) {
    permanentRedirect(localePath(productHref(plant.category, plant.slug), locale))
  }

  const [categoryPathResult, relatedResult, productReviewsPage, categoryTree, origin, seoCtx, siteSettings, commerce] =
    await Promise.all([
      plant.category
        ? fetchCatalogCategoryDetail(plant.category, locale)
        : Promise.resolve({ data: null, unavailable: false }),
      fetchCatalogProducts({
        categoryId: plant.categoryId,
        excludeId: plant.id,
        limit: RELATED_PRODUCTS_LIMIT,
        locale,
      }),
      loadProductReviewsPage(plant.id),
      fetchCategoryTree(locale),
      resolvePublicOriginFromRequest(),
      resolveSeoRequestContext(locale),
      fetchPublicSiteSettings(),
      fetchCommerceSettings(locale),
    ])

  const categoryBreadcrumbs = categoryPathResult.data?.breadcrumbs ?? []
  const catalogRootSlug = findCatalogRootNode(categoryTree)?.slug ?? null
  const path = plant.category
    ? productHref(plant.category, plant.slug)
    : productHref(categorySlug, plant.slug)
  const alternates = buildPageAlternates({
    origin: seoCtx.origin,
    locale: seoCtx.locale,
    pathname: path,
    availableLocales: seoCtx.availableLocales,
    xDefaultLocale: seoCtx.xDefaultLocale,
    marketRegion: seoCtx.marketRegion,
    countryCode: seoCtx.countryCode,
    enabledCountrySites: seoCtx.enabledCountrySites,
    countryHostsEnv: process.env.GA_COUNTRY_HOSTS,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
  const market = getMarketSettings(siteSettings)
  const overlay = applyCountrySiteOverlay(market, seoCtx.countryCode)
  const cartTaxRatePercent = getCartCheckoutSettings(siteSettings).taxRatePercent
  const offerCtx = {
    market,
    overlay,
    commerce,
    cartTaxRatePercent,
  }
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const productUrl = alternates?.canonical ?? ''

  return (
    <>
      {productUrl ? (
        <ProductJsonLd
          plant={plant}
          productUrl={productUrl}
          locale={locale}
          brand={tCommon('brand')}
          images={absoluteCatalogImages(plant.images)}
          latinName={plant.latinName}
          alternateNames={plant.searchSynonyms}
          ctx={offerCtx}
        />
      ) : null}
      <ProductPageView
        plant={plant}
        categoryBreadcrumbs={categoryBreadcrumbs}
        catalogRootSlug={catalogRootSlug}
        relatedPlants={relatedResult.data}
        productReviewsPage={productReviewsPage}
        canonicalOrigin={origin}
      />
    </>
  )
}
