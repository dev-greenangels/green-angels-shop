'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, Tag, X } from 'lucide-react'

import { checkoutPanelClassName } from '@/components/checkout/checkout-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AppliedPromoSummary } from '@/lib/pricing/quote'
import { cn } from '@/lib/utils'

const promoExpandButtonClassName =
  'h-8 w-8 shrink-0 bg-accent text-accent-foreground shadow-sm transition-all hover:bg-accent/75 hover:shadow-md active:scale-95 active:bg-accent/60 active:shadow-sm'

type CheckoutPromoCodeProps = {
  value: string
  onChange: (value: string) => void
  onApply: () => Promise<boolean | void>
  onRemove?: (code: string) => void
  loading?: boolean
  message?: string | null
  infoMessage?: string | null
  appliedPromos?: AppliedPromoSummary[]
  /** @deprecated використовуйте appliedPromos */
  appliedCodes?: string[]
  variant?: 'default' | 'compact'
  embedded?: boolean
}

function AppliedPromoBadges({
  promos,
  onRemove,
  isCompact,
}: {
  promos: AppliedPromoSummary[]
  onRemove?: (code: string) => void
  isCompact: boolean
}) {
  const t = useTranslations('promo')
  if (!promos.length) return null

  const infoMessages = promos
    .map((promo) => promo.infoMessage)
    .filter((msg): msg is string => Boolean(msg))

  if (isCompact) {
    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {promos.map((promo) => (
            <div
              key={promo.code}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-primary/15 bg-primary/5 py-0.5 pl-2 pr-1 text-xs text-primary"
            >
              <Tag className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span className="min-w-0 truncate">
                <span className="font-medium">{promo.code}</span>
                {promo.name ? <span className="text-primary/75"> · {promo.name}</span> : null}
              </span>
              {onRemove ? (
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={t('removeAria', { code: promo.code })}
                  onClick={() => onRemove(promo.code)}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {infoMessages.map((msg) => (
          <p key={msg} className="text-xs leading-snug text-muted-foreground">
            {msg}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {promos.map((promo) => (
        <div key={promo.code} className="space-y-1">
          <div className="flex items-center justify-between gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
            <div className="min-w-0 text-sm text-primary">
              <p>
                {t('applied')} <span className="font-semibold">{promo.code}</span>
              </p>
              {promo.name ? <p className="text-primary/80">{promo.name}</p> : null}
            </div>
            {onRemove ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 gap-1 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(promo.code)}
              >
                <X className="h-4 w-4" />
                {t('remove')}
              </Button>
            ) : null}
          </div>
          {promo.infoMessage ? (
            <p className="px-1 text-xs leading-snug text-muted-foreground">{promo.infoMessage}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function CheckoutPromoCode({
  value,
  onChange,
  onApply,
  onRemove,
  loading = false,
  message,
  infoMessage,
  appliedPromos,
  appliedCodes = [],
  variant = 'default',
  embedded = false,
}: CheckoutPromoCodeProps) {
  const t = useTranslations('promo')
  const [applying, setApplying] = useState(false)
  const [inputExpanded, setInputExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isCompact = variant === 'compact'

  const resolvedPromos: AppliedPromoSummary[] =
    appliedPromos ??
    appliedCodes.map((code) => ({
      code,
      name: '',
    }))

  useEffect(() => {
    if (!inputExpanded) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [inputExpanded])

  const handleApply = async () => {
    setApplying(true)
    try {
      const applied = await onApply()
      if (applied !== false) {
        setInputExpanded(false)
      }
    } finally {
      setApplying(false)
    }
  }

  const handleExpand = () => {
    setInputExpanded(true)
  }

  if (isCompact || embedded) {
    const haveCodeLabel = (
      <p className="text-sm font-semibold text-foreground">{t('haveCode')}</p>
    )

    return (
      <div className="space-y-2">
        {message ? (
          <p className={cn('leading-snug text-destructive', isCompact ? 'text-xs' : 'text-sm')}>
            {message}
          </p>
        ) : null}
        {infoMessage ? (
          <p className={cn('leading-snug text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>
            {infoMessage}
          </p>
        ) : null}

        {inputExpanded ? (
          <div className="space-y-2">
            {haveCodeLabel}
            <AppliedPromoBadges
              promos={resolvedPromos}
              onRemove={onRemove}
              isCompact={isCompact && !embedded}
            />
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                id={isCompact ? 'cart-promo-code' : 'checkout-promo-code'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={t('placeholder')}
                autoComplete="off"
                className={isCompact ? 'h-9 text-sm' : undefined}
              />
              <Button
                type="button"
                variant="outline"
                size={isCompact ? 'sm' : 'default'}
                className={cn('shrink-0', isCompact ? 'h-9 px-3' : 'px-4')}
                disabled={loading || applying || !value.trim()}
                onClick={() => void handleApply()}
              >
                {applying || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCompact ? (
                  t('apply')
                ) : (
                  <>
                    <Tag className="mr-2 h-4 w-4" />
                    {t('apply')}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              {haveCodeLabel}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={promoExpandButtonClassName}
                aria-label={t('addAria')}
                onClick={handleExpand}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {infoMessage ? (
              <p className={cn('leading-snug text-muted-foreground', isCompact ? 'text-xs' : 'text-sm')}>
                {infoMessage}
              </p>
            ) : null}
            <AppliedPromoBadges
              promos={resolvedPromos}
              onRemove={onRemove}
              isCompact={isCompact && !embedded}
            />
          </div>
        )}
      </div>
    )
  }

  const defaultContent = (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{t('haveCode')}</p>

      <AppliedPromoBadges promos={resolvedPromos} onRemove={onRemove} isCompact={false} />

      <div className="flex gap-2">
        <Input
          id="checkout-promo-code"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('placeholder')}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 px-4"
          disabled={loading || applying || !value.trim()}
          onClick={() => void handleApply()}
        >
          {applying || loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Tag className="mr-2 h-4 w-4" />
              {t('apply')}
            </>
          )}
        </Button>
      </div>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}
      {infoMessage ? <p className="text-sm text-muted-foreground">{infoMessage}</p> : null}
    </div>
  )

  return <div className={checkoutPanelClassName}>{defaultContent}</div>
}
