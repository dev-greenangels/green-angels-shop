'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Save, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { InputWithClear } from '@/components/ui/input-with-clear'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  bulkUpdateCharacteristicsMatrix,
  fetchBulkCharacteristicsMatrix,
  type BulkMatrixProductRow,
  type CharacteristicCellValue,
  type CharacteristicDefinition,
} from '@/lib/backstage/characteristics'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

function cellKey(productId: string, characteristicId: string) {
  return `${productId}:${characteristicId}`
}

function valueToKey(value: CharacteristicCellValue): string {
  if (!value) return ''
  if (value.optionIds?.length) return value.optionIds.slice().sort().join(',')
  if (value.optionId) return value.optionId
  if (value.textValue) return value.textValue
  if (value.numberValue != null) return String(value.numberValue)
  return ''
}

function buildCellUpdate(
  productId: string,
  characteristicId: string,
  value: CharacteristicCellValue,
  definition: CharacteristicDefinition,
) {
  if (!value) {
    return { productId, characteristicId, clear: true as const }
  }

  if (definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR') {
    const optionIds = value.optionIds ?? []
    return optionIds.length
      ? { productId, characteristicId, optionIds }
      : { productId, characteristicId, clear: true as const }
  }

  if (definition.valueType === 'SELECT') {
    return value.optionId
      ? { productId, characteristicId, optionId: value.optionId }
      : { productId, characteristicId, clear: true as const }
  }

  if (definition.valueType === 'TEXT') {
    return value.textValue?.trim()
      ? { productId, characteristicId, textValue: value.textValue.trim() }
      : { productId, characteristicId, clear: true as const }
  }

  if (definition.valueType === 'NUMBER' && value.numberValue != null) {
    return { productId, characteristicId, numberValue: value.numberValue }
  }

  return { productId, characteristicId, clear: true as const }
}

function multiSelectLabel(
  definition: CharacteristicDefinition,
  value: CharacteristicCellValue,
  emptyLabel: string,
) {
  const ids = value?.optionIds ?? []
  if (!ids.length) return emptyLabel
  const labels = ids
    .map((id) => definition.options.find((option) => option.id === id)?.label)
    .filter(Boolean)
  return labels.length ? labels.join(', ') : emptyLabel
}

