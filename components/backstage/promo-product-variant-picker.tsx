'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, Loader2, Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { backstagePickerResultButtonClassName } from '@/lib/backstage/picker-styles'
import {
  fetchBackstageProduct,
  fetchBackstageProducts,
  type BackstageProductListItem,
} from '@/lib/backstage/products'
import { cn } from '@/lib/utils'

type SelectedItem = { id: string; label: string }

const MIN_SEARCH_CHARS = 1
const DEBOUNCE_MS = 300

export function PromoProductVariantPicker({
  mode,
  selected,
  onChange,
  label,
}: {
  mode: 'products' | 'variants' | 'gift'
  selected: SelectedItem[]
  onChange: (items: SelectedItem[]) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<BackstageProductListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [variants, setVariants] = useState<Array<{ id: string; label: string }>>([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const anchorRef = useRef<HTMLDivElement>(null)

  const selectedIds = new Set(selected.map((item) => item.id))
  const single = mode === 'gift'

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_SEARCH_CHARS) {
      setProducts([])
      setSearchError(null)
      setLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    setSearchError(null)

    try {
      const list = await fetchBackstageProducts({ search: trimmed, published: 'all' })
      if (requestIdRef.current !== requestId) return

      const sliced = Array.isArray(list) ? list.slice(0, 12) : []
      setProducts(sliced)
      setExpandedProductId(null)
      setVariants([])
      if (!sliced.length) {
        setSearchError('Товарів не знайдено.')
      }
    } catch {
      if (requestIdRef.current !== requestId) return
      setProducts([])
      setSearchError('Не вдалося виконати пошук.')
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      void runSearch(search)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, search, runSearch])

  const loadVariants = async (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null)
      setVariants([])
      return
    }

    setExpandedProductId(productId)
    setVariantsLoading(true)
    try {
      const detail = await fetchBackstageProduct(productId)
      setVariants(
        detail.variants.map((v) => ({
          id: v.id,
          label: `${detail.name}${v.label ? ` · ${v.label}` : ''}`,
        })),
      )
    } catch {
      setVariants([])
    } finally {
      setVariantsLoading(false)
    }
  }

  const closeDropdown = () => {
    setOpen(false)
    setExpandedProductId(null)
    setVariants([])
    setProducts([])
    setSearchError(null)
  }

  const addItem = (item: SelectedItem) => {
    if (single) {
      onChange([item])
      setSearch(item.label)
      closeDropdown()
      return
    }
    if (selectedIds.has(item.id)) return
    onChange([...selected, item])
    setSearch('')
    closeDropdown()
  }

  const removeItem = (id: string) => onChange(selected.filter((item) => item.id !== id))

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setExpandedProductId(null)
      setVariants([])
      setProducts([])
      setSearchError(null)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>

      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder={mode === 'products' ? 'Пошук товару…' : 'Пошук товару / розміру…'}
              className="h-9 bg-background pl-9 text-sm shadow-sm"
              autoComplete="off"
            />
            {loading ? (
              <Loader2 className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg shadow-black/10"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-52">
              {search.trim().length < MIN_SEARCH_CHARS ? (
                <CommandEmpty>Введіть мінімум {MIN_SEARCH_CHARS} символ</CommandEmpty>
              ) : loading ? (
                <CommandEmpty>Пошук…</CommandEmpty>
              ) : searchError ? (
                <CommandEmpty>{searchError}</CommandEmpty>
              ) : mode === 'products' ? (
                <CommandEmpty>Товарів не знайдено</CommandEmpty>
              ) : (
                <CommandEmpty>Товарів не знайдено</CommandEmpty>
              )}

              {mode === 'products' ? (
                <CommandGroup className="p-1">
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => addItem({ id: product.id, label: product.name })}
                      className={backstagePickerResultButtonClassName}
                    >
                      {product.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <div className="p-1">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-md">
                      <button
                        type="button"
                        className={cn(
                          backstagePickerResultButtonClassName,
                          'flex w-full items-center justify-between gap-2',
                        )}
                        onClick={() => void loadVariants(product.id)}
                      >
                        <span className="truncate text-left">{product.name}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          {product.variantCount} розм.
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 transition-transform',
                              expandedProductId === product.id && 'rotate-90',
                            )}
                          />
                        </span>
                      </button>
                      {expandedProductId === product.id ? (
                        <div className="ml-2 border-l border-border/60 pl-2">
                          {variantsLoading ? (
                            <p className="px-2 py-1.5 text-xs text-muted-foreground">Завантаження…</p>
                          ) : variants.length ? (
                            variants.map((variant) => (
                              <button
                                key={variant.id}
                                type="button"
                                className={cn(backstagePickerResultButtonClassName, 'text-sm')}
                                onClick={() => addItem(variant)}
                              >
                                {variant.label}
                              </button>
                            ))
                          ) : (
                            <p className="px-2 py-1.5 text-xs text-muted-foreground">Немає розмірів</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <Badge key={item.id} variant="secondary" className="max-w-full gap-1 text-xs font-normal">
              <span className="truncate">{item.label}</span>
              <button type="button" onClick={() => removeItem(item.id)} aria-label="Прибрати">
                <X className="h-3 w-3 shrink-0" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      {!single && selected.length > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onChange([])}
        >
          Очистити
        </Button>
      ) : null}
    </div>
  )
}
