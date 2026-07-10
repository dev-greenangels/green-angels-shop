import { Quote, Star } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { HomeSectionHeader } from '@/components/home/home-section-header'
import { Card, CardContent } from '@/components/ui/card'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { HomePageSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type ReviewsSectionProps = {
  settings: HomePageSettings['reviews']
}

function StarRating({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            'h-4 w-4',
            index < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
          )}
        />
      ))}
    </div>
  )
}

export async function ReviewsSection({ settings }: ReviewsSectionProps) {
  const t = await getTranslations('home')
  const tr = await getTranslations('reviews')

  if (settings.items.length === 0) return null

  return (
    <section className="relative overflow-hidden border-t border-border/50 bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-amber-200/20 blur-3xl" />
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          eyebrow={t('reviewsEyebrow')}
          title={settings.title}
          subtitle={settings.subtitle}
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
          {settings.items.map((review) => (
            <Card
              key={`${review.name}-${review.text.slice(0, 24)}`}
              className="h-full overflow-hidden border-border/40 bg-card/90 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardContent className="relative space-y-4 p-6 md:p-7">
                <Quote className="absolute right-5 top-5 h-10 w-10 text-primary/10" />
                <StarRating rating={review.rating} label={tr('ratingOfFive', { rating: review.rating })} />
                <p className="relative text-base leading-relaxed text-foreground md:text-[1.05rem]">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {review.name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{review.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
