'use client'

import { memo } from 'react'
import Image from 'next/image'

import { checkoutItemKey } from '@/components/checkout/checkout-utils'
import { useCartItems, useCartTotalPrice } from '@/lib/cart-store'

function itemsCountLabel(count: number) {
  if (count === 1) return '1 товар'
  if (count >= 2 && count <= 4) return `${count} товари`
  return `${count} товарів`
}

export const CheckoutGuestCartPreview = memo(function CheckoutGuestCartPreview() {
  const items = useCartItems()
  const totalPrice = useCartTotalPrice()

  return (
    <section className="mt-10 rounded-xl border border-border/80 bg-card/95 p-5 shadow-sm sm:p-6">
      <h3 className="mb-5 font-serif text-lg font-semibold text-foreground">У кошику</h3>
      <p className="text-base text-foreground">
        <span className="font-medium">{itemsCountLabel(items.length)}</span>
        <span className="text-muted-foreground"> у вашому замовленні</span>
      </p>

      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center pl-1">
            {items.slice(0, 4).map((item, index) => (
              <div
                key={checkoutItemKey(item)}
                className="relative -ml-3 first:ml-0 h-14 w-14 overflow-hidden rounded-lg border-2 border-background bg-muted shadow-sm"
                style={{ zIndex: 4 - index }}
              >
                <Image
                  src={item.plant.images[0] || '/images/placeholder-plant.jpg'}
                  alt={item.plant.name}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {items.length > 4 && (
              <div
                className="relative -ml-3 flex h-14 w-14 items-center justify-center rounded-lg border-2 border-background bg-muted text-sm font-semibold text-muted-foreground shadow-sm"
                style={{ zIndex: 0 }}
              >
                +{items.length - 4}
              </div>
            )}
          </div>


        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted/40 px-4 py-4 sm:px-5">
          <span className="text-sm font-medium text-muted-foreground">Загальна сума</span>
          <span className="text-xl font-bold tabular-nums text-primary sm:text-2xl">
            {totalPrice.toLocaleString('uk-UA')} грн
          </span>
        </div>
      </div>
    </section>
  )
})
