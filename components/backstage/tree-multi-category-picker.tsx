'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { categoryLabel, type CategoryTreeNode } from '@/lib/backstage/categories'
import { cn } from '@/lib/utils'

type FlatCategory = {
  id: string
  name: string
  depth: number
  hasChildren: boolean
}

function flattenCategoryTree(nodes: CategoryTreeNode[], depth = 0): FlatCategory[] {
  const result: FlatCategory[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: categoryLabel(node),
      depth,
      hasChildren: (node.children?.length ?? 0) > 0,
    })
    if (node.children?.length) {
      result.push(...flattenCategoryTree(node.children, depth + 1))
    }
  }
  return result
}

function collectNodeNames(nodes: CategoryTreeNode[]): Map<string, string> {
  const map = new Map<string, string>()
  const walk = (list: CategoryTreeNode[]) => {
    for (const node of list) {
      map.set(node.id, categoryLabel(node))
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return map
}

function TreeCategoryRows({
  nodes,
  depth,
  expandedIds,
  selectedIds,
  onToggleExpand,
  onToggleSelect,
}: {
  nodes: CategoryTreeNode[]
  depth: number
  expandedIds: Set<string>
  selectedIds: string[]
  onToggleExpand: (id: string) => void
  onToggleSelect: (id: string) => void
}) {
  return nodes.map((node) => {
    const hasChildren = (node.children?.length ?? 0) > 0
    const isExpanded = expandedIds.has(node.id)
    const isSelected = selectedIds.includes(node.id)

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-0.5 rounded-sm px-1 py-0.5 hover:bg-accent"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={isExpanded ? 'Згорнути' : 'Розгорнути'}
              onClick={(event) => {
                event.stopPropagation()
                onToggleExpand(node.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="h-6 w-6 shrink-0" />
          )}
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-1 text-left text-sm"
            onClick={() => onToggleSelect(node.id)}
          >
            <Check
              className={cn('h-3.5 w-3.5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
            />
            <span className="truncate">{node.name}</span>
          </button>
        </div>
        {hasChildren && isExpanded ? (
          <TreeCategoryRows
            nodes={node.children}
            depth={depth + 1}
            expandedIds={expandedIds}
            selectedIds={selectedIds}
            onToggleExpand={onToggleExpand}
            onToggleSelect={onToggleSelect}
          />
        ) : null}
      </div>
    )
  })
}

export function TreeMultiCategoryPicker({
  tree,
  selectedIds,
  onChange,
  loading,
  label = 'Категорії',
}: {
  tree: CategoryTreeNode[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [search, setSearch] = useState('')

  const flatOptions = useMemo(() => flattenCategoryTree(tree), [tree])
  const nameById = useMemo(() => collectNodeNames(tree), [tree])

  const selectedOptions = useMemo(
    () =>
      selectedIds.map((id) => ({
        id,
        name: nameById.get(id) ?? id,
      })),
    [selectedIds, nameById],
  )

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return []
    return flatOptions.filter((option) => option.name.toLowerCase().includes(query))
  }, [flatOptions, search])

  const toggleSelect = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setSearch('')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full justify-between font-normal"
            disabled={loading}
          >
            {selectedIds.length ? `Обрано: ${selectedIds.length}` : 'Обрати категорії'}
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="z-[80] flex w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden p-0"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Command shouldFilter={false} className="flex max-h-[min(70vh,24rem)] flex-col overflow-hidden">
            <CommandInput
              placeholder="Пошук категорії…"
              className="h-8 shrink-0"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="min-h-0 max-h-none flex-1 overflow-y-auto overscroll-contain">
              {search.trim() ? (
                <>
                  <CommandEmpty>Не знайдено</CommandEmpty>
                  <CommandGroup>
                    {searchResults.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.id}
                        onSelect={() => toggleSelect(option.id)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-3.5 w-3.5',
                            selectedIds.includes(option.id) ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate text-sm" style={{ paddingLeft: `${option.depth * 12}px` }}>
                          {option.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : tree.length > 0 ? (
                <div className="p-1">
                  <TreeCategoryRows
                    nodes={tree}
                    depth={0}
                    expandedIds={expandedIds}
                    selectedIds={selectedIds}
                    onToggleExpand={toggleExpand}
                    onToggleSelect={toggleSelect}
                  />
                </div>
              ) : (
                <CommandEmpty>Категорій немає</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge key={option.id} variant="secondary" className="gap-1 text-xs font-normal">
              {option.name}
              <button type="button" onClick={() => toggleSelect(option.id)} aria-label="Прибрати">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
