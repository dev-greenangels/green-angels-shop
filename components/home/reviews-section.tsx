import Image from 'next/image'
import { getLocale, getTranslations } from 'next-intl/server'

import { ReviewDeliveryCountry } from '@/components/reviews/review-delivery-country'
import { StarRating } from '@/components/reviews/star-rating'
import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { HomeSectionCta } from '@/components/home/home-section-cta'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import { Card, CardContent } from '@/components/ui/card'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { groupReviewsForDisplay } from '@/lib/reviews/group'
import { toHomeReviewCardModel } from '@/lib/reviews/home-card'
import type { ReviewsPageResult } from '@/lib/reviews/types'
import {
  formatReviewDate,
  getReviewVerificationBadgeKey,
} from '@/lib/reviews/utils'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { MarketRegion } from '@/lib/settings/market'
import type { HomePageSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type ReviewsSectionProps = {
  settings: HomePageSettings['reviews']
  reviews: ReviewsPageResult
  marketRegion: MarketRegion
}

type HomeCardModel = ReturnType<typeof toHomeReviewCardModel>

function PlantLine({
  plant,
}: {
  plant: HomeCardModel['plants'][number]
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 rounded-md border border-border/35 bg-muted/25 px-2 py-1">
      <p className="truncate text-xs font-medium leading-5 text-foreground/90">
        {plant.name}
      </p>
      {plant.sizeLabels.length > 0 ? (
        <div className="flex shrink-0 items-center gap-1.5">
          {plant.sizeLabels.map((label) => (
            <VariantSizeLabel
              key={label}
              label={label}
              iconName="Container"
              iconClassName="h-3.5 w-3.5"
              className="text-[11px] font-medium text-muted-foreground"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function HomeReviewCard({
  model,
  locale,
  marketRegion,
  ratingOnlyLabel,
  plantsOverflowLabel,
  verifiedLabel,
}: {
  model: HomeCardModel
  locale: string
  marketRegion: MarketRegion
  ratingOnlyLabel: string
  plantsOverflowLabel: string | null
  verifiedLabel: string | null
}) {
  const dateLabel = formatReviewDate(model.createdAt, locale, marketRegion)

  return (
    <Card className="flex w-[72vw] max-w-[15.5rem] shrink-0 flex-col gap-0 overflow-hidden border-border/50 bg-card py-0 shadow-sm sm:w-[14rem]">
      <CardContent className="flex flex-col gap-2.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <StarRating rating={model.rating} size="sm" />
          <time
            className="shrink-0 text-[11px] leading-none text-muted-foreground"
            dateTime={model.createdAt}
          >
            {dateLabel}
          </time>
        </div>

        {model.quote ? (
          <p className="line-clamp-3 text-sm leading-5 text-foreground">
            &ldquo;{model.quote}&rdquo;
          </p>
        ) : (
          <p className="text-xs italic leading-5 text-muted-foreground">{ratingOnlyLabel}</p>
        )}

        {model.plants.length > 0 ? (
          <div className="space-y-1">
            {model.plants.map((plant) => (
              <PlantLine key={`${plant.slug ?? plant.name}`} plant={plant} />
            ))}
            {plantsOverflowLabel ? (
              <p className="px-0.5 text-[11px] leading-4 text-muted-foreground">
                {plantsOverflowLabel}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 border-t border-border/40 pt-2.5">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-primary/10">
            {model.coverImage ? (
              <Image
                src={model.coverImage}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
                {model.authorName.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {model.authorName}
            </p>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <ReviewDeliveryCountry code={model.deliveryCountryCode} />
              {verifiedLabel ? (
                <span className="text-[10px] font-medium leading-none text-primary">
                  ✓ {verifiedLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export async function ReviewsSection({ settings, reviews, marketRegion }: ReviewsSectionProps) {
  if (!settings.enabled) return null

  const [t, tReviews, locale] = await Promise.all([
    getTranslations('home'),
    getTranslations('reviews'),
    getLocale(),
  ])

  // Backend already returns complete groups when groupBy=submission; group for display safety.
  const cards = groupReviewsForDisplay(reviews.items)
    .map(toHomeReviewCardModel)
    .slice(0, settings.limit)

  if (cards.length === 0) return null

  const ratingOnlyLabel = tReviews('ratingOnlyLabel')

  return (
    <section className="relative overflow-hidden border-y border-border/30 py-9 md:py-12">
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          eyebrow={t('reviewsEyebrow')}
          title={pickHomeCmsText(
            settings.title,
            DEFAULT_HOME_SETTINGS.reviews.title,
            t('reviewsTitle'),
          )}
          subtitle={pickHomeCmsText(
            settings.subtitle,
            DEFAULT_HOME_SETTINGS.reviews.subtitle,
            t('reviewsSubtitle'),
          )}
          align="left"
          className="mb-6 md:mb-8"
        >
          <HomeSectionCta href="/reviews">
            {t('viewAllReviews')}
          </HomeSectionCta>
        </HomeSectionHeader>

        <div
          className={cn(
            '-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          <div className="flex w-max items-start gap-3 px-[var(--site-shell-padding-x)] md:gap-4">
            {cards.map((card) => {
              const badgeKey = getReviewVerificationBadgeKey(card.verificationType)
              return (
                <HomeReviewCard
                  key={card.key}
                  model={card}
                  locale={locale}
                  marketRegion={marketRegion}
                  ratingOnlyLabel={ratingOnlyLabel}
                  plantsOverflowLabel={
                    card.plantsOverflow > 0
                      ? tReviews('plantsOverflow', { count: card.plantsOverflow })
                      : null
                  }
                  verifiedLabel={badgeKey ? tReviews(badgeKey) : null}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
