'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { CategoryTreeNode } from '@/lib/catalog/categories'
import { categoryHref } from '@/lib/catalog/paths'
import { Link } from '@/i18n/navigation'
import { pressableClassName } from '@/lib/pressable'
import { cn } from '@/lib/utils'

type CatalogCategoryTreeItemsProps = {
  nodes: CategoryTreeNode[]
  depth: number
  activeSlug: string | null
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onNavigate?: () => void
  variant?: 'mobile' | 'desktop'
}

export function CatalogCategoryTreeItems({
  nodes,
  depth,
  activeSlug,
  expandedIds,
  onToggleExpand,
  onNavigate,
  variant = 'desktop',
}: CatalogCategoryTreeItemsProps) {
  const tc = useTranslations('common')
  const isMobile = variant === 'mobile'

  return nodes.map((node) => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(node.id)
    const isActive = activeSlug === node.slug
    const href = categoryHref(node.slug)

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-0.5',
            isMobile && 'border-b border-[#65954f38] pb-0.5',
          )}
          style={{ paddingLeft: `${depth * (isMobile ? 12 : 10) + (isMobile ? 8 : 4)}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              className={cn(
                pressableClassName,
                'flex shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground',
                isMobile ? 'h-8 w-8' : 'h-7 w-7',
              )}
              aria-label={isExpanded ? tc('collapse') : tc('expand')}
              onClick={() => onToggleExpand(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className={isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
              ) : (
                <ChevronRight className={isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
              )}
            </button>
          ) : (
            <span className={cn('shrink-0', isMobile ? 'h-8 w-8' : 'h-7 w-7')} />
          )}
          <Link
            href={href}
            data-mobile-catalog-active={isMobile && isActive ? 'true' : undefined}
            className={cn(
              pressableClassName,
              'min-w-0 flex-1 rounded-md transition-colors hover:bg-muted hover:text-primary',
              isMobile ? 'px-2 py-2 text-[18px] tracking-wide' : 'px-2 py-1.5 text-sm',
              isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground',
            )}
            onClick={onNavigate}
          >
            <span className="line-clamp-2">{node.name}</span>
          </Link>
        </div>

        {hasChildren && isExpanded ? (
          <CatalogCategoryTreeItems
            nodes={node.children}
            depth={depth + 1}
            activeSlug={activeSlug}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onNavigate={onNavigate}
            variant={variant}
          />
        ) : null}
      </div>
    )
  })
}
