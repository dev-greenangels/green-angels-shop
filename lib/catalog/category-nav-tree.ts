import type { CategoryTreeNode } from '@/lib/catalog/categories'
import { isReservedPublicSegment, resolveCategorySlugFromPathname } from '@/lib/catalog/paths'

export function filterActiveCategoryNodes(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes
    .filter((node) => node.isActive)
    .map((node) => ({
      ...node,
      children: filterActiveCategoryNodes(node.children ?? []),
    }))
}

export function findCategoryPathBySlug(
  nodes: CategoryTreeNode[],
  slug: string,
  path: CategoryTreeNode[] = [],
): CategoryTreeNode[] | null {
  for (const node of nodes) {
    const next = [...path, node]
    if (node.slug === slug) return next
    const found = findCategoryPathBySlug(node.children, slug, next)
    if (found) return found
  }
  return null
}

export function getCategoryAncestorIds(tree: CategoryTreeNode[], slug: string): string[] {
  const path = findCategoryPathBySlug(tree, slug)
  if (!path || path.length <= 1) return []
  return path.slice(0, -1).map((node) => node.id)
}

export function resolveActiveCategorySlug(pathname: string): string | null {
  return resolveCategorySlugFromPathname(pathname)
}

export function isCategoryNavSegment(segment: string): boolean {
  return !isReservedPublicSegment(segment)
}
