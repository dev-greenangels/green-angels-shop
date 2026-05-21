'use client'

import { useMemo, useState } from 'react'
import { Camera, Minus, Plus, ShoppingCart } from 'lucide-react'

import { openPhotoModal } from '@/components/product/open-photo-modal'
import { ProductOutOfStockBlock } from '@/components/product/product-out-of-stock-block'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  formatPrice,
  getLineTotal,
  getUnitPriceForQuantity,
} from '@/lib/product-pricing'
import {
  canOrderVariant,
  getVariantMaxQuantity,
  isVariantPreorder,
  tableShowsPriceTiers,
  variantHasAvailableFrom,
  variantHasPriceTiers,
  variantHasStock,
} from '@/lib/plant-variants'
import type { ProductVariant } from '@/lib/types'

type ProductVariantsTableProps = {
  variants: ProductVariant[]
  plantId: string
  plantName: string
  fullyOutOfStock: boolean
  onBuy: (variant: ProductVariant, quantity: number, unitPrice: number) => void
}

function AvailabilityBlock({ variant }: { variant: ProductVariant }) {
  const hasStock = variantHasStock(variant)
  const hasShipmentDate = variantHasAvailableFrom(variant)
  const preorder = isVariantPreorder(variant)

  if (!hasStock && !hasShipmentDate) {
    return <p className="font-medium text-muted-foreground">Немає в наявності</p>
  }

  return (
    <div className="space-y-1">
      {hasStock && <p className="font-medium text-foreground">{variant.stock} шт.</p>}
      {preorder && (
        <p className="text-sm font-medium text-primary">Доступно для бронювання</p>
      )}
      {hasShipmentDate && (
        <p className="text-sm text-muted-foreground">
          Відвантаження з {variant.availableFrom}
        </p>
      )}
    </div>
  )
}

function TierPrices({ variant }: { variant: ProductVariant }) {
  const tiers = useMemo(
    () => [...variant.priceTiers].sort((a, b) => a.minQuantity - b.minQuantity),
    [variant.priceTiers]
  )

  if (!variantHasPriceTiers(variant)) return null

  return (
    <ul className="space-y-1 text-sm">
      {tiers.map((tier) => (
        <li key={tier.minQuantity} className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-muted-foreground">від {tier.minQuantity} шт.</span>
          <span className="font-medium text-primary">{formatPrice(tier.pricePerUnit)}</span>
        </li>
      ))}
    </ul>
  )
}

function FreshPhotosButton({ variant, size = 'default' }: { variant: ProductVariant; size?: 'default' | 'lg' }) {
  return (
    <Button
      type="button"
      variant="outline"
      size={size === 'lg' ? 'lg' : 'default'}
      className={cn(
        'shrink-0 gap-1.5 whitespace-nowrap border-primary/30 text-primary hover:bg-primary/5',
        size === 'lg' ? 'h-10 px-4' : 'h-9 px-3'
      )}
      onClick={() => openPhotoModal(variant.id, variant.label)}
    >
      <Camera className="h-4 w-4" />
      <span className="hidden sm:inline">Свіжі фото</span>
      <span className="sm:hidden">Фото</span>
    </Button>
  )
}

function VariantActions({
  variant,
  onBuy,
  size = 'default',
}: {
  variant: ProductVariant
  onBuy: ProductVariantsTableProps['onBuy']
  size?: 'default' | 'lg'
}) {
  const canOrder = canOrderVariant(variant)
  const maxQty = getVariantMaxQuantity(variant)
  const preorder = isVariantPreorder(variant)
  const [quantity, setQuantity] = useState(1)

  const unitPrice = getUnitPriceForQuantity(variant, quantity)
  const controlHeight = size === 'lg' ? 'h-10' : 'h-9'
  const iconSize = size === 'lg' ? 'h-10 w-10' : 'h-9 w-9'

  const dec = () => setQuantity((q) => Math.max(1, q - 1))
  const inc = () => setQuantity((q) => Math.min(maxQty, q + 1))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FreshPhotosButton variant={variant} size={size} />

      {canOrder && (
        <>
          <div
            className={cn(
              'flex shrink-0 items-center rounded-lg border border-border bg-background',
              controlHeight
            )}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconSize}
              onClick={dec}
              disabled={quantity <= 1}
              aria-label="Зменшити кількість"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span
              className={cn(
                'min-w-[2.25rem] text-center font-semibold tabular-nums',
                size === 'lg' ? 'text-base' : 'text-sm'
              )}
            >
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={iconSize}
              onClick={inc}
              disabled={quantity >= maxQty}
              aria-label="Збільшити кількість"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {quantity > 1 && (
            <span className="hidden text-sm text-muted-foreground xl:inline">
              = {formatPrice(getLineTotal(variant, quantity))}
            </span>
          )}

          <Button
            type="button"
            size={size === 'lg' ? 'lg' : 'default'}
            className="shrink-0 gap-2"
            onClick={() => onBuy(variant, quantity, unitPrice)}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            {preorder ? 'Забронювати' : 'Купити'}
          </Button>
        </>
      )}
    </div>
  )
}

