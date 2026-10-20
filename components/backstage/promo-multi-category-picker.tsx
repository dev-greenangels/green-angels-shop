'use client'

import { useMemo, useState } from 'react'
import { ChevronsUpDown, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import type { CategoryOption } from '@/components/backstage/category-combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  clearFilteredCategoriesResult,
  filterCategoriesByQuery,
  pruneRedundantCategoryIds,
  selectAllCategories,
  toggleCategorySelection,
  type ScopeCategoryOption,
} from '@/lib/backstage/promo-scope-selection'
import { cn } from '@/lib/utils'

function toScopeOptions(options: CategoryOption[]): ScopeCategoryOption[] {
  return options.map((o) => ({
    id: o.id,
    name: o.name,
    depth: o.depth,
    parentId: o.parentId ?? null,
  }))
}

export function PromoMultiCategoryPicker({
  options,
  selectedIds,
  onChange,
  loading,
  label,
  descendantsHint,
}: {
  options: CategoryOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
  label?: string
  /** Override default descendants hint (e.g. exclude vs include). */
  descendantsHint?: string
}) {
  const t = useTranslations('promoScopePicker')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [clearHint, setClearHint] = useState<string | null>(null)

  const scopeOptions = useMemo(() => toScopeOptions(options), [options])
  const visible = useMemo(
    () => filterCategoriesByQuery(scopeOptions, query),
    [scopeOptions, query],
  )
  const prunedSelected = useMemo(
    () => pruneRedundantCategoryIds(selectedIds, scopeOptions),
    [selectedIds, scopeOptions],
  )
  const selectedSet = useMemo(() => new Set(prunedSelected), [prunedSelected])
  const selectedOptions = useMemo(
    () => scopeOptions.filter((o) => selectedSet.has(o.id)),
    [scopeOptions, selectedSet],
  )

  const emit = (ids: string[]) => onChange(pruneRedundantCategoryIds(ids, scopeOptions))

  const allVisibleSelected =
    visible.length > 0 && visible.every((o) => selectedSet.has(o.id) || hasSelectedAncestor(o.id, selectedSet, scopeOptions))

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label ?? t('categoriesLabel')}</Label>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {descendantsHint ?? t('categoryDescendantsHint')}
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between font-normal"
            disabled={loading}
            aria-expanded={open}
          >
            {prunedSelected.length
              ? t('selectedCount', { count: prunedSelected.length })
              : t('chooseCategories')}
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[80] w-[var(--radix-popover-trigger-width)] border-border/60 bg-popover p-0 shadow-lg shadow-black/10"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-2 border-b border-border/60 p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchCategory')}
              className="h-8 text-sm"
              aria-label={t('searchCategory')}
            />
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={!visible.length || allVisibleSelected}
                onClick={() => emit(selectAllCategories(prunedSelected, visible, scopeOptions))}
              >
                {t('selectAllFiltered')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={!visible.length}
                onClick={() => {
                  const result = clearFilteredCategoriesResult(
                    prunedSelected,
                    visible,
                    scopeOptions,
                  )
                  emit(result.nextIds)
                  setClearHint(
                    result.coveredRemainCount > 0
                      ? t('clearFilteredParentRemains', {
                          count: result.coveredRemainCount,
                        })
                      : null,
                  )
                }}
              >
                {t('clearFiltered')}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('filteredCount', { count: visible.length })}
            </p>
            {clearHint ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">{clearHint}</p>
            ) : null}
          </div>
          <div className="max-h-56 overflow-y-auto p-1" role="listbox" aria-multiselectable>
            {loading ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t('loading')}</p>
            ) : !visible.length ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t('categoryEmpty')}</p>
            ) : (
              visible.map((option) => {
                const checked = selectedSet.has(option.id)
                const coveredByAncestor = !checked && hasSelectedAncestor(option.id, selectedSet, scopeOptions)
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60',
                      coveredByAncestor && 'opacity-60',
                    )}
                  >
                    <Checkbox
                      checked={checked || coveredByAncestor}
                      disabled={coveredByAncestor}
                      onCheckedChange={() => {
                        if (coveredByAncestor) return
                        emit(toggleCategorySelection(prunedSelected, option.id, scopeOptions))
                      }}
                      aria-label={option.name}
                    />
                    <span className="min-w-0 truncate">
                      {'— '.repeat(option.depth)}
                      {option.name}
                    </span>
                    {coveredByAncestor ? (
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                        {t('coveredByParent')}
                      </span>
                    ) : null}
                  </label>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedOptions.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              {t('selectedList', { count: selectedOptions.length })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => emit([])}
            >
              {t('clearAll')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((option) => (
              <Badge key={option.id} variant="secondary" className="gap-1 text-xs font-normal">
                {option.name}
                <button
                  type="button"
                  onClick={() => emit(toggleCategorySelection(prunedSelected, option.id, scopeOptions))}
                  aria-label={t('removeItem')}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function hasSelectedAncestor(
  id: string,
  selected: Set<string>,
  options: ScopeCategoryOption[],
): boolean {
  const parentById = new Map(options.map((o) => [o.id, o.parentId ?? null]))
  let walk = parentById.get(id) ?? null
  while (walk) {
    if (selected.has(walk)) return true
    walk = parentById.get(walk) ?? null
  }
  return false
}
