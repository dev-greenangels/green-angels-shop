'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

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
  /** When the parent mobile menu panel is open — used to scroll to the active subcategory. */
  menuOpen?: boolean
}

export function MobileCatalogNav({
  label,
  pathname,
  isCatalogActive,
  onNavigate,
  menuOpen = true,
}: MobileCatalogNavProps) {
  const tn = useTranslations('nav')
  const locale = useLocale()
  const tc = useTranslations('catalog')
  const te = useTranslations('errors')
  const tCommon = useTranslations('common')
  const rootRef = useRef<HTMLDivElement>(null)
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

    void fetch(`/api/catalog/categories?locale=${encodeURIComponent(locale)}`, { cache: 'no-store' })
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
  }, [activeSlug, locale])

  // Після відкриття меню / дерева — прокрутити до підсвіченої підкатегорії (або до рядка Каталог).
  useEffect(() => {
    if (!open || !menuOpen || loading) return

    const scrollToTarget = () => {
      const root = rootRef.current
      const scroller = root?.closest('[data-mobile-menu-panel]')
      if (!root || !(scroller instanceof HTMLElement)) return

      const stickyRow = root.querySelector('[data-mobile-catalog-sticky]')
      const stickyH = stickyRow instanceof HTMLElement ? stickyRow.offsetHeight : 0
      const activeEl = root.querySelector('[data-mobile-catalog-active="true"]')

      if (activeEl instanceof HTMLElement) {
        const elTop =
          activeEl.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          scroller.scrollTop
        scroller.scrollTo({
          top: Math.max(0, elTop - stickyH - 8),
          behavior: 'smooth',
        })
        return
      }

      const top =
        root.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop
      scroller.scrollTo({ top, behavior: 'smooth' })
    }

    const frame = window.requestAnimationFrame(scrollToTarget)
    // Після анімації max-height панелі меню
    const timer = window.setTimeout(scrollToTarget, 420)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [open, menuOpen, loading, activeSlug, tree, expandedIds])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div ref={rootRef}>
      <div
        data-mobile-catalog-sticky={open ? '' : undefined}
        className={cn(
          'flex items-center gap-1 rounded-md transition-colors',
          isCatalogActive && !open ? 'text-foreground' : '',
          open && 'sticky top-0 z-10 boty-glass-sticky',
        )}
      >
        <Link
          href={catalogHref}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 py-2.5 text-[18px] tracking-wide transition-colors hover:text-foreground',
            isCatalogRootActive ? 'font-medium text-foreground' : 'text-foreground/75',
          )}
          onClick={onNavigate}
        >
          <LayoutGrid className="h-5 w-5 shrink-0 opacity-80" strokeWidth={2} />
          <span className="flex-1">{label}</span>
        </Link>
        <button
          type="button"
          className={cn(
            'mr-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
            open
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-[#65954f38] bg-primary/5 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary',
          )}
          aria-label={open ? tn('collapseCategories') : tn('expandCategories')}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="mb-1 mt-0.5 space-y-0.5 border-l-2 border-primary/20 pl-2">
          {loading ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{tCommon('loading')}</p>
          ) : unavailable ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{te('catalogUnavailable')}</p>
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
            <p className="px-2 py-1.5 text-xs text-muted-foreground">{tc('noCategories')}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
