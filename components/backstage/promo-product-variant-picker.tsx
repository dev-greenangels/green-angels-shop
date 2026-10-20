'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
  type WheelEvent,
} from 'react'
import { ChevronRight, Loader2, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import type { CategoryOption } from '@/components/backstage/category-combobox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchBackstageProduct,
  fetchBackstageProductsPage,
  type BackstageProductListItem,
} from '@/lib/backstage/products'
import { mapWithConcurrency } from '@/lib/backstage/promotions-form'
import {
  mergeSelectedItems,
  removeSelectedIds,
  toggleSelectedItem,
  type ScopeSelectedItem,
} from '@/lib/backstage/promo-scope-selection'
import {
  fetchVariantAttributes,
  type VariantAttribute,
  type VariantAttributeValue,
} from '@/lib/backstage/variant-attributes'
import { cn } from '@/lib/utils'

const MIN_SEARCH_CHARS = 0
const DEBOUNCE_MS = 300
const PAGE_SIZE = 20
const VARIANT_FETCH_CONCURRENCY = 4

type SelectedItem = ScopeSelectedItem

type VariantRow = {
  id: string
  label: string
  attributeValueIds: string[]
}

type ContainerValueOption = VariantAttributeValue & { attributeSlug: string }

function isContainerAttribute(attr: VariantAttribute): boolean {
  return attr.valueType === 'CONTAINER' || attr.slug === 'konteyner'
}

function serializeContainerFilter(
  selectedValueIds: string[],
  options: ContainerValueOption[],
): string | undefined {
  if (!selectedValueIds.length) return undefined
  const selected = new Set(selectedValueIds)
  const pairs = options
    .filter((opt) => selected.has(opt.id))
    .map((opt) => `${opt.attributeSlug}=${opt.slug}`)
  return pairs.length ? pairs.join(',') : undefined
}

function filterVariantRows(rows: VariantRow[], selectedValueIds: string[]): VariantRow[] {
  if (!selectedValueIds.length) return rows
  const wanted = new Set(selectedValueIds)
  return rows.filter((row) => row.attributeValueIds.some((id) => wanted.has(id)))
}

/** Keep wheel/touch scroll inside the picker when nested in a Dialog (react-remove-scroll). */
function stopNestedScrollPropagation(event: WheelEvent | TouchEvent) {
  event.stopPropagation()
}

