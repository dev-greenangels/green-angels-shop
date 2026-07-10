'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { PricingGiftLine } from '@/lib/pricing/quote'

type CartPromoGiftLinesProps = {
  gifts?: PricingGiftLine[] | null
  className?: string
  onNavigate?: () => void
}

export function CartPromoGiftLines({ gifts, className, onNavigate }: CartPromoGiftLinesProps) {
  const t = useTranslations('cart')

  if (!gifts?.length) return null

  return (
    <div className={className}>
      <div className="space-y-2">
        {gifts.map((gift) => (
          <div
            key={gift.productVariantId}
            className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm"
          >
            <Link
              href={`/product/${gift.productSlug}`}
              className="font-medium text-primary hover:underline"
              onClick={onNavigate}
            >
              {gift.label}
            </Link>
            <p className="mt-0.5 text-xs text-primary/90">
              {t('giftLine', { count: gift.quantity })}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
