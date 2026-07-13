import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { HomeSectionHeader } from '@/components/home/home-section-header'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { PRODUCT_CARD_CAROUSEL_SLOT_CLASS } from '@/lib/catalog/product-card-layout'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { HomePageSettings } from '@/lib/settings/types'
import type { CatalogPhotoItem } from '@/lib/variant-photos/types'
import { cn } from '@/lib/utils'

type FreshPlantPhotosSectionProps = {
  settings: HomePageSettings['freshPlantPhotos']
  photos: CatalogPhotoItem[]
}

function formatPhotoDate(value: string | null | undefined, locale: string) {
  if (!value?.trim()) return null
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return value
  }
}

function photoProductHref(photo: CatalogPhotoItem): string | null {
  if (photo.productSlug) return `/product/${photo.productSlug}`
  if (photo.categorySlug && photo.productSlug) return `/catalog/${photo.categorySlug}/${photo.productSlug}`
  return null
}

function FreshPhotoCard({ photo, locale }: { photo: CatalogPhotoItem; locale: string }) {
  const productName = photo.productName || photo.appProperties.plantName || photo.ean
  const variantLabel = photo.variantLabel || photo.appProperties.plantSize || null
  const photoDate = formatPhotoDate(photo.appProperties.date?.trim() || photo.createdAt, locale)
  const href = photoProductHref(photo)

  const image = (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-xl bg-muted">
      <Image
        src={photo.url}
        alt={productName}
        fill
        unoptimized
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes="(max-width: 768px) 58vw, 11rem"
      />
    </div>
  )

  return (
    <article
      className={cn(
        PRODUCT_CARD_CAROUSEL_SLOT_CLASS,
        'group w-[58vw] max-w-[13.5rem] overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm sm:w-[9.25rem] md:w-[10.75rem] lg:w-[11.25rem]',
      )}
    >
      {href ? (
        <Link href={href} className="block">
          {image}
        </Link>
      ) : (
        image
      )}
      <div className="space-y-1 p-3">
        {href ? (
          <Link
            href={href}
            className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
          >
            {productName}
          </Link>
        ) : (
          <p className="line-clamp-2 text-sm font-medium leading-snug">{productName}</p>
        )}
        {variantLabel ? (
          <p className="truncate text-xs text-muted-foreground">{variantLabel}</p>
        ) : null}
        {photoDate ? <p className="text-xs text-muted-foreground">{photoDate}</p> : null}
      </div>
    </article>
  )
}

export async function FreshPlantPhotosSection({ settings, photos }: FreshPlantPhotosSectionProps) {
  if (!settings.enabled || photos.length === 0) return null

  const t = await getTranslations('home')
  const locale = await getLocale()

  return (
    <section className="bg-background py-10 md:py-14">
      <div className={siteContentShellClassName}>
        <HomeSectionHeader
          eyebrow={t('freshPhotosEyebrow')}
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
            <Link href="/fresh-photos">
              {t('viewAllFreshPhotos')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </HomeSectionHeader>

        <div className="-mx-[var(--site-shell-padding-x)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2.5 px-[var(--site-shell-padding-x)] sm:gap-3 md:gap-4">
            {photos.map((photo) => (
              <FreshPhotoCard key={photo.id} photo={photo} locale={locale} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