function VariantMobileCard({
  variant,
  onBuy,
  showTiersBlock,
}: {
  variant: ProductVariant
  onBuy: ProductVariantsTableProps['onBuy']
  showTiersBlock: boolean
}) {
  const tiers = <TierPrices variant={variant} />

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold leading-snug text-foreground">{variant.label}</h3>

      <div
        className={cn(
          'mb-3 gap-x-4 gap-y-3 text-sm',
          showTiersBlock && tiers ? 'grid grid-cols-2' : 'space-y-3'
        )}
      >
        <div>
          <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Наявність
          </p>
          <AvailabilityBlock variant={variant} />
        </div>
        <div>
          <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Базова ціна
          </p>
          <p className="text-lg font-bold text-foreground">{formatPrice(variant.basePrice)}</p>
        </div>
      </div>

      {tiers && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Оптові ціни
          </p>
          {tiers}
        </div>
      )}

      <VariantActions variant={variant} onBuy={onBuy} size="lg" />
    </article>
  )
}

function VariantDesktopRow({
  variant,
  onBuy,
  showTiers,
}: {
  variant: ProductVariant
  onBuy: ProductVariantsTableProps['onBuy']
  showTiers: boolean
}) {
  const tiers = <TierPrices variant={variant} />

  return (
    <tr className="border-b border-border/80 last:border-0 hover:bg-muted/30">
      <td className="px-4 py-4 align-top">
        <span className="font-semibold text-foreground">{variant.label}</span>
      </td>
      <td className="px-3 py-4 align-top">
        <AvailabilityBlock variant={variant} />
      </td>
      <td className="px-3 py-4 align-top">
        <p className="text-lg font-bold text-foreground">{formatPrice(variant.basePrice)}</p>
      </td>
      {showTiers && <td className="min-w-[10rem] px-3 py-4 align-top">{tiers}</td>}
      <td className="px-4 py-4 align-top">
        <VariantActions variant={variant} onBuy={onBuy} />
      </td>
    </tr>
  )
}

export function ProductVariantsTable({
  variants,
  plantId,
  plantName,
  fullyOutOfStock,
  onBuy,
}: ProductVariantsTableProps) {
  const showTiers = tableShowsPriceTiers(variants)

  return (
    <section className="space-y-4" aria-label="Розміри та ціни">
      <div>
        <h2 className="text-xl font-bold text-foreground md:text-2xl">Розміри та ціни</h2>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {fullyOutOfStock
            ? 'Перегляньте доступні розміри. Підпишіться, щоб дізнатись про появу товару.'
            : 'Оберіть маркування і додайте до кошика. За наявності дати — можливе бронювання з відвантаженням у вказаний термін.'}
        </p>
      </div>

      {fullyOutOfStock && (
        <ProductOutOfStockBlock plantId={plantId} plantName={plantName} />
      )}

      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Розмір</th>
              <th className="px-3 py-3 font-semibold">Наявність</th>
              <th className="px-3 py-3 font-semibold">Базова ціна</th>
              {showTiers && <th className="px-3 py-3 font-semibold">Опт (від к-сті)</th>}
              <th className="px-4 py-3 font-semibold">Замовлення</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <VariantDesktopRow
                key={variant.id}
                variant={variant}
                onBuy={onBuy}
                showTiers={showTiers}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {variants.map((variant) => (
          <VariantMobileCard
            key={variant.id}
            variant={variant}
            onBuy={onBuy}
            showTiersBlock={showTiers}
          />
        ))}
      </div>
    </section>
  )
}
