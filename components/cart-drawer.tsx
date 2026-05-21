'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'
import { useCartStore } from '@/lib/cart-store'

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen)
  const items = useCartStore((s) => s.items)
  const setCartOpen = useCartStore((s) => s.setCartOpen)
  const closeCart = useCartStore((s) => s.closeCart)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const [cartHydrated, setCartHydrated] = useState(false)
  useEffect(() => {
    setCartHydrated(true)
  }, [])

  const displayItems = cartHydrated ? items : []
  const totalPrice = useMemo(
    () =>
      displayItems.reduce(
        (sum, item) => sum + (item.unitPrice ?? item.plant.price) * item.quantity,
        0
      ),
    [displayItems]
  )

  const handleOpenChange = (open: boolean) => {
    setCartOpen(open)
    if (!open) window.setTimeout(clearBodyScrollLock, 300)
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col border-border/40 sm:max-w-lg p-2">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl">Кошик</SheetTitle>
          <SheetDescription className="sr-only">
            Перегляд товарів у кошику та оформлення замовлення
          </SheetDescription>
        </SheetHeader>

        {displayItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 font-serif text-lg font-medium">Кошик порожній</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Додайте рослини до кошика, щоб оформити замовлення
            </p>
            <Button type="button" onClick={closeCart} asChild>
              <Link href="/catalog">Перейти до каталогу</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {displayItems.map((item) => {
                  const lineKey = item.variantId
                    ? `${item.plant.id}-${item.variantId}`
                    : item.plant.id
                  const unitPrice = item.unitPrice ?? item.plant.price
                  return (
                    <div key={lineKey} className="flex gap-4 border-b border-[#d6d5d5] pb-[15px]">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={item.plant.images[0] || '/images/placeholder-plant.jpg'}
                          alt={item.plant.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium">{item.plant.name}</h4>
                        <p className="truncate text-xs italic text-muted-foreground">
                          {item.plant.latinName}
                        </p>
                        {item.variantLabel && (
                          <p className="text-sm font-medium text-primary">{item.variantLabel}</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateQuantity(item.plant.id, item.quantity - 1, item.variantId)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateQuantity(item.plant.id, item.quantity + 1, item.variantId)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between items-end">
                        <div>
                        <p className="text-sm font-semibold">
                          {(unitPrice * item.quantity).toLocaleString('uk-UA')} ₴
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {unitPrice.toLocaleString('uk-UA')} ₴/шт
                        </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.plant.id, item.variantId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Разом:</span>
                <span>{totalPrice.toLocaleString('uk-UA')} ₴</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Доставка розраховується при оформленні замовлення
              </p>
              <Button className="w-full" size="lg" asChild>
                <Link href="/checkout" onClick={closeCart}>
                  Оформити замовлення
                </Link>
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={closeCart}>
                Продовжити покупки
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