export function PromoProductVariantPicker({
  mode,
  selected,
  onChange,
  label,
  categoryOptions = [],
  selectionLayout = 'chips',
}: {
  mode: 'products' | 'variants' | 'gift'
  selected: SelectedItem[]
  onChange: (items: SelectedItem[]) => void
  label: string
  /** Optional category filter (server-side). */
  categoryOptions?: CategoryOption[]
  /** `list` = scrollable rows (discount editor); `chips` = compact badges. */
  selectionLayout?: 'chips' | 'list'
}) {
  const t = useTranslations('promoScopePicker')
  const { locale: contentLocale } = useBackstageContentLocale()
  const single = mode === 'gift'

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<string>('all')
  const [containerValueIds, setContainerValueIds] = useState<string[]>([])
  const [containerOptions, setContainerOptions] = useState<ContainerValueOption[]>([])
  const [products, setProducts] = useState<BackstageProductListItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, VariantRow[]>>({})
  const [variantsLoadingId, setVariantsLoadingId] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const anchorRef = useRef<HTMLDivElement>(null)

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected])
  const hasMore = products.length < total
  const variantAttributesParam = useMemo(
    () => serializeContainerFilter(containerValueIds, containerOptions),
    [containerValueIds, containerOptions],
  )

  useEffect(() => {
    let cancelled = false
    void fetchVariantAttributes({ locale: contentLocale, edit: false })
      .then((attrs) => {
        if (cancelled) return
        const options = attrs
          .filter(isContainerAttribute)
          .flatMap((attr) =>
            attr.values.map((value) => ({
              ...value,
              attributeSlug: attr.slug,
            })),
          )
          .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
        setContainerOptions(options)
      })
      .catch(() => {
        if (!cancelled) setContainerOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [contentLocale])

  const runSearch = useCallback(
    async (
      query: string,
      catId: string,
      containerFilter: string | undefined,
      pageNum: number,
      append: boolean,
    ) => {
      const trimmed = query.trim()
      if (trimmed.length < MIN_SEARCH_CHARS && catId === 'all' && pageNum === 1 && !append) {
        // Allow browsing first page without search when category filter set, or empty query = browse all.
      }

      const requestId = ++requestIdRef.current
      if (append) setLoadingMore(true)
      else setLoading(true)
      setSearchError(null)

      try {
        const result = await fetchBackstageProductsPage({
          search: trimmed || undefined,
          categoryId: catId !== 'all' ? catId : undefined,
          variantAttributes: containerFilter,
          published: 'all',
          locale: contentLocale,
          page: pageNum,
          pageSize: PAGE_SIZE,
        })
        if (requestIdRef.current !== requestId) return

        setTotal(result.total)
        setPage(result.page)
        setProducts((prev) => (append ? dedupeProducts([...prev, ...result.items]) : result.items))
        if (!append) {
          setExpandedProductId(null)
          setVariantsByProduct({})
        }
        if (!result.items.length && !append) {
          setSearchError(t('productsEmpty'))
        }
      } catch {
        if (requestIdRef.current !== requestId) return
        if (!append) {
          setProducts([])
          setTotal(0)
          setSearchError(t('productsError'))
        }
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [contentLocale, t],
  )

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      void runSearch(search, categoryId, variantAttributesParam, 1, false)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, search, categoryId, variantAttributesParam, runSearch])

  const mapDetailVariants = (productName: string, detail: Awaited<ReturnType<typeof fetchBackstageProduct>>) =>
    detail.variants.map((v) => ({
      id: v.id,
      label: `${productName}${v.label ? ` · ${v.label}` : ''}`,
      attributeValueIds: v.attributeValueIds ?? [],
    }))

  const loadVariants = async (product: BackstageProductListItem) => {
    if (expandedProductId === product.id) {
      setExpandedProductId(null)
      return
    }
    setExpandedProductId(product.id)
    if (variantsByProduct[product.id]) return

    setVariantsLoadingId(product.id)
    try {
      const detail = await fetchBackstageProduct(product.id, contentLocale, { edit: false })
      setVariantsByProduct((prev) => ({
        ...prev,
        [product.id]: mapDetailVariants(detail.name, detail),
      }))
    } catch {
      setVariantsByProduct((prev) => ({ ...prev, [product.id]: [] }))
    } finally {
      setVariantsLoadingId(null)
    }
  }

  const closeDropdown = () => {
    setOpen(false)
    setExpandedProductId(null)
  }

  const addSingle = (item: SelectedItem) => {
    onChange([item])
    setSearch(item.label)
    closeDropdown()
  }

  const toggleProduct = (product: BackstageProductListItem) => {
    // Gift must be a concrete size (variant), never a whole product.
    if (mode === 'gift') {
      void loadVariants(product)
      return
    }
    onChange(
      toggleSelectedItem(selected, {
        id: product.id,
        label: product.name,
      }),
    )
  }

  const toggleVariant = (variant: SelectedItem) => {
    if (single) {
      addSingle(variant)
      return
    }
    onChange(toggleSelectedItem(selected, variant))
  }

  const selectAllShownProducts = () => {
    if (mode !== 'products' || single) return
    onChange(
      mergeSelectedItems(
        selected,
        products.map((p) => ({ id: p.id, label: p.name })),
      ),
    )
  }

  const clearShownProducts = () => {
    if (mode !== 'products' || single) return
    onChange(removeSelectedIds(selected, products.map((p) => p.id)))
  }

  const ensureProductVariants = async (product: BackstageProductListItem): Promise<VariantRow[]> => {
    const cached = variantsByProduct[product.id]
    if (cached) return cached
    setVariantsLoadingId(product.id)
    try {
      const detail = await fetchBackstageProduct(product.id, contentLocale, { edit: false })
      const rows = mapDetailVariants(detail.name, detail)
      setVariantsByProduct((prev) => ({ ...prev, [product.id]: rows }))
      return rows
    } catch {
      setVariantsByProduct((prev) => ({ ...prev, [product.id]: [] }))
      return []
    } finally {
      setVariantsLoadingId(null)
    }
  }

  const selectAllSizesOfProduct = async (product: BackstageProductListItem) => {
    const rows = filterVariantRows(await ensureProductVariants(product), containerValueIds)
    if (!rows.length) return
    onChange(
      mergeSelectedItems(
        selected,
        rows.map((row) => ({ id: row.id, label: row.label })),
      ),
    )
    setExpandedProductId(product.id)
  }

  const selectAllShownVariants = async () => {
    if (mode !== 'variants' || single) return
    const rowsByProduct = await mapWithConcurrency(
      products,
      VARIANT_FETCH_CONCURRENCY,
      async (product) => {
        const rows = filterVariantRows(await ensureProductVariants(product), containerValueIds)
        return { productId: product.id, rows }
      },
    )
    const toAdd = rowsByProduct.flatMap((row) =>
      row.rows.map((variant) => ({ id: variant.id, label: variant.label })),
    )
    if (toAdd.length) onChange(mergeSelectedItems(selected, toAdd))
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setExpandedProductId(null)
  }

  const productLabel = (product: BackstageProductListItem) => {
    const sku = product.sku?.trim()
    return sku ? `${product.name} · ${sku}` : product.name
  }

  const containerSelectValue =
    containerValueIds.length === 1 ? containerValueIds[0]! : 'all'
  const showSizePicker = mode === 'variants' || mode === 'gift'

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {mode === 'products'
          ? t('productsHint')
          : mode === 'variants'
            ? t('variantsHint')
            : t('giftHint')}
      </p>

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
              placeholder={
                mode === 'products'
                  ? t('searchProductPlaceholder')
                  : mode === 'gift'
                    ? t('searchGiftPlaceholder')
                    : t('searchVariantPlaceholder')
              }
              className="h-9 bg-background pl-9 text-sm shadow-sm"
              autoComplete="off"
              aria-label={label}
            />
            {loading ? (
              <Loader2 className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="z-[90] w-[min(100vw-2rem,var(--radix-popover-trigger-width))] p-0 shadow-lg shadow-black/10 sm:w-[var(--radix-popover-trigger-width)]"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheel={stopNestedScrollPropagation}
          onTouchMove={stopNestedScrollPropagation}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) {
              e.preventDefault()
            }
          }}
        >
          <div className="space-y-2 border-b border-border/60 p-2">
            {categoryOptions.length ? (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-8 text-xs" aria-label={t('filterCategory')}>
                  <SelectValue placeholder={t('filterCategory')} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">{t('allCategories')}</SelectItem>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {'— '.repeat(opt.depth)}
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {containerOptions.length ? (
              <Select
                value={containerSelectValue}
                onValueChange={(value) =>
                  setContainerValueIds(value === 'all' ? [] : [value])
                }
              >
                <SelectTrigger className="h-8 text-xs" aria-label={t('filterContainer')}>
                  <SelectValue placeholder={t('filterContainer')} />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[100]">
                  <SelectItem value="all">{t('allContainers')}</SelectItem>
                  {containerOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {!single ? (
              <div className="flex flex-wrap gap-1">
                {mode === 'products' ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={!products.length}
                      onClick={selectAllShownProducts}
                    >
                      {t('selectAllLoaded')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={!products.length}
                      onClick={clearShownProducts}
                    >
                      {t('clearLoaded')}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={!products.length}
                    onClick={() => void selectAllShownVariants()}
                  >
                    {t('selectAllLoadedVariants')}
                  </Button>
                )}
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              {t('loadedOfTotal', { loaded: products.length, total })}
              {mode === 'products' && !single
                ? ` · ${t('selectedProductsCount', { count: selected.length })}`
                : null}
              {mode === 'variants' && !single
                ? ` · ${t('selectedVariantsCount', { count: selected.length })}`
                : null}
            </p>
            {!single ? (
              <p className="text-[11px] text-muted-foreground">{t('selectAllSearchUnavailable')}</p>
            ) : null}
          </div>

          <div
            className="max-h-64 overflow-y-auto overscroll-contain p-1"
            onWheel={stopNestedScrollPropagation}
            onTouchMove={stopNestedScrollPropagation}
          >
            {loading && !products.length ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t('loading')}</p>
            ) : searchError && !products.length ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{searchError}</p>
            ) : !products.length ? (
              <p className="px-2 py-3 text-xs text-muted-foreground">{t('productsEmpty')}</p>
            ) : mode === 'products' ? (
              <div className="space-y-0.5">
                {products.map((product) => {
                  const checked = selectedIds.has(product.id)
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/60"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleProduct(product)}
                        aria-label={product.name}
                      />
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-sm"
                        onClick={() => toggleProduct(product)}
                      >
                        {productLabel(product)}
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({product.variantCount})
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : showSizePicker ? (
              <div className="space-y-1">
                {products.map((product) => {
                  const expanded = expandedProductId === product.id
                  const allRows = variantsByProduct[product.id] ?? []
                  const rows = filterVariantRows(allRows, containerValueIds)
                  const loadingVariants = variantsLoadingId === product.id
                  const productHasSelectedSize = allRows.some((row) => selectedIds.has(row.id))
                  return (
                    <div key={product.id} className="rounded-md border border-border/40">
                      <div className="flex items-center gap-1 px-1 py-1">
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-accent/50"
                          onClick={() => void loadVariants(product)}
                          aria-expanded={expanded}
                        >
                          <ChevronRight
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 transition-transform',
                              expanded && 'rotate-90',
                            )}
                          />
                          <span className="truncate">{productLabel(product)}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {product.variantCount}
                          </span>
                          {mode === 'gift' && productHasSelectedSize ? (
                            <span className="shrink-0 text-[10px] font-medium text-primary">
                              {t('giftSizeSelected')}
                            </span>
                          ) : null}
                        </button>
                        {mode === 'variants' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 shrink-0 px-2 text-[11px]"
                            onClick={() => void selectAllSizesOfProduct(product)}
                          >
                            {t('selectAllSizes')}
                          </Button>
                        ) : null}
                      </div>
                      {expanded ? (
                        <div className="border-t border-border/40 px-2 py-1">
                          {loadingVariants ? (
                            <p className="px-1 py-1.5 text-xs text-muted-foreground">{t('loading')}</p>
                          ) : rows.length ? (
                            rows.map((variant) =>
                              mode === 'gift' ? (
                                <button
                                  key={variant.id}
                                  type="button"
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm hover:bg-accent/50',
                                    selectedIds.has(variant.id) && 'bg-primary/10',
                                  )}
                                  onClick={() =>
                                    toggleVariant({ id: variant.id, label: variant.label })
                                  }
                                >
                                  <span
                                    className={cn(
                                      'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border',
                                      selectedIds.has(variant.id)
                                        ? 'border-primary bg-primary'
                                        : 'border-muted-foreground/40',
                                    )}
                                    aria-hidden
                                  />
                                  <span className="truncate">{variant.label}</span>
                                </button>
                              ) : (
                                <label
                                  key={variant.id}
                                  className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-accent/50"
                                >
                                  <Checkbox
                                    checked={selectedIds.has(variant.id)}
                                    onCheckedChange={() =>
                                      toggleVariant({ id: variant.id, label: variant.label })
                                    }
                                    aria-label={variant.label}
                                  />
                                  <span className="truncate">{variant.label}</span>
                                </label>
                              ),
                            )
                          ) : (
                            <p className="px-1 py-1.5 text-xs text-muted-foreground">
                              {t('noSizes')}
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>

          {hasMore ? (
            <div className="border-t border-border/60 p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                disabled={loadingMore}
                onClick={() =>
                  void runSearch(search, categoryId, variantAttributesParam, page + 1, true)
                }
              >
                {loadingMore ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : null}
                {t('loadMore')}
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              {mode === 'products'
                ? t('selectedProductsCount', { count: selected.length })
                : t('selectedVariantsCount', { count: selected.length })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onChange([])}
            >
              {t('clearAll')}
            </Button>
          </div>
          {selectionLayout === 'list' ? (
            <div className="max-h-48 space-y-0.5 overflow-y-auto overscroll-contain rounded-md border border-border/60 bg-muted/15 p-1">
              {selected.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                >
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                    onClick={() => onChange(selected.filter((row) => row.id !== item.id))}
                    aria-label={t('removeItem')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((item) => (
                <Badge
                  key={item.id}
                  variant="secondary"
                  className="max-w-full gap-1 text-xs font-normal"
                >
                  <span className="truncate">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => onChange(selected.filter((row) => row.id !== item.id))}
                    aria-label={t('removeItem')}
                  >
                    <X className="h-3 w-3 shrink-0" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function dedupeProducts(items: BackstageProductListItem[]): BackstageProductListItem[] {
  const seen = new Set<string>()
  const out: BackstageProductListItem[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}
