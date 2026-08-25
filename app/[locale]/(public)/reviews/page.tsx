import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ReviewsPageContent } from '@/components/reviews/reviews-page-content'
import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { parseReviewsPage } from '@/lib/reviews/fetch'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { REVIEWS_PAGE_SIZE } from '@/lib/reviews/types'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'
import { cn } from '@/lib/utils'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'reviews' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  return buildIndexablePageMetadata(locale, '/reviews', {
    title: `${t('pageTitle')} · ${siteName}`,
    description: t('pageDescription', { brand: siteName }),
    siteName,
  })
}

async function loadPublishedReviewsPage(): Promise<ReviewsPageResult> {
  try {
    const res = await fetchBackend(
      `/reviews?page=1&pageSize=${REVIEWS_PAGE_SIZE}&sort=newest`,
      { cache: 'no-store' },
    )
    if (!res.ok) return parseReviewsPage([])
    const data = await readBackendJson(res)
    return parseReviewsPage(data)
  } catch {
    return parseReviewsPage([])
  }
}

export default async function ReviewsPage({ params }: PageProps) {
  const { locale } = await params
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tReviews = await getTranslations({ locale, namespace: 'reviews' })
  const initialPage = await loadPublishedReviewsPage()

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className={cn(siteContentShellClassName, 'py-8 md:py-10')}>
          <PublicPageBreadcrumbs
            className="mb-4"
            items={staticPageBreadcrumbs(tNav('reviews'))}
          />
          <div className="mb-6 max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">
              {tReviews('pageTitle')}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{tReviews('pageSubtitle')}</p>
            <p className="mt-2 text-sm text-muted-foreground/90">{tReviews('moderationHint')}</p>
          </div>
          <ReviewsPageContent initialPage={initialPage} />
        </div>
      </main>
    </>
  )
}
