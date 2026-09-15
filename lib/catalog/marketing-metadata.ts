import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

async function buildCatalogMarketingMetadata(
  locale: string,
  pathname: string,
  seoTitleKey: string,
  seoDescriptionKey: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'catalog' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const title = t(seoTitleKey)
  const description = t(seoDescriptionKey)

  return buildIndexablePageMetadata(locale, pathname, {
    title: title.includes(siteName) ? title : `${title} · ${siteName}`,
    description,
    siteName,
  })
}

export function buildFreshPhotosMetadata(locale: string): Promise<Metadata> {
  return buildCatalogMarketingMetadata(
    locale,
    '/fresh-photos',
    'freshPhotosSeoTitle',
    'freshPhotosSeoDescription',
  )
}

export function buildPromotionsMetadata(locale: string): Promise<Metadata> {
  return buildCatalogMarketingMetadata(
    locale,
    '/promotions',
    'promotionsSeoTitle',
    'promotionsSeoDescription',
  )
}

export function buildNewArrivalsMetadata(locale: string): Promise<Metadata> {
  return buildCatalogMarketingMetadata(
    locale,
    '/new-arrivals',
    'newArrivalsSeoTitle',
    'newArrivalsSeoDescription',
  )
}
