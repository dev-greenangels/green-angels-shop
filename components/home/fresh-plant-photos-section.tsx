import { getLocale, getTranslations } from 'next-intl/server'

import { FreshPhotoCard } from '@/components/catalog/fresh-photo-card'
import { HomeSectionCta } from '@/components/home/home-section-cta'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import { PRODUCT_CARD_CAROUSEL_SLOT_CLASS } from '@/lib/catalog/product-card-layout'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { HomePageSettings } from '@/lib/settings/types'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import { cn } from '@/lib/utils'

type FreshPlantPhotosSectionProps = {
  settings: HomePageSettings['freshPlantPhotos']
  photos: CatalogPhotoItem[]
}

export async function FreshPlantPhotosSection({ settings, photos }: FreshPlantPhotosSectionProps) {
  if (!settings.enabled || photos.length === 0) return null

  const t = await getTranslations('home')
  const locale = await getLocale()

  return (
    <section className="border-y border-border/30 py-9 md:py-12">
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          eyebrow={t('freshPhotosEyebrow')}
          title={pickHomeCmsText(
            settings.title,
            DEFAULT_HOME_SETTINGS.freshPlantPhotos.title,
            t('freshPhotosTitle'),
          )}
          subtitle={pickHomeCmsText(
            settings.subtitle,
            DEFAULT_HOME_SETTINGS.freshPlantPhotos.subtitle,
            t('freshPhotosSubtitle'),
          )}
          align="left"
          className="mb-6 md:mb-8"
        >
          <HomeSectionCta href="/fresh-photos">
            {t('viewAllFreshPhotos')}
          </HomeSectionCta>
        </HomeSectionHeader>

        <div className="-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-3 px-[var(--site-shell-padding-x)] sm:gap-3.5 md:gap-4">
            {photos.map((photo) => (
              <FreshPhotoCard
                key={photo.id}
                photo={photo}
                locale={locale}
                className={cn(
                  PRODUCT_CARD_CAROUSEL_SLOT_CLASS,
                  'group h-full w-[78vw] max-w-[22rem] sm:w-[18.5rem] md:w-[19.5rem] lg:w-[20.5rem]',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
