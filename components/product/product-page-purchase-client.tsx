'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { MinOrderPolicyBanner } from '@/components/cart/min-order-policy-banner'
import { ProductVariantsTable } from '@/components/product/product-variants-table'
import { resolveInitialVariantId } from '@/lib/catalog/variant-query'
import { showAddedToCartToast } from '@/lib/cart-toast'
import { getCartLineQuantity } from '@/lib/cart-limits'
import { useCartActions, useCartItems } from '@/lib/cart-store'
import { getVisiblePlantVariants, isPlantFullyUnavailable } from '@/lib/plant-variants'
import type { Plant, ProductVariant } from '@/lib/types'

type ProductPagePurchaseClientProps = {
  plant: Plant
  /** From `?variant=<SKU>` — preselects existing row when SKU matches a visible variant. */
  initialVariantSku?: string | null
}

export function ProductPagePurchaseClient({
  plant,
  initialVariantSku = null,
}: ProductPagePurchaseClientProps) {
  const tc = useTranslations('cart')
  const cartItems = useCartItems()
  const { addItem, updateQuantity } = useCartActions()

  const variants = getVisiblePlantVariants(plant)
  const fullyUnavailable = isPlantFullyUnavailable(variants)
  const [activeVariantId, setActiveVariantId] = useState<string | null>(() =>
    resolveInitialVariantId({ variants, preferredSku: initialVariantSku }),
  )

  useEffect(() => {
    const next = getVisiblePlantVariants(plant)
    setActiveVariantId((prev) => {
      if (prev && next.some((variant) => variant.id === prev)) return prev
      return resolveInitialVariantId({ variants: next, preferredSku: initialVariantSku })
    })
  }, [plant.id, plant.variants, initialVariantSku])

  const handleBuy = (variant: ProductVariant, targetQuantity: number, unitPrice: number) => {
    const inCart = getCartLineQuantity(cartItems, plant.id, variant.id)
    let addedCount = 0

    if (targetQuantity < inCart) {
      updateQuantity(plant.id, targetQuantity, variant.id)
    } else if (targetQuantity > inCart) {
      const result = addItem(plant, targetQuantity - inCart, { variant, unitPrice })
      addedCount = result.added
    }

    if (addedCount > 0) {
      showAddedToCartToast(tc('addedToCart', { count: addedCount }), plant.name, variant.label)
    }
  }

  return (
    <div className="mb-16 space-y-6">
      <MinOrderPolicyBanner />
      <ProductVariantsTable
        variants={variants}
        plantId={plant.id}
        plantName={plant.name}
        fullyOutOfStock={fullyUnavailable}
        selectedVariantId={activeVariantId}
        onSelectVariant={setActiveVariantId}
        onBuy={handleBuy}
      />
    </div>
  )
}
