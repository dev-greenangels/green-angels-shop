import type { CategoryTreeNode } from '@/lib/catalog/categories'

export type CatalogRootNode = CategoryTreeNode & {
  metaTitle: string | null
  metaDesc: string | null
}

/** Знаходить категорію з прапорцем isCatalogRoot у дереві. */
export function findCatalogRootNode(nodes: CategoryTreeNode[]): CatalogRootNode | null {
  for (const node of nodes) {
    if (node.isCatalogRoot) {
      return node as CatalogRootNode
    }
    const found = findCatalogRootNode(node.children ?? [])
    if (found) return found
  }
  return null
}

/** Прибирає вузли-корені каталогу з дерева для публічної навігації. */
export function flattenCatalogRootForNav(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = []
  for (const node of nodes) {
    if (node.isCatalogRoot) {
      result.push(...flattenCatalogRootForNav(node.children ?? []))
      continue
    }
    result.push({
      ...node,
      children: flattenCatalogRootForNav(node.children ?? []),
    })
  }
  return result
}

export function isCatalogRootSlug(nodes: CategoryTreeNode[], slug: string): boolean {
  const root = findCatalogRootNode(nodes)
  return root?.slug === slug
}
