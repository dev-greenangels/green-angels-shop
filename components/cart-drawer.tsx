'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { clearBodyScrollLock } from '@/lib/clear-body-scroll-lock'
import { findVariantOnPlant, getCartItemMaxQuantity, getMaxAddableQuantity } from '@/lib/cart-limits'
import type { CartItem, ProductVariant } from '@/lib/types'
import { useCartActions, useCartIsOpen, useCartItems } from '@/lib/cart-store'

function CartLineRow({
  item,
  items,
  updateQuantity,
  removeItem,
  onNavigate,
}: {
  item: CartItem
  items: CartItem[]
  updateQuantity: (plantId: string, quantity: number, variantId: string) => void
  removeItem: (plantId: string, variantId: string) => void
  onNavigate: () => void
}) {
  const productHref = `/product/${item.plant.slug}`
  const variantId = item.variantId
  if (!variantId) return null

  const variant = findVariantOnPlant(item.plant, variantId)
  if (!variant) return null

  const maxQty = Math.max(1, getCartItemMaxQuantity(item))
  const inCart = item.quantity
  const maxAddable = variant ? getMaxAddableQuantity(variant, items, item.plant.id) : 0

  const atCartMax = inCart >= maxQty
  const hasPartialInCart = inCart > 0 && !atCartMax

  const [quantityInput, setQuantityInput] = useState(String(item.quantity))
  const [limitHint, setLimitHint] = useState(false)

  useEffect(() => {
    setQuantityInput(String(item.quantity))
    setLimitHint(false)
  }, [item.quantity, item.plant.id, item.variantId])

  const clampTotal = (value: number) => Math.min(maxQty, Math.max(1, value))

  const commitQuantityInput = () => {
    const parsed = parseInt(quantityInput.replace(/\D/g, ''), 10)

    if (!quantityInput.trim() || Number.isNaN(parsed)) {
      const next = 1
      setLimitHint(false)
      setQuantityInput(String(next))
      updateQuantity(item.plant.id, next, variantId)
      return
    }

    const next = clampTotal(parsed)
    setLimitHint(parsed > maxQty)
    setQuantityInput(String(next))
    updateQuantity(item.plant.id, next, variantId)
  }

  const dec = () => {
    const next = Math.max(1, inCart - 1)
    setLimitHint(false)
    setQuantityInput(String(next))
    updateQuantity(item.plant.id, next, variantId)
  }

  const inc = () => {
    if (atCartMax) return
    const nextRaw = inCart + 1
    const next = clampTotal(nextRaw)
    setLimitHint(nextRaw > maxQty)
    setQuantityInput(String(next))
    updateQuantity(item.plant.id, next, variantId)
  }

  const cartHints = (
    <>
      {limitHint && (
        <p className="text-xs text-destructive" role="alert">
          В наявності тільки {maxQty} шт.
        </p>
      )}
      {!limitHint && atCartMax && (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary">
          <span>Вже додано макс. {maxQty} шт. в</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label="Кошик" />
        </p>
      )}
      {!limitHint && hasPartialInCart && (
        <p className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-medium text-primary">
          <span>У кошику {inCart} шт.</span>
          <ShoppingCart className="h-3.5 w-3.5 shrink-0" aria-label="Кошик" />
          {maxAddable > 0 && (
            <span className="text-muted-foreground">· ще можна {maxAddable}</span>
          )}
        </p>
      )}
    </>
  )

  const unitPrice = item.unitPrice ?? item.plant.price

  return (
    <div className="flex gap-4 border-b border-[#d6d5d5] pb-[15px]">
      <Link
        href={productHref}
        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
        aria-label={`Перейти до товару: ${item.plant.name}`}
        onClick={onNavigate}
      >
        <Image
          src={item.plant.images[0] || '/images/placeholder-plant.jpg'}
          alt={item.plant.name}
          fill
          className="object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={productHref} className="block" onClick={onNavigate}>
          <h4 className="truncate text-sm font-medium">{item.plant.name}</h4>
          <p className="truncate text-xs italic text-muted-foreground">{item.plant.latinName}</p>
        </Link>

        {item.variantLabel && (
          <p className="mt-1 text-sm font-medium text-primary">{item.variantLabel}</p>
        )}

        <div className="mt-0">
          {/* Візуал як раніше: - [кількість] +, але з функціоналом інпуту і підказками */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={dec}
              disabled={inCart <= 1}
              aria-label="Зменшити кількість"
            >
              <Minus className="h-3 w-3" />
            </Button>

            <Input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Кількість"
              value={quantityInput}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '')
                setQuantityInput(digits)
                if (digits === '') {
                  setLimitHint(false)
                  return
                }
                const parsed = parseInt(digits, 10)
                if (!Number.isNaN(parsed)) setLimitHint(parsed > maxQty)
              }}
              onBlur={commitQuantityInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitQuantityInput()
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className={cn(
                'w-8 border-0 bg-transparent px-0 text-center text-sm font-medium tabular-nums shadow-none',
                'text-primary focus-visible:ring-0 focus-visible:ring-offset-0'
              )}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={inc}
              disabled={atCartMax}
              aria-label="Збільшити кількість"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Фіксуємо висоту, щоб не "пригало" при появі підказок */}
          <div className="mt-0 min-h-[36px]">{cartHints}</div>
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
          onClick={() => removeItem(item.plant.id, variantId)}
          aria-label="Видалити"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const isOpen = useCartIsOpen()
  const items = useCartItems()
  const { setCartOpen, closeCart, updateQuantity, removeItem } = useCartActions()

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
      <SheetContent
        className={cn(
          'flex gap-0 w-full flex-col border-border/40 p-0 sm:max-w-lg',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70'
        )}
      >
        <SheetHeader className='pt-2 pb-2.5 shadow-sm'>
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
            <div className="flex-1 overflow-y-auto py-4 px-2">
              <div className="space-y-4">
                {displayItems.map((item) => {
                  const lineKey = item.variantId
                    ? `${item.plant.id}-${item.variantId}`
                    : item.plant.id
                  return (
                    <CartLineRow
                      key={lineKey}
                      item={item}
                      items={displayItems}
                      updateQuantity={updateQuantity}
                      removeItem={removeItem}
                      onNavigate={closeCart}
                    />
                  )
                })}
              </div>
            </div>

            <div className="space-y-4 px-2 pt-2 pb-4 border-t border-border shadow-sm flex flex-col">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Разом:</span>
                <span>{totalPrice.toLocaleString('uk-UA')} ₴</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Доставка розраховується при оформленні замовлення
              </p>
             
              <Button className="w-[80%] flex justify-center justify-self-center self-center" size="lg" asChild>
                <Link href="/checkout" onClick={closeCart}>
                  Оформити замовлення
                </Link>
              </Button>
              <Button type="button" variant="outline" className="w-[80%] flex justify-center justify-self-center self-center" onClick={closeCart}>
                Продовжити покупки
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
