'use client'

import { memo } from 'react'
import Image from 'next/image'
import { PenSquare } from 'lucide-react'

import { checkoutItemKey, checkoutPanelClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  useCartActions,
  useCartItems,
  useCartPersonalDiscountPercent,
  useCartSubtotal,
  useCartTotalPrice,
} from '@/lib/cart-store'

export const CheckoutOrderSummary = memo(function CheckoutOrderSummary() {
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const totalPrice = useCartTotalPrice()
  const discountPercent = useCartPersonalDiscountPercent()
  const { openCart } = useCartActions()

  const discountAmount = subtotal - totalPrice

  return (
    <div className={cn(checkoutPanelClassName, 'sticky top-24')}>
      <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Ваше замовлення</h3>

      <div className="mb-6 max-h-64 space-y-4 overflow-y-auto">
        {items.map((item) => {
          const unitPrice = item.unitPrice ?? item.plant.price
          const lineTotal = unitPrice * item.quantity
          const discountedLine =
            discountPercent > 0
              ? Math.round(lineTotal * (1 - discountPercent / 100))
              : lineTotal
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
                  {discountPercent > 0 && (
                    <span className="text-primary"> → {discountedLine.toLocaleString()} грн</span>
                  )}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
                {discountedLine.toLocaleString()} грн
              </p>
            </div>
          )
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        className="mb-4 w-full justify-center gap-2"
        onClick={() => {
          openCart()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        <PenSquare className="h-4 w-4" />
        Змінити замовлення
      </Button>
      <Separator className="my-4" />

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Товари ({items.length})</span>
        <span className="text-foreground">{subtotal.toLocaleString()} грн</span>
      </div>

      {discountPercent > 0 && (
        <div className="mt-2 flex justify-between text-sm text-primary">
          <span>Персональна знижка ({discountPercent}%)</span>
          <span>−{discountAmount.toLocaleString()} грн</span>
        </div>
      )}

      <Separator className="my-4" />

      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Всього</span>
        <span className="text-xl font-bold text-primary">{totalPrice.toLocaleString()} грн</span>
      </div>
    </div>
  )
})
