import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { ReviewsPageContent } from '@/components/reviews/reviews-page-content'
import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { parseReviewsPage } from '@/lib/reviews/fetch'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import { REVIEWS_PAGE_SIZE } from '@/lib/reviews/types'
import { staticPageBreadcrumbs } from '@/lib/catalog/breadcrumbs'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Відгуки · Зелені Янголи',
  description: 'Відгуки клієнтів про розсадник Зелені Янголи.',
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

export default async function ReviewsPage() {
  const tNav = await getTranslations('nav')
  const initialPage = await loadPublishedReviewsPage()

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-gradient-to-br from-secondary via-background to-accent">
        <div className={cn(siteContentShellClassName, 'py-8 md:py-10')}>
          <PublicPageBreadcrumbs
            className="mb-4"
            items={staticPageBreadcrumbs(tNav('reviews'))}
          />
          <div className="mb-6 max-w-2xl">
            <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">Відгуки</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Що кажуть наші клієнти про якість рослин та сервіс.
            </p>
          </div>
          <ReviewsPageContent initialPage={initialPage} />
        </div>
      </main>
    </>
  )
}
