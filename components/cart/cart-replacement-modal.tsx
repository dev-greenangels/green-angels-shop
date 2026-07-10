'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { Loader2, RefreshCw } from 'lucide-react'

import { DiscountedUnitPrice } from '@/components/pricing/discounted-price'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchCatalogProductBySlug, fetchCatalogProducts } from '@/lib/catalog/products'
import { getVisiblePlantVariants } from '@/lib/plant-variants'
import { getUnitPriceForQuantity } from '@/lib/product-pricing'
import type { CartItem, Plant, ProductVariant } from '@/lib/types'
import { Link } from '@/i18n/navigation'
import { useCatalogHref } from '@/components/providers/catalog-paths-provider'

type ReplacementOption = {
  key: string
  group: 'size' | 'similar'
  plant: Plant
  variant: ProductVariant
  unitPrice: number
}

type CartReplacementModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CartItem
  onReplace: (plant: Plant, variant: ProductVariant, unitPrice: number) => void
}

const PLACEHOLDER_IMAGE = '/images/category-placeholder.svg'

function ReplacementOptionCard({
  option,
  onSelect,
}: {
  option: ReplacementOption
  onSelect: () => void
}) {
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  return (
    <div className="flex gap-3 rounded-lg border border-border p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={option.plant.images[0] || PLACEHOLDER_IMAGE}
          alt={option.plant.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{option.plant.name}</p>
        <p className="text-xs text-primary">{option.variant.label}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          <DiscountedUnitPrice
            originalPrice={option.variant.basePrice}
            salePrice={option.unitPrice}
            perUnit="sale-only"
          />
        </p>
        <p className="text-xs text-muted-foreground">{t('availableStock', { count: option.variant.stock })}</p>
      </div>
      <Button type="button" size="sm" className="shrink-0 self-center" onClick={onSelect}>
        {tc('select')}
      </Button>
    </div>
  )
}

export function CartReplacementModal({
  open,
  onOpenChange,
  item,
  onReplace,
}: CartReplacementModalProps) {
  const catalogHref = useCatalogHref()
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const te = useTranslations('errors')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sizeOptions, setSizeOptions] = useState<ReplacementOption[]>([])
  const [similarOptions, setSimilarOptions] = useState<ReplacementOption[]>([])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      setSizeOptions([])
      setSimilarOptions([])

      try {
        const [detailResult, similarResult] = await Promise.all([
          fetchCatalogProductBySlug(item.plant.slug),
          fetchCatalogProducts({
            categoryId: item.plant.categoryId,
            excludeId: item.plant.id,
            stock: 'in_stock',
            limit: 8,
          }),
        ])

        if (cancelled) return

        if (detailResult.unavailable || similarResult.unavailable) {
          setError(t('replacementCatalogUnavailable'))
          return
        }

        const detail = detailResult.data
        const similarPlants = similarResult.data
        if (!detail) {
          setError(te('productNotFound'))
          return
        }

        const sizes = getVisiblePlantVariants(detail)
          .filter((variant) => variant.id !== item.variantId)
          .map((variant) => ({
            key: `size-${variant.id}`,
            group: 'size' as const,
            plant: detail,
            variant,
            unitPrice: getUnitPriceForQuantity(variant, 1),
          }))

        const similar: ReplacementOption[] = []
        for (const plant of similarPlants) {
          const variant = getVisiblePlantVariants(plant)[0]
          if (!variant) continue
          similar.push({
            key: `similar-${plant.id}-${variant.id}`,
            group: 'similar',
            plant,
            variant,
            unitPrice: getUnitPriceForQuantity(variant, 1),
          })
        }

        setSizeOptions(sizes)
        setSimilarOptions(similar)
      } catch {
        if (!cancelled) {
          setError(t('replacementLoadFailed'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, item.plant.id, item.plant.slug, item.plant.categoryId, item.variantId])

  const hasOptions = sizeOptions.length > 0 || similarOptions.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {t('replacementTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('replacementDescription')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {tc('loading')}
          </div>
        ) : error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : !hasOptions ? (
          <div className="space-y-4 py-2 text-sm text-muted-foreground">
            <p>{t('replacementEmpty')}</p>
            <Button type="button" variant="outline" asChild className="w-full">
              <Link href={catalogHref} onClick={() => onOpenChange(false)}>
                {tc('goToCatalog')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {sizeOptions.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t('otherSize')}</h3>
                <div className="space-y-2">
                  {sizeOptions.map((option) => (
                    <ReplacementOptionCard
                      key={option.key}
                      option={option}
                      onSelect={() => {
                        onReplace(option.plant, option.variant, option.unitPrice)
                        onOpenChange(false)
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {similarOptions.length > 0 ? (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">{t('similarProducts')}</h3>
                <div className="space-y-2">
                  {similarOptions.map((option) => (
                    <ReplacementOptionCard
                      key={option.key}
                      option={option}
                      onSelect={() => {
                        onReplace(option.plant, option.variant, option.unitPrice)
                        onOpenChange(false)
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
