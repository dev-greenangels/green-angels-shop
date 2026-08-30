import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { HomeProductCarousel } from '@/components/home/home-product-carousel'
import { HomeSectionCta } from '@/components/home/home-section-cta'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'
import type { Plant } from '@/lib/types'

type HomeProductRowSectionProps = {
  id?: string
  title: string
  subtitle?: string
  plants: Plant[]
  unavailable?: boolean
  viewAllHref?: string
  viewAllLabel?: string
  className?: string
  headerAction?: ReactNode
}

export async function HomeProductRowSection({
  id,
  title,
  subtitle,
  plants,
  unavailable = false,
  viewAllHref,
  viewAllLabel,
  className,
  headerAction,
}: HomeProductRowSectionProps) {
  const t = await getTranslations('home')
  const te = await getTranslations('errors')

  return (
    <section id={id} className={cn('bg-transparent py-9 md:py-12', className)}>
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          title={title}
          subtitle={subtitle}
          align="left"
          className="mb-6 md:mb-8"
        >
          {headerAction ??
            (viewAllHref && viewAllLabel ? (
              <HomeSectionCta href={viewAllHref}>
                {viewAllLabel}
              </HomeSectionCta>
            ) : null)}
        </HomeSectionHeader>

        {unavailable ? (
          <ServiceUnavailableNotice
            compact
            message={te('catalogUnavailable')}
            className="mx-auto max-w-lg"
          />
        ) : plants.length > 0 ? (
          <HomeProductCarousel plants={plants} />
        ) : (
          <p className="text-center text-muted-foreground">{t('comingSoon')}</p>
        )}
      </div>
    </section>
  )
}
