'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight, Loader2, Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandList } from '@/components/ui/command'
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

export type FreshPhotoSizeSelection = {
  productId: string
  productName: string
  sizeId: string
  sizeLabel: string
  ean: string | null
  sku: string | null
}

const MIN_SEARCH_CHARS = 1
const DEBOUNCE_MS = 300

export function FreshPhotoSizePicker({
  value,
  onChange,
}: {
  value: FreshPhotoSizeSelection | null
  onChange: (value: FreshPhotoSizeSelection | null) => void
}) {
  const t = useTranslations('photos')
  const { locale: contentLocale } = useBackstageContentLocale()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<BackstageProductListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [variants, setVariants] = useState<
    Array<{ id: string; label: string; ean: string | null; sku: string | null }>
  >([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const requestIdRef = useRef(0)
  const anchorRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(
    async (query: string) => {
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
        const list = await fetchBackstageProducts({
          search: trimmed,
          published: 'all',
          locale: contentLocale,
        })
        if (requestIdRef.current !== requestId) return

        const sliced = Array.isArray(list) ? list.slice(0, 12) : []
        setProducts(sliced)
        setExpandedProductId(null)
        setVariants([])
        if (!sliced.length) setSearchError(t('sizeSearchEmpty'))
      } catch {
        if (requestIdRef.current !== requestId) return
        setProducts([])
        setSearchError(t('sizeSearchFailed'))
      } finally {
        if (requestIdRef.current === requestId) setLoading(false)
      }
    },
    [contentLocale, t],
  )

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      void runSearch(search)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [open, search, runSearch])

  const closeDropdown = () => {
    setOpen(false)
    setExpandedProductId(null)
    setVariants([])
    setProducts([])
    setSearchError(null)
  }

  const loadVariants = async (product: BackstageProductListItem) => {
    if (expandedProductId === product.id) {
      setExpandedProductId(null)
      setVariants([])
      return
    }

    setExpandedProductId(product.id)
    setVariantsLoading(true)
    try {
      const detail = await fetchBackstageProduct(product.id, contentLocale, { edit: false })
      setVariants(
        detail.variants.map((v) => ({
          id: v.id,
          label: v.label?.trim() || v.sku?.trim() || v.ean?.trim() || v.id,
          ean: v.ean?.trim() || null,
          sku: v.sku?.trim() || null,
        })),
      )
    } catch {
      setVariants([])
    } finally {
      setVariantsLoading(false)
    }
  }

  const selectVariant = (
    product: BackstageProductListItem,
    variant: { id: string; label: string; ean: string | null; sku: string | null },
  ) => {
    onChange({
      productId: product.id,
      productName: product.name,
      sizeId: variant.id,
      sizeLabel: variant.label,
      ean: variant.ean,
      sku: variant.sku,
    })
    setSearch(`${product.name} · ${variant.label}`)
    closeDropdown()
  }

  const clearSelection = () => {
    onChange(null)
    setSearch('')
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{t('sizePickerLabel')}</Label>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setExpandedProductId(null)
            setVariants([])
            setProducts([])
            setSearchError(null)
          }
        }}
        modal={false}
      >
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setOpen(true)
                if (value) onChange(null)
              }}
              onFocus={() => setOpen(true)}
              placeholder={t('sizePickerPlaceholder')}
              className="h-9 bg-background pl-9 pr-9 text-sm shadow-sm"
              autoComplete="off"
            />
            {loading ? (
              <Loader2 className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            ) : value || search ? (
              <button
                type="button"
                className="absolute right-2 top-2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                onClick={clearSelection}
                aria-label={t('sizePickerClear')}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 shadow-lg shadow-black/10"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
          }}
        >
          <Command shouldFilter={false}>
            <CommandList className="max-h-60">
              {search.trim().length < MIN_SEARCH_CHARS ? (
                <CommandEmpty>{t('sizeSearchHint', { count: MIN_SEARCH_CHARS })}</CommandEmpty>
              ) : loading ? (
                <CommandEmpty>{t('sizeSearching')}</CommandEmpty>
              ) : searchError ? (
                <CommandEmpty>{searchError}</CommandEmpty>
              ) : (
                <CommandEmpty>{t('sizeSearchEmpty')}</CommandEmpty>
              )}

              <div className="p-1">
                {products.map((product) => (
                  <div key={product.id} className="rounded-md">
                    <button
                      type="button"
                      className={cn(
                        backstagePickerResultButtonClassName,
                        'flex w-full items-center justify-between gap-2',
                      )}
                      onClick={() => void loadVariants(product)}
                    >
                      <span className="truncate text-left">{product.name}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        {t('sizeVariantCount', { count: product.variantCount })}
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
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t('sizeVariantsLoading')}
                          </p>
                        ) : variants.length ? (
                          variants.map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              className={cn(backstagePickerResultButtonClassName, 'text-sm')}
                              onClick={() => selectVariant(product, variant)}
                            >
                              <span className="block truncate">{variant.label}</span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {[
                                  variant.ean ? `EAN ${variant.ean}` : null,
                                  variant.sku ? `SKU ${variant.sku}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || t('sizeNoIdentifier')}
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground">
                            {t('sizeNoVariants')}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value ? (
        <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            {value.productName} · {value.sizeLabel}
          </p>
          <p className="mt-0.5">
            {[value.ean ? `EAN ${value.ean}` : null, value.sku ? `SKU ${value.sku}` : null]
              .filter(Boolean)
              .join(' · ') || t('sizeNoIdentifier')}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs"
            onClick={clearSelection}
          >
            {t('sizePickerClear')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
