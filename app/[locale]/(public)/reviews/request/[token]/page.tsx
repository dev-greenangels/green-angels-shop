import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { OrderReviewRequestForm } from '@/components/reviews/order-review-request-form'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { parseReviewRequestResolve } from '@/lib/reviews/fetch'
import type { ReviewRequestResolve } from '@/lib/reviews/types'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/robots-directives'
import { cn } from '@/lib/utils'

type PageProps = {
  params: Promise<{ locale: string; token: string }>
}

type LoadResult =
  | { ok: true; data: ReviewRequestResolve }
  | { ok: false; status: number; code?: string }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'reviews.request' })
  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
    robots: PRIVATE_PAGE_ROBOTS,
    referrer: 'no-referrer',
  }
}

function extractErrorCode(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined
  const row = json as {
    code?: unknown
    message?: unknown
  }
  if (typeof row.code === 'string') return row.code
  if (row.message && typeof row.message === 'object' && row.message !== null) {
    const nested = row.message as { code?: unknown }
    if (typeof nested.code === 'string') return nested.code
  }
  if (typeof row.message === 'string' && row.message.includes('REVIEW_REQUEST_COMPLETED')) {
    return 'REVIEW_REQUEST_COMPLETED'
  }
  return undefined
}

async function loadRequest(token: string): Promise<LoadResult> {
  try {
    const res = await fetchBackend(`/reviews/request/${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
    const json = await readBackendJson(res)
    if (!res.ok) {
      return { ok: false, status: res.status, code: extractErrorCode(json) }
    }
    const data = parseReviewRequestResolve(json)
    if (!data) return { ok: false, status: 502 }
    return { ok: true, data }
  } catch {
    return { ok: false, status: 502 }
  }
}

export default async function OrderReviewRequestPage({ params }: PageProps) {
  const { locale, token } = await params
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'reviews.request' })
  const result = await loadRequest(token)
  const completed =
    !result.ok &&
    result.status === 410 &&
    result.code === 'REVIEW_REQUEST_COMPLETED'

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className={cn(siteContentShellClassName, 'py-8 md:py-10')}>
          {completed ? (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                {t('thankYouTitle')}
              </h1>
              <p className="text-muted-foreground">{t('completedBody')}</p>
              <Button asChild size="lg">
                <Link href="/reviews">{t('thankYouCta')}</Link>
              </Button>
            </div>
          ) : !result.ok ? (
            <div className="mx-auto max-w-xl space-y-3 text-center">
              <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                {t('invalidTitle')}
              </h1>
              <p className="text-muted-foreground">
                {result.status === 410 ? t('expiredBody') : t('invalidBody')}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mx-auto max-w-xl text-center sm:text-left">
                <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
                  {t('heading')}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {t('orderNumber', { number: result.data.orderNumber })}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t('intro')}</p>
              </div>
              <OrderReviewRequestForm token={token} initial={result.data} />
            </div>
          )}
        </div>
      </main>
    </>
  )
}
