'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormattedPrice } from '@/components/commerce/formatted-price'
import type { CartMergePreview, CartMergeStrategy, ServerCartLine } from '@/lib/carts/types'
import { fetchPricingQuote } from '@/lib/pricing/quote'

function toQuoteItems(items: ServerCartLine[]) {
  return items.map((item) => ({
    productVariantId: item.productVariantId,
    quantity: item.quantity,
  }))
}

function CartPreviewList({
  title,
  items,
  total,
  loadingTotal,
}: {
  title: string
  items: ServerCartLine[]
  total: number | null
  loadingTotal: boolean
}) {
  const tc = useTranslations('common')

  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {loadingTotal ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : total != null ? (
          <FormattedPrice
            amount={total}
            className="shrink-0 text-sm font-semibold text-foreground"
            mode="shelf"
          />
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc('empty')}</p>
      ) : (
        <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item.productVariantId} className="flex items-start justify-between gap-2">
              <span className="min-w-0 text-foreground">
                <span className="line-clamp-2">
                  {item.productName}
                  {item.variantLabel ? ` · ${item.variantLabel}` : ''}
                </span>
              </span>
              <span className="shrink-0 pt-0.5">{item.quantity} {tc('pieceShort')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CartMergeDialog({
  open,
  preview,
  loading,
  onChoose,
}: {
  open: boolean
  preview: CartMergePreview | null
  loading: boolean
  onChoose: (strategy: CartMergeStrategy) => void | Promise<void>
}) {
  const t = useTranslations('cart')
  const [guestTotal, setGuestTotal] = useState<number | null>(null)
  const [userTotal, setUserTotal] = useState<number | null>(null)
  const [totalsLoading, setTotalsLoading] = useState(false)

  useEffect(() => {
    if (!open || !preview) {
      setGuestTotal(null)
      setUserTotal(null)
      setTotalsLoading(false)
      return
    }

    let cancelled = false
    setTotalsLoading(true)
    setGuestTotal(null)
    setUserTotal(null)

    void (async () => {
      try {
        const [guestQuote, userQuote] = await Promise.all([
          preview.guestItems.length
            ? fetchPricingQuote({ items: toQuoteItems(preview.guestItems) })
            : Promise.resolve(null),
          preview.userItems.length
            ? fetchPricingQuote({ items: toQuoteItems(preview.userItems) })
            : Promise.resolve(null),
        ])

        if (cancelled) return
        setGuestTotal(guestQuote?.totalAmount ?? (preview.guestItems.length ? 0 : null))
        setUserTotal(userQuote?.totalAmount ?? (preview.userItems.length ? 0 : null))
      } catch {
        if (!cancelled) {
          setGuestTotal(null)
          setUserTotal(null)
        }
      } finally {
        if (!cancelled) setTotalsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, preview])

  if (!preview) return null

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(92dvh,100%)] max-w-lg flex-col gap-0 overflow-hidden p-0"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 px-4 pt-5 pb-3 text-left sm:px-6">
          <DialogTitle className="font-serif text-xl">{t('mergeTitle')}</DialogTitle>
          <DialogDescription className="text-pretty">
            {t('mergeDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <CartPreviewList
              title={t('guestCart')}
              items={preview.guestItems}
              total={guestTotal}
              loadingTotal={totalsLoading && preview.guestItems.length > 0}
            />
            <CartPreviewList
              title={t('accountCart')}
              items={preview.userItems}
              total={userTotal}
              loadingTotal={totalsLoading && preview.userItems.length > 0}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/60 px-4 py-3 sm:px-6">
          <div className="grid w-full gap-2">
            <Button
              type="button"
              className="h-11 w-full"
              disabled={loading}
              onClick={() => void onChoose('merge')}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('merge')}
            </Button>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full px-3"
                disabled={loading}
                onClick={() => void onChoose('keep_guest')}
              >
                {t('guestCart')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full px-3"
                disabled={loading}
                onClick={() => void onChoose('keep_user')}
              >
                {t('accountCart')}
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-full"
              disabled={loading}
              onClick={() => void onChoose('clear')}
            >
              {t('clearAll')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
