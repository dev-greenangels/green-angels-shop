import dynamic from 'next/dynamic'

import type { ReviewsPageResult } from '@/lib/reviews/types'
import type { Plant } from '@/lib/types'

const ProductReviewsSection = dynamic(
  () =>
    import('@/components/reviews/product-reviews-section').then((mod) => ({
      default: mod.ProductReviewsSection,
    })),
  {
    loading: () => <div className="mb-8 h-40 animate-pulse rounded-xl bg-muted/60" aria-hidden />,
  },
)

const ProductRelatedPlants = dynamic(
  () =>
    import('@/components/product/product-related-plants').then((mod) => ({
      default: mod.ProductRelatedPlants,
    })),
  {
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted/60" aria-hidden />,
  },
)

const RecentlyViewedSection = dynamic(
  () =>
    import('@/components/product/recently-viewed-section').then((mod) => ({
      default: mod.RecentlyViewedSection,
    })),
  {
    loading: () => null,
  },
)

export function ProductPageDeferredReviews({
  productId,
  productName,
  initialPage,
}: {
  productId: string
  productName: string
  initialPage: ReviewsPageResult
}) {
  return (
    <ProductReviewsSection
      productId={productId}
      productName={productName}
      initialPage={initialPage}
    />
  )
}

export function ProductPageDeferredRelated({
  plants,
  title,
  countLabel,
}: {
  plants: Plant[]
  title: string
  countLabel: string
}) {
  return <ProductRelatedPlants plants={plants} title={title} countLabel={countLabel} />
}

export function ProductPageDeferredRecentlyViewed({
  excludeProductId,
}: {
  excludeProductId: string
}) {
  return <RecentlyViewedSection page="product" excludeProductId={excludeProductId} />
}
