'use client'

import { memo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'

import { checkoutItemKey } from '@/components/checkout/checkout-utils'
import { getInStockCartItems } from '@/lib/cart-availability'
import { useCartItems, useCartTotalPrice } from '@/lib/cart-store'

export const CheckoutGuestCartPreview = memo(function CheckoutGuestCartPreview() {
  const locale = useLocale()
  const t = useTranslations('cart')
  const tc = useTranslations('common')
  const items = useCartItems()
  const inStockItems = getInStockCartItems(items)
  const totalPrice = useCartTotalPrice()

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h3 className="mb-5 font-serif text-lg font-semibold text-foreground">{t('inCart')}</h3>
      <p className="text-base text-foreground">
        <span className="font-medium">{tc('itemCount', { count: inStockItems.length })}</span>
        <span className="text-muted-foreground">{t('inYourOrder')}</span>
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

        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-4 sm:px-5">
          <span className="text-sm font-medium text-muted-foreground">{t('grandTotal')}</span>
          <span className="text-xl font-bold tabular-nums text-primary sm:text-2xl">
            {totalPrice.toLocaleString(locale === 'en' ? 'en-GB' : 'uk-UA')} {tc('uah')}
          </span>
        </div>
      </div>
    </section>
  )
})
