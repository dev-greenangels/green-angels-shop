import { cache } from 'react'

import { getBackendApiUrl } from '@/lib/api/backend-url'
import {
  availableResult,
  type FetchResult,
  unavailableResult,
} from '@/lib/api/fetch-result'
import { resolveCategoryThumbUrl } from '@/lib/category-image'

import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import { defaultLocale, isAppLocale } from '@/i18n/routing'
import type { CatalogCategory } from './types'

export type CategoryTreeNode = {
  id: string
  slug: string
  parentId: string | null
  isActive: boolean
  isCatalogRoot: boolean
  position: number
  name: string
  latinName?: string | null
  description: string | null
  footerDescription?: string | null
  image: string | null
  imageUrl: string
  metaTitle?: string | null
  metaDesc?: string | null
  productCount: number
  isStockDepleted?: boolean
  children: CategoryTreeNode[]
}

export type CatalogCategoryBreadcrumb = {
  name: string
  slug: string
}

export type CatalogCategoryDetail = CatalogCategory & {
  breadcrumbs: CatalogCategoryBreadcrumb[]
  subcategories: CatalogCategory[]
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

function getSubtreeProductCount(node: CategoryTreeNode): number {
  const fromChildren = node.children
    .filter((child) => child.isActive)
    .reduce((sum, child) => sum + getSubtreeProductCount(child), 0)
  return node.productCount + fromChildren
}

function mapTreeNode(node: CategoryTreeNode): CatalogCategory {
  return {
    id: node.id,
    name: node.name,
    slug: node.slug,
    latinName: node.latinName?.trim() || undefined,
    description: node.description?.trim() || '',
    footerDescription: node.footerDescription?.trim() || undefined,
    metaTitle: node.metaTitle?.trim() || undefined,
    metaDesc: node.metaDesc?.trim() || undefined,
    image: resolveCategoryThumbUrl(node.imageUrl || node.image),
    plantCount: getSubtreeProductCount(node),
    isStockDepleted: node.isStockDepleted ?? false,
  }
}

function mapActiveChildren(node: CategoryTreeNode): CatalogCategory[] {
  return node.children.filter((child) => child.isActive).map(mapTreeNode)
}

export function resolveCatalogLandingContent(tree: CategoryTreeNode[]) {
  const root = findCatalogRootNode(tree)
  if (root) {
    return {
      root,
      subcategories: mapActiveChildren(root),
      productCategorySlug: root.slug,
    }
  }

  return {
    root: null,
    subcategories: tree.filter((node) => node.isActive).map(mapTreeNode),
    productCategorySlug: undefined as string | undefined,
  }
}

function findPathInTree(
  nodes: CategoryTreeNode[],
  slug: string,
  path: CategoryTreeNode[] = [],
): CategoryTreeNode[] | null {
  for (const node of nodes) {
    const next = [...path, node]
    if (node.slug === slug) return next
    const found = findPathInTree(node.children, slug, next)
    if (found) return found
  }
  return null
}

function resolveLocale(locale?: string) {
  return locale && isAppLocale(locale) ? locale : defaultLocale
}

async function fetchTreeFromBackend(locale?: string): Promise<CategoryTreeNode[]> {
  const loc = resolveLocale(locale)
  const res = await fetch(`${getBackendApiUrl()}/categories?locale=${encodeURIComponent(loc)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

async function fetchTreeFromApiRoute(locale?: string): Promise<CategoryTreeNode[]> {
  const loc = resolveLocale(locale)
  const res = await fetch(`/api/catalog/categories?locale=${encodeURIComponent(loc)}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

async function loadCategoryTreeUncached(locale: string): Promise<FetchResult<CategoryTreeNode[]>> {
  try {
    const data =
      typeof window === 'undefined'
        ? await fetchTreeFromBackend(locale)
        : await fetchTreeFromApiRoute(locale)
    return availableResult(data)
  } catch {
    return unavailableResult([])
  }
}

const loadCategoryTreeCached = cache(loadCategoryTreeUncached)

async function loadCategoryTree(locale?: string): Promise<FetchResult<CategoryTreeNode[]>> {
  return loadCategoryTreeCached(resolveLocale(locale))
}

export async function fetchCategoryTree(locale?: string): Promise<CategoryTreeNode[]> {
  const result = await loadCategoryTree(locale)
  return result.data
}

export async function fetchCategoryTreeWithStatus(
  locale?: string,
): Promise<FetchResult<CategoryTreeNode[]>> {
  return loadCategoryTree(locale)
}

export async function fetchCatalogRootCategories(
  locale?: string,
): Promise<FetchResult<CatalogCategory[]>> {
  const { data: tree, unavailable } = await loadCategoryTree(locale)
  return { data: resolveCatalogLandingContent(tree).subcategories, unavailable }
}

export async function fetchCatalogRootVisibleCards(
  locale?: string,
): Promise<FetchResult<CatalogCategory[]>> {
  const { data: tree, unavailable } = await loadCategoryTree(locale)
  return {
    data: resolveCatalogLandingContent(tree).subcategories,
    unavailable,
  }
}

export async function fetchCatalogCategories(
  locale?: string,
): Promise<FetchResult<CatalogCategory[]>> {
  return fetchCatalogRootCategories(locale)
}

export async function fetchCatalogCategoryDetail(
  slug: string,
  locale?: string,
): Promise<FetchResult<CatalogCategoryDetail | null>> {
  const { data: tree, unavailable } = await loadCategoryTree(locale)
  if (unavailable) return unavailableResult(null)

  const path = findPathInTree(tree, slug)
  if (!path?.length) return availableResult(null)

  const node = path[path.length - 1]
  if (!node.isActive || node.isCatalogRoot) return availableResult(null)

  return availableResult({
    ...mapTreeNode(node),
    breadcrumbs: path.map((item) => ({ name: item.name, slug: item.slug })),
    subcategories: mapActiveChildren(node),
  })
}

export async function fetchCatalogCategoryVisibleCards(
  slug: string,
  locale?: string,
): Promise<
  FetchResult<{ detail: CatalogCategoryDetail; visibleCards: CatalogCategory[] } | null>
> {
  const { data: tree, unavailable } = await loadCategoryTree(locale)
  if (unavailable) return unavailableResult(null)

  const path = findPathInTree(tree, slug)
  if (!path?.length) return availableResult(null)

  const node = path[path.length - 1]
  if (!node.isActive || node.isCatalogRoot) return availableResult(null)

  return availableResult({
    detail: {
      ...mapTreeNode(node),
      breadcrumbs: path.map((item) => ({ name: item.name, slug: item.slug })),
      subcategories: mapActiveChildren(node),
    },
    visibleCards: mapActiveChildren(node),
  })
}

export async function fetchCatalogCategoryBySlug(
  slug: string,
  locale?: string,
): Promise<FetchResult<CatalogCategory | null>> {
  const result = await fetchCatalogCategoryDetail(slug, locale)
  return { data: result.data, unavailable: result.unavailable }
}
