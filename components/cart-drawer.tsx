'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/lib/cart-store'

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore()
  const totalPrice = getTotalPrice()

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif text-xl">Кошик</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-serif text-lg font-medium mb-2">Кошик порожній</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Додайте рослини до кошика, щоб оформити замовлення
            </p>
            <Button onClick={closeCart} asChild>
              <Link href="/catalog">Перейти до каталогу</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.plant.id} className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={item.plant.images[0] || '/images/placeholder-plant.jpg'}
                        alt={item.plant.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.plant.name}</h4>
                      <p className="text-xs text-muted-foreground italic truncate">
                        {item.plant.latinName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.plant.containerSize}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.plant.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.plant.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.plant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        {(item.plant.price * item.quantity).toLocaleString('uk-UA')} ₴
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.plant.price.toLocaleString('uk-UA')} ₴/шт
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-4">
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
              <Button variant="outline" className="w-full" onClick={closeCart}>
                Продовжити покупки
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
