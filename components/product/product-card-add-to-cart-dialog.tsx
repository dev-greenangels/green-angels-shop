'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { showAddedToCartToast } from '@/lib/cart-toast'

import { getCartLineQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { mapDetailToPlant } from '@/lib/catalog/map-product'
import type { CatalogProductDetail } from '@/lib/catalog/types'
import {
  getVisiblePlantVariants,
  isPlantFullyUnavailable,
} from '@/lib/plant-variants'
import type { Plant, ProductVariant } from '@/lib/types'
import { MinOrderPolicyBanner } from '@/components/cart/min-order-policy-banner'
import { ProductVariantsTable } from '@/components/product/product-variants-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ProductCardAddToCartDialogProps = {
  plant: Plant
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductCardAddToCartDialog({
  plant,
  open,
  onOpenChange,
}: ProductCardAddToCartDialogProps) {
  const t = useTranslations('product')
  const tc = useTranslations('cart')
  const cartItems = useCartItems()
  const { addItem, updateQuantity } = useCartActions()
  const [resolvedPlant, setResolvedPlant] = useState<Plant | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    if (!open) {
      setResolvedPlant(null)
      setLoadFailed(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadFailed(false)

    fetch(`/api/catalog/products/${encodeURIComponent(plant.slug)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('not-found')
        return response.json() as Promise<CatalogProductDetail>
      })
      .then((detail) => {
        if (cancelled) return
        setResolvedPlant(mapDetailToPlant(detail))
      })
      .catch(() => {
        if (cancelled) return
        setResolvedPlant(null)
        setLoadFailed(true)
        toast.error(t('variantsLoadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, plant])

  const displayPlant = resolvedPlant
  const variants = displayPlant ? getVisiblePlantVariants(displayPlant) : []
  const fullyUnavailable = isPlantFullyUnavailable(variants)

  const handleBuy = (variant: ProductVariant, targetQuantity: number, unitPrice: number) => {
    if (!displayPlant) return

    const inCart = getCartLineQuantity(cartItems, displayPlant.id, variant.id)
    let addedCount = 0

    if (targetQuantity < inCart) {
      updateQuantity(displayPlant.id, targetQuantity, variant.id)
    } else if (targetQuantity > inCart) {
      const result = addItem(displayPlant, targetQuantity - inCart, { variant, unitPrice })
      addedCount = result.added
    }

    if (addedCount > 0) {
      showAddedToCartToast(
        tc('addedToCart', { count: addedCount }),
        displayPlant.name,
        variant.label,
      )
    }
  }

  const titlePlant = displayPlant ?? plant

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-4 py-3.5 pr-12 text-left sm:px-5 sm:py-4">
          <DialogTitle className="font-serif text-lg leading-snug sm:text-xl">
            {titlePlant.name}
          </DialogTitle>
          {titlePlant.latinName ? (
            <p className="text-sm italic text-muted-foreground">{titlePlant.latinName}</p>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              <span className="sr-only">{t('loadingVariants')}</span>
            </div>
          ) : loadFailed || !displayPlant ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('variantsLoadError')}
            </p>
          ) : (
            <div className="space-y-3">
              <MinOrderPolicyBanner compact />
              <ProductVariantsTable
                embedded
                variants={variants}
                plantId={displayPlant.id}
                plantName={displayPlant.name}
                fullyOutOfStock={fullyUnavailable}
                onBuy={handleBuy}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
