import Image from 'next/image'
import { ArrowRight, Quote } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { HomeSectionHeader } from '@/components/home/home-section-header'
import { StarRating } from '@/components/reviews/star-rating'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { fetchHomeReviews } from '@/lib/catalog/home-content'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { formatReviewDate, getReviewImages } from '@/lib/reviews/utils'
import type { HomePageSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type ReviewsSectionProps = {
  settings: HomePageSettings['reviews']
}

function HomeReviewCard({
  review,
}: {
  review: Awaited<ReturnType<typeof fetchHomeReviews>>['items'][number]
}) {
  const images = getReviewImages(review)
  const coverImage = images[0]

  return (
    <Card className="h-full w-[72vw] max-w-[15.5rem] shrink-0 overflow-hidden border-border/50 bg-card/90 shadow-sm sm:w-[14rem]">
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <StarRating rating={review.rating} size="sm" />
          <Quote className="h-5 w-5 shrink-0 text-primary/15" />
        </div>
        <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-foreground">
          &ldquo;{review.text}&rdquo;
        </p>
        {coverImage ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <Image
              src={coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="14rem"
            />
          </div>
        ) : null}
        <div className="flex items-center gap-2 border-t border-border/50 pt-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {review.authorName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{review.authorName}</p>
            <p className="text-xs text-muted-foreground">{formatReviewDate(review.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export async function ReviewsSection({ settings }: ReviewsSectionProps) {
  if (!settings.enabled) return null

  const t = await getTranslations('home')

  const reviewsResult = await fetchHomeReviews({
    page: 1,
    pageSize: settings.limit,
    sort: settings.sort,
  })

  if (reviewsResult.items.length === 0) return null

  return (
    <section className="relative overflow-hidden border-t border-border/50 bg-gradient-to-b from-muted/40 to-background py-10 md:py-14">
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          eyebrow={t('reviewsEyebrow')}
          title={settings.title}
          subtitle={settings.subtitle}
          align="left"
          className="mb-6 md:mb-8"
        >
          <Button
            variant="outline"
            asChild
            className="self-start rounded-full border-primary/20 shadow-sm hover:border-primary/40 hover:bg-primary/5 md:self-auto"
          >
            <Link href="/reviews">
              {t('viewAllReviews')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </HomeSectionHeader>

        <div
          className={cn(
            '-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          <div className="flex w-max gap-3 px-[var(--site-shell-padding-x)] md:gap-4">
            {reviewsResult.items.map((review) => (
              <HomeReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
