import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { productHref } from '@/lib/catalog/paths'
import { fetchCatalogProductBySlug } from '@/lib/catalog/products'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'
import type { Plant } from '@/lib/types'

function plainDescription(plant: Plant): string | undefined {
  const fromMeta = plant.metaDesc?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (fromMeta) return fromMeta
  const fromShort = plant.shortDescription.trim()
  if (fromShort) return fromShort
  const fromHtml = plant.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return fromHtml || undefined
}

function productTitle(plant: Plant, siteName: string): string {
  const seo = plant.metaTitle?.trim()
  if (seo) return seo.includes(siteName) ? seo : `${seo} · ${siteName}`
  const latin = plant.latinName?.trim()
  const name = plant.name.trim() || plant.slug
  if (latin && latin !== name) return `${name} (${latin}) · ${siteName}`
  return `${name} · ${siteName}`
}

export async function buildProductPageMetadata(
  locale: string,
  categorySlug: string,
  slug: string,
): Promise<Metadata> {
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const productResult = await fetchCatalogProductBySlug(slug, locale)
  const plant = productResult.data

  if (!plant) {
    return { title: siteName }
  }

  const path = plant.category
    ? productHref(plant.category, plant.slug)
    : productHref(categorySlug, plant.slug)
  const images = plant.images
    .map((url) => toPublicMediaUrl(url))
    .filter((url) => url && !url.includes('placeholder'))

  return buildIndexablePageMetadata(locale, path, {
    title: productTitle(plant, siteName),
    description: plainDescription(plant),
    images,
    siteName,
  })
}