function CharacteristicCellEditor({
  definition,
  value,
  dirty,
  onChange,
}: {
  definition: CharacteristicDefinition
  value: CharacteristicCellValue
  dirty: boolean
  onChange: (value: CharacteristicCellValue) => void
}) {
  const tHints = useTranslations('hints')

  if (definition.valueType === 'MULTI_SELECT' || definition.valueType === 'COLOR') {
    const selectedIds = value?.optionIds ?? []
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'h-8 w-full max-w-[180px] justify-start truncate text-xs font-normal',
              dirty && 'border-primary bg-primary/5',
            )}
          >
            {multiSelectLabel(definition, value, tHints('notSpecified'))}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-2">
            {definition.options.map((option) => {
              const checked = selectedIds.includes(option.id)
              return (
                <label key={option.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) => {
                      const optionIds = next
                        ? [...selectedIds, option.id]
                        : selectedIds.filter((id) => id !== option.id)
                      onChange(optionIds.length ? { optionIds } : null)
                    }}
                  />
                  <span className="inline-flex items-center gap-2">
                    {option.colorHex ? (
                      <span
                        className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: option.colorHex }}
                        aria-hidden
                      />
                    ) : null}
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  if (definition.valueType === 'SELECT') {
    return (
      <Select
        value={value?.optionId ?? '__none__'}
        onValueChange={(next) => onChange(next === '__none__' ? null : { optionId: next })}
      >
        <SelectTrigger
          className={cn('h-8 w-full max-w-[180px] text-xs', dirty && 'border-primary bg-primary/5')}
        >
          <SelectValue placeholder={tHints('notSpecified')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{tHints('notSpecified')}</SelectItem>
          {definition.options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              <span className="inline-flex items-center gap-2">
                {option.colorHex ? (
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: option.colorHex }}
                    aria-hidden
                  />
                ) : null}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (definition.valueType === 'NUMBER') {
    return (
      <Input
        type="number"
        className={cn('h-8 w-full max-w-[120px] text-xs', dirty && 'border-primary bg-primary/5')}
        value={value?.numberValue ?? ''}
        onChange={(event) => {
          const raw = event.target.value
          if (!raw.trim()) {
            onChange(null)
            return
          }
          const numberValue = Number(raw)
          onChange(Number.isNaN(numberValue) ? null : { numberValue })
        }}
      />
    )
  }

  return (
    <Input
      className={cn('h-8 w-full min-w-[120px] text-xs', dirty && 'border-primary bg-primary/5')}
      value={value?.textValue ?? ''}
      onChange={(event) => {
        const textValue = event.target.value
        onChange(textValue.trim() ? { textValue } : null)
      }}
    />
  )
}

export function CharacteristicsBulkEditor({
  characteristics,
  onClose,
}: {
  characteristics: CharacteristicDefinition[]
  onClose: () => void
}) {
  const { locale: contentLocale } = useBackstageContentLocale()
  const tPages = useTranslations('pages.characteristics')
  const tProducts = useTranslations('pages.products')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const tLabels = useTranslations('labels')
  const tt = useTranslations('toast')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('in_stock')
  const [items, setItems] = useState<BulkMatrixProductRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [baseline, setBaseline] = useState<Map<string, string>>(new Map())
  const [draftValues, setDraftValues] = useState<Map<string, CharacteristicCellValue>>(new Map())

  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const loadPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (pageNum > 1) {
        if (loadingMoreRef.current) return
        loadingMoreRef.current = true
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      try {
        const data = await fetchBulkCharacteristicsMatrix({
          page: pageNum,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          stock: stockFilter,
          locale: contentLocale,
        })

        setItems((prev) => (replace ? data.items : [...prev, ...data.items]))
        setTotal(data.total)
        setPage(data.page)
        setHasMore(data.hasMore)

        setBaseline((prev) => {
          const next = replace ? new Map<string, string>() : new Map(prev)
          for (const row of data.items) {
            for (const definition of characteristics) {
              const key = cellKey(row.productId, definition.id)
              next.set(key, valueToKey(row.values[definition.id] ?? null))
            }
          }
          return next
        })

        setDraftValues((prev) => {
          const next = replace ? new Map<string, CharacteristicCellValue>() : new Map(prev)
          for (const row of data.items) {
            for (const definition of characteristics) {
              const key = cellKey(row.productId, definition.id)
              if (!next.has(key)) {
                next.set(key, row.values[definition.id] ?? null)
              }
            }
          }
          return next
        })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : tt('loadFailed'))
      } finally {
        setLoading(false)
        setLoadingMore(false)
        loadingMoreRef.current = false
      }
    },
    [characteristics, search, stockFilter, tt, contentLocale],
  )

  useEffect(() => {
    void loadPage(1, true)
  }, [loadPage])

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadPage(page + 1, false)
        }
      },
      { root, rootMargin: '200px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadPage, page])

  const dirtyKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const [key, value] of draftValues) {
      if (valueToKey(value) !== (baseline.get(key) ?? '')) {
        keys.add(key)
      }
    }
    return keys
  }, [baseline, draftValues])

  const getCellValue = (row: BulkMatrixProductRow, characteristicId: string) => {
    const key = cellKey(row.productId, characteristicId)
    if (draftValues.has(key)) return draftValues.get(key) ?? null
    return row.values[characteristicId] ?? null
  }

  const patchCell = (
    productId: string,
    characteristicId: string,
    value: CharacteristicCellValue,
  ) => {
    const key = cellKey(productId, characteristicId)
    setDraftValues((prev) => {
      const next = new Map(prev)
      next.set(key, value)
      return next
    })
  }

  const handleSave = async () => {
    if (!dirtyKeys.size) return

    const definitionById = new Map(characteristics.map((item) => [item.id, item]))
    const updates = [...dirtyKeys].map((key) => {
      const [productId, characteristicId] = key.split(':')
      const definition = definitionById.get(characteristicId)!
      const value = draftValues.get(key) ?? null
      return buildCellUpdate(productId, characteristicId, value, definition)
    })

    setSaving(true)
    try {
      await bulkUpdateCharacteristicsMatrix(updates, contentLocale)
      toast.success(tt('saved'))

      const nextBaseline = new Map(baseline)
      for (const key of dirtyKeys) {
        nextBaseline.set(key, valueToKey(draftValues.get(key) ?? null))
      }
      setBaseline(nextBaseline)

      setItems((prev) =>
        prev.map((row) => {
          let changed = false
          const values = { ...row.values }
          for (const definition of characteristics) {
            const key = cellKey(row.productId, definition.id)
            if (!dirtyKeys.has(key)) continue
            values[definition.id] = draftValues.get(key) ?? null
            changed = true
          }
          return changed ? { ...row, values } : row
        }),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-[calc(100svh-4.5rem)] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/60 px-1 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tPages('bulkMatrixBack')}
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl font-bold text-foreground">{tPages('bulkMatrixTitle')}</h1>
          <p className="text-sm text-muted-foreground">{tPages('bulkMatrixDesc')}</p>
        </div>

        <div className="w-full sm:w-56">
          <InputWithClear
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onClear={() => {
              setSearchInput('')
              setSearch('')
            }}
            placeholder={tPages('bulkMatrixSearch')}
            leadingIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <Select
          value={stockFilter}
          onValueChange={(value) => setStockFilter(value as typeof stockFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={tProducts('stockFilter')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tProducts('anyStock')}</SelectItem>
            <SelectItem value="in_stock">{tProducts('inStock')}</SelectItem>
            <SelectItem value="out_of_stock">{tProducts('outOfStock')}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {tPages('bulkMatrixLoadedCount', { loaded: items.length, total })}
          </span>
          {dirtyKeys.size > 0 ? (
            <span className="text-sm text-primary">
              {tPages('bulkMatrixDirtyCount', { count: dirtyKeys.size })}
            </span>
          ) : null}
          <Button type="button" disabled={saving || dirtyKeys.size === 0} onClick={() => void handleSave()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tActions('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {tActions('saveChanges')}
              </>
            )}
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {tCommon('loading')}
          </div>
        ) : (
          <table className="w-max min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-30 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr>
                <th className="sticky left-0 z-40 min-w-[220px] border-b border-r bg-background px-3 py-2 text-left font-medium">
                  {tLabels('product')}
                </th>
                {characteristics.map((definition) => (
                  <th
                    key={definition.id}
                    className="min-w-[160px] border-b px-3 py-2 text-left font-medium text-muted-foreground"
                  >
                    {definition.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const inStock = row.stock > 0
                return (
                <tr
                  key={row.productId}
                  className={cn(
                    'border-b border-border/60',
                    inStock ? 'hover:bg-muted/20' : 'bg-muted/30 text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  <td
                    className={cn(
                      'sticky left-0 z-20 border-r px-3 py-2',
                      inStock ? 'bg-background' : 'bg-muted',
                    )}
                  >
                    <div className="flex min-w-[180px] flex-col gap-1">
                      <span className={cn('font-medium', inStock ? 'text-foreground' : undefined)}>
                        {row.productName}
                      </span>
                      <span
                        className={cn(
                          'w-fit rounded-full px-2 py-0.5 text-xs font-medium',
                          inStock
                            ? row.stock < 20
                              ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'
                              : 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {inStock ? tProducts('stockUnits', { count: row.stock }) : tProducts('stockNone')}
                      </span>
                    </div>
                  </td>
                  {characteristics.map((definition) => {
                    const key = cellKey(row.productId, definition.id)
                    const value = getCellValue(row, definition.id)
                    const dirty = dirtyKeys.has(key)
                    return (
                      <td key={definition.id} className="px-3 py-2 align-top">
                        <CharacteristicCellEditor
                          definition={definition}
                          value={value}
                          dirty={dirty}
                          onChange={(next) => patchCell(row.productId, definition.id, next)}
                        />
                      </td>
                    )
                  })}
                </tr>
              )})}
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={characteristics.length + 1}
                    className="px-3 py-16 text-center text-muted-foreground"
                  >
                    {tCommon('nothingFound')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}

        <div ref={sentinelRef} className="h-8" />
        {loadingMore ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tCommon('loading')}
          </div>
        ) : null}
      </div>
    </div>
  )
}
