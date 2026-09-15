import { getLocale, getTranslations } from 'next-intl/server'

import { FreshPlantPhotosCarousel } from '@/components/home/fresh-plant-photos-carousel'
import { HomeSectionCta } from '@/components/home/home-section-cta'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { HomePageSettings } from '@/lib/settings/types'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'

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

        <FreshPlantPhotosCarousel photos={photos} locale={locale} />
      </div>
    </section>
  )
}
