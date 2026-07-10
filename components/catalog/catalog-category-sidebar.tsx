'use client'

import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CatalogCategoryTreeItems } from '@/components/catalog/catalog-category-tree-items'
import type { CategoryTreeNode } from '@/lib/catalog/categories'
import { flattenCatalogRootForNav } from '@/lib/catalog/catalog-root'
import {
  filterActiveCategoryNodes,
  getCategoryAncestorIds,
  resolveActiveCategorySlug,
} from '@/lib/catalog/category-nav-tree'
import { Link, usePathname } from '@/i18n/navigation'
import {
  catalogSidebarPanelClassName,
  catalogSidebarScrollClassName,
} from '@/lib/catalog/sidebar-panel-styles'
import { useCatalogHref, useCatalogRootSlug } from '@/components/providers/catalog-paths-provider'
import { isCatalogRootPath } from '@/lib/catalog/paths'
import { pressableClassName } from '@/lib/pressable'
import { cn } from '@/lib/utils'

export function CatalogCategorySidebar({
  compact = false,
  maxHeightPx = null,
}: {
  compact?: boolean
  maxHeightPx?: number | null
}) {
  const pathname = usePathname()
  const catalogHref = useCatalogHref()
  const catalogRootSlug = useCatalogRootSlug()
  const t = useTranslations('catalog')
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const activeSlug = useMemo(() => resolveActiveCategorySlug(pathname), [pathname])
  const isCatalogRootActive = isCatalogRootPath(pathname, catalogRootSlug)

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setUnavailable(false)

    void fetch('/api/catalog/categories', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) {
          setUnavailable(true)
          return []
        }
        return res.json()
      })
      .then((data: CategoryTreeNode[]) => {
        if (cancelled) return
        const filtered = filterActiveCategoryNodes(Array.isArray(data) ? data : [])
        const navTree = flattenCatalogRootForNav(filtered)
        setTree(navTree)
        if (activeSlug) {
          setExpandedIds(new Set(getCategoryAncestorIds(navTree, activeSlug)))
        } else {
          setExpandedIds(new Set())
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUnavailable(true)
          setTree([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeSlug])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      className={cn(
        catalogSidebarPanelClassName,
        'flex flex-col overflow-hidden transition-[max-height,padding] duration-200 ease-out',
        compact ? 'shrink-0 p-1.5 pl-2' : 'p-3 pl-3.5',
        maxHeightPx == null && !compact && 'max-h-[calc(100dvh-7rem)]',
      )}
      style={maxHeightPx != null ? { maxHeight: maxHeightPx } : undefined}
    >
      <Link
        href={catalogHref}
        className={cn(
          pressableClassName,
          'flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition-colors hover:bg-muted/80 hover:text-primary',
          isCatalogRootActive ? 'bg-primary/10 text-primary' : 'text-foreground',
          compact ? 'mb-0' : 'mb-2',
        )}
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span>{t('title')}</span>
      </Link>

      <div
        className={cn(
          catalogSidebarScrollClassName,
          '-mr-3 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 transition-[max-height,opacity] duration-200 ease-out',
          compact && 'max-h-0 flex-none opacity-0',
        )}
        aria-hidden={compact}
      >
        {loading ? (
          <p className="px-1 py-1 text-sm text-muted-foreground">{tc('loading')}</p>
        ) : unavailable ? (
          <p className="px-1 py-1 text-sm text-muted-foreground">{te('catalogUnavailable')}</p>
        ) : tree.length > 0 ? (
          <nav aria-label={t('categoryNavLabel')} className="space-y-0.5">
            <CatalogCategoryTreeItems
              nodes={tree}
              depth={0}
              activeSlug={activeSlug}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              variant="desktop"
            />
          </nav>
        ) : (
          <p className="px-1 py-1 text-sm text-muted-foreground">{t('noCategories')}</p>
        )}
      </div>
    </div>
  )
}
