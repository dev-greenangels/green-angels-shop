'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { CatalogCategoryTreeItems } from '@/components/catalog/catalog-category-tree-items'
import type { CategoryTreeNode } from '@/lib/catalog/categories'
import { flattenCatalogRootForNav } from '@/lib/catalog/catalog-root'
import {
  filterActiveCategoryNodes,
  getCategoryAncestorIds,
  resolveActiveCategorySlug,
} from '@/lib/catalog/category-nav-tree'
import { isCatalogRootPath } from '@/lib/catalog/paths'
import { useCatalogHref, useCatalogRootSlug } from '@/components/providers/catalog-paths-provider'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/navigation'

type MobileCatalogNavProps = {
  label: string
  pathname: string
  isCatalogActive: boolean
  onNavigate: () => void
}

export function MobileCatalogNav({
  label,
  pathname,
  isCatalogActive,
  onNavigate,
}: MobileCatalogNavProps) {
  const tn = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const catalogHref = useCatalogHref()
  const catalogRootSlug = useCatalogRootSlug()
  const activeSlug = useMemo(() => resolveActiveCategorySlug(pathname), [pathname])
  const isCatalogRootActive = isCatalogRootPath(pathname, catalogRootSlug)

  useEffect(() => {
    if (isCatalogActive) setOpen(true)
  }, [isCatalogActive])

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
    <div className="rounded-lg">
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg transition-colors',
          isCatalogActive && !open ? 'bg-primary/10' : '',
        )}
      >
        <Link
          href={catalogHref}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-3 text-lg font-medium transition-colors hover:bg-muted hover:text-primary',
            isCatalogRootActive ? 'text-primary' : 'text-foreground',
          )}
          onClick={onNavigate}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" />
          <span className="flex-1">{label}</span>
        </Link>
        <button
          type="button"
          className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={open ? tn('collapseCategories') : tn('expandCategories')}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="mb-1 mt-0.5 space-y-0.5 border-l-2 border-primary/20 pl-2">
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Завантаження…</p>
          ) : unavailable ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Каталог тимчасово недоступний</p>
          ) : tree.length > 0 ? (
            <CatalogCategoryTreeItems
              nodes={tree}
              depth={0}
              activeSlug={activeSlug}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onNavigate={onNavigate}
              variant="mobile"
            />
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">Категорій немає</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
