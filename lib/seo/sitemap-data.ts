import { getBackendApiUrl } from '@/lib/api/backend-url'
import { defaultLocale } from '@/i18n/routing'
import { findCatalogRootNode } from '@/lib/catalog/catalog-root'
import type { CategoryTreeNode } from '@/lib/catalog/categories'
import { categoryHref, isReservedPublicSegment, productHref } from '@/lib/catalog/paths'

export const SITEMAP_PRODUCT_PAGE_SIZE = 200
const SITEMAP_MAX_PRODUCT_PAGES = 50
const SITEMAP_BLOG_PAGE_SIZE = 100
const SITEMAP_REVALIDATE = 300

export type SitemapProductRow = {
  slug: string
  categorySlug: string
  lastModified?: string
}

function flattenActiveCategories(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const out: CategoryTreeNode[] = []
  for (const node of nodes) {
    if (node.isActive) out.push(node)
    if (node.children?.length) out.push(...flattenActiveCategories(node.children))
  }
  return out
}

async function fetchJson(path: string): Promise<unknown | null> {
  try {
    const res = await fetch(`${getBackendApiUrl()}${path}`, {
      next: { revalidate: SITEMAP_REVALIDATE },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export function catalogPathsFromTree(tree: CategoryTreeNode[]): string[] {
  const root = findCatalogRootNode(tree)
  const paths: string[] = []
  if (root?.isActive && root.slug && !isReservedPublicSegment(root.slug)) {
    paths.push(categoryHref(root.slug))
  }
  for (const node of flattenActiveCategories(tree)) {
    if (!node.slug || isReservedPublicSegment(node.slug)) continue
    if (root && node.slug === root.slug) continue
    paths.push(categoryHref(node.slug))
  }
  return paths
}

export async function loadSitemapCategoryPaths(locale = defaultLocale): Promise<{
  paths: string[]
  activeSlugs: Set<string>
}> {
  const tree = (await fetchJson(`/categories?locale=${encodeURIComponent(locale)}`)) as
    | CategoryTreeNode[]
    | null
  if (!Array.isArray(tree)) return { paths: [], activeSlugs: new Set() }
  const paths = catalogPathsFromTree(tree)
  const activeSlugs = new Set(
    flattenActiveCategories(tree)
      .map((node) => node.slug)
      .filter(Boolean),
  )
  return { paths, activeSlugs }
}

export async function loadSitemapBlogPaths(): Promise<{ paths: string[]; lastModifiedByPath: Record<string, string> }> {
  const paths: string[] = []
  const lastModifiedByPath: Record<string, string> = {}
  let page = 1
  let totalPages = 1

  while (page <= totalPages && page <= 20) {
    const data = (await fetchJson(`/blog?page=${page}&pageSize=${SITEMAP_BLOG_PAGE_SIZE}&sort=newest`)) as {
      items?: Array<{ slug?: string; updatedAt?: string; createdAt?: string }>
      totalPages?: number
    } | null
    if (!data?.items) break
    totalPages = Math.max(1, data.totalPages ?? 1)
    for (const post of data.items) {
      const slug = post.slug?.trim()
      if (!slug) continue
      const path = `/blog/${slug}`
      paths.push(path)
      const stamp = post.updatedAt || post.createdAt
      if (stamp) lastModifiedByPath[path] = stamp
    }
    page += 1
  }

  return { paths, lastModifiedByPath }
}

export async function loadSitemapProductChunk(
  page: number,
  locale = defaultLocale,
): Promise<{ rows: SitemapProductRow[]; totalPages: number; total: number }> {
  const params = new URLSearchParams({
    locale,
    published: 'true',
    page: String(page),
    pageSize: String(SITEMAP_PRODUCT_PAGE_SIZE),
  })
  const data = (await fetchJson(`/products?${params}`)) as {
    items?: Array<{
      slug?: string
      categorySlug?: string
      isPublished?: boolean
      createdAt?: string
      updatedAt?: string
    }>
    totalPages?: number
    total?: number
  } | null

  if (!data?.items) return { rows: [], totalPages: 0, total: 0 }

  const rows: SitemapProductRow[] = []
  for (const item of data.items) {
    if (item.isPublished === false) continue
    const slug = item.slug?.trim()
    const categorySlug = item.categorySlug?.trim()
    if (!slug || !categorySlug || isReservedPublicSegment(categorySlug)) continue
    rows.push({
      slug,
      categorySlug,
      lastModified: item.updatedAt || item.createdAt,
    })
  }

  return {
    rows,
    totalPages: Math.min(SITEMAP_MAX_PRODUCT_PAGES, data.totalPages ?? 0),
    total: data.total ?? 0,
  }
}

export async function loadSitemapProductPaths(
  activeCategorySlugs: Set<string>,
  locale = defaultLocale,
): Promise<{ paths: string[]; lastModifiedByPath: Record<string, string> }> {
  const first = await loadSitemapProductChunk(1, locale)
  const pages = Math.max(first.totalPages, first.rows.length ? 1 : 0)
  const chunks = [first]
  for (let page = 2; page <= pages; page += 1) {
    chunks.push(await loadSitemapProductChunk(page, locale))
  }

  const paths: string[] = []
  const lastModifiedByPath: Record<string, string> = {}
  for (const chunk of chunks) {
    for (const row of chunk.rows) {
      if (activeCategorySlugs.size > 0 && !activeCategorySlugs.has(row.categorySlug)) continue
      const path = productHref(row.categorySlug, row.slug)
      paths.push(path)
      if (row.lastModified) lastModifiedByPath[path] = row.lastModified
    }
  }
  return { paths, lastModifiedByPath }
}
