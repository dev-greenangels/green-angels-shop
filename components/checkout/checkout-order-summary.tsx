'use client'

import { memo } from 'react'
import Image from 'next/image'

import { checkoutItemKey } from '@/components/checkout/checkout-utils'
import { Separator } from '@/components/ui/separator'
import { useCartItems, useCartTotalPrice } from '@/lib/cart-store'

export const CheckoutOrderSummary = memo(function CheckoutOrderSummary() {
  const items = useCartItems()
  const totalPrice = useCartTotalPrice()

  return (
    <div className="sticky top-24 rounded-xl border bg-background p-4 sm:p-6">
      <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Ваше замовлення</h3>

      <div className="mb-6 max-h-64 space-y-4 overflow-y-auto">
        {items.map((item) => {
          const unitPrice = item.unitPrice ?? item.plant.price
          return (
            <div key={checkoutItemKey(item)} className="flex gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={item.plant.images[0]}
                  alt={item.plant.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.plant.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} x {unitPrice.toLocaleString()} грн
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
                {(unitPrice * item.quantity).toLocaleString()} грн
              </p>
            </div>
          )
        })}
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Товари ({items.length})</span>
        <span className="font-semibold text-foreground">{totalPrice.toLocaleString()} грн</span>
      </div>

      <Separator className="my-4" />

      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Всього</span>
        <span className="text-xl font-bold text-primary">{totalPrice.toLocaleString()} грн</span>
      </div>
    </div>
  )
})
