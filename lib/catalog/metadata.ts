import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import { fetchCatalogCategoryDetail, fetchCategoryTree } from '@/lib/catalog/categories'
import { categoryHref, catalogRootHref } from '@/lib/catalog/paths'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export function categorySeoFields(node: {
  name: string
  description?: string | null
  metaTitle?: string | null
  metaDesc?: string | null
}) {
  const title = node.metaTitle?.trim() || node.name
  const description = node.metaDesc?.trim() || node.description?.trim() || undefined
  return { title, description }
}

function paginationRobots(page: number, sort?: string): Metadata['robots'] | undefined {
  if (page > 1 || (sort && sort !== 'name')) {
    return { index: false, follow: true }
  }
  return undefined
}

export async function buildCatalogLandingMetadata(
  locale: string,
  options?: { page?: number; sort?: string },
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'catalog' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const page = options?.page ?? 1
  const robots = paginationRobots(page, options?.sort)

  try {
    const tree = await fetchCategoryTree(locale)
    const root = findCatalogRootNode(tree)
    if (!root) {
      return buildIndexablePageMetadata(locale, '/catalog', {
        title: t('title'),
        siteName,
        robots,
      })
    }
    const { title, description } = categorySeoFields(root)
    return buildIndexablePageMetadata(locale, catalogRootHref(root.slug), {
      title: `${title} · ${siteName}`,
      description,
      images: root.imageUrl ? [root.imageUrl] : undefined,
      siteName,
      robots,
    })
  } catch {
    return buildIndexablePageMetadata(locale, '/catalog', {
      title: t('title'),
      siteName,
      robots,
    })
  }
}

export async function buildCategoryMetadata(
  slug: string,
  locale: string,
  options?: { page?: number; sort?: string },
): Promise<Metadata> {
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const page = options?.page ?? 1
  const robots = paginationRobots(page, options?.sort)

  try {
    const result = await fetchCatalogCategoryDetail(slug, locale)
    const category = result.data
    if (!category) {
      return { title: siteName }
    }
    const { title, description } = categorySeoFields(category)
    return buildIndexablePageMetadata(locale, categoryHref(slug), {
      title: `${title} · ${siteName}`,
      description,
      images: category.image ? [category.image] : undefined,
      siteName,
      robots,
    })
  } catch {
    return { title: siteName }
  }
}
