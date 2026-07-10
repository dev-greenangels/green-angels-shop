import { ProductPageView } from '@/components/product/product-page-view'
import { ServiceUnavailableShell } from '@/components/service-unavailable-shell'
import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { fetchCatalogCategoryDetail, fetchCategoryTree } from '@/lib/catalog/categories'
import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import { productHref } from '@/lib/catalog/paths'
import { fetchCatalogProductBySlug, fetchCatalogProducts } from '@/lib/catalog/products'
import { parseReviewsPage } from '@/lib/reviews/fetch'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { PRODUCT_REVIEWS_PAGE_SIZE } from '@/lib/reviews/types'
import { redirect } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

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

export default async function ProductInCategoryPage({
  params,
}: {
  params: Promise<{ category: string; slug: string; locale: string }>
}) {
  const { category: categorySlug, slug } = await params
  const locale = await getLocale()

  const productResult = await fetchCatalogProductBySlug(slug)
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
    redirect({ href: productHref(plant.category, plant.slug), locale })
  }

  const [categoryPathResult, relatedResult, productReviewsPage, categoryTree] = await Promise.all([
    plant.category ? fetchCatalogCategoryDetail(plant.category) : Promise.resolve({ data: null, unavailable: false }),
    fetchCatalogProducts({
      categoryId: plant.categoryId,
      excludeId: plant.id,
      limit: 4,
    }),
    loadProductReviewsPage(plant.id),
    fetchCategoryTree(),
  ])

  const categoryBreadcrumbs = categoryPathResult.data?.breadcrumbs ?? []
  const catalogRootSlug = findCatalogRootNode(categoryTree)?.slug ?? null

  return (
    <ProductPageView
      plant={plant}
      categoryBreadcrumbs={categoryBreadcrumbs}
      catalogRootSlug={catalogRootSlug}
      relatedPlants={relatedResult.data}
      productReviewsPage={productReviewsPage}
    />
  )
}
