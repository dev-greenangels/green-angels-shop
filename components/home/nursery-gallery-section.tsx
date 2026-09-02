import { getTranslations } from 'next-intl/server'

import { HomeSectionHeader } from '@/components/home/home-section-header'
import { NurseryGalleryImage } from '@/components/home/nursery-gallery-image'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import type { HomePageSettings } from '@/lib/settings/types'

const PLACEHOLDER_IMAGE = '/images/category-placeholder.svg'

type NurseryGallerySectionProps = {
  settings: HomePageSettings['nurseryGallery']
}

export async function NurseryGallerySection({ settings }: NurseryGallerySectionProps) {
  const t = await getTranslations('home')

  if (settings.images.length === 0) return null

  const [featured, ...rest] = settings.images

  return (
    <section className="border-y border-border/40 bg-transparent py-12 md:py-16">
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          eyebrow={t('nurseryEyebrow')}
          title={pickHomeCmsText(
            settings.title,
            DEFAULT_HOME_SETTINGS.nurseryGallery.title,
            t('nurseryTitle'),
          )}
          subtitle={pickHomeCmsText(
            settings.subtitle,
            DEFAULT_HOME_SETTINGS.nurseryGallery.subtitle,
            t('nurserySubtitle'),
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
          {featured ? (
            <figure className="group relative min-h-[280px] overflow-hidden rounded-3xl bg-muted shadow-xl ring-1 ring-border/40 lg:col-span-2 lg:row-span-2 lg:min-h-[420px]">
              <NurseryGalleryImage
                src={featured.url || PLACEHOLDER_IMAGE}
                alt={featured.caption}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-6 pb-6 pt-20">
                <p className="text-lg font-semibold text-white">{featured.caption}</p>
                <p className="mt-1 text-sm text-white/75">{t('nurseryCaption')}</p>
              </figcaption>
            </figure>
          ) : null}

          {rest.map((image) => (
            <figure
              key={`${image.url}-${image.caption}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-md ring-1 ring-border/40 transition-all hover:-translate-y-1 hover:shadow-xl lg:aspect-auto lg:min-h-[200px]"
            >
              <NurseryGalleryImage
                src={image.url || PLACEHOLDER_IMAGE}
                alt={image.caption}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 1024px) 50vw, 25vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-12 text-sm font-semibold text-white">
                {image.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
