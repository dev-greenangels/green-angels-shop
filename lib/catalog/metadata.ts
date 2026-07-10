import type { Metadata } from 'next'

import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import { fetchCatalogCategoryDetail, fetchCategoryTree } from '@/lib/catalog/categories'

const SITE_SUFFIX = ' · Зелені Янголи'

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

export async function buildCatalogLandingMetadata(): Promise<Metadata> {
  try {
    const tree = await fetchCategoryTree()
    const root = findCatalogRootNode(tree)
    if (!root) {
      return { title: `Каталог рослин${SITE_SUFFIX}` }
    }
    const { title, description } = categorySeoFields(root)
    return {
      title: `${title}${SITE_SUFFIX}`,
      description,
    }
  } catch {
    return { title: `Каталог рослин${SITE_SUFFIX}` }
  }
}

export async function buildCategoryMetadata(slug: string): Promise<Metadata> {
  try {
    const result = await fetchCatalogCategoryDetail(slug)
    const category = result.data
    if (!category) {
      return { title: `Категорія${SITE_SUFFIX}` }
    }
    const { title, description } = categorySeoFields(category)
    return {
      title: `${title}${SITE_SUFFIX}`,
      description,
    }
  } catch {
    return { title: `Категорія${SITE_SUFFIX}` }
  }
}
