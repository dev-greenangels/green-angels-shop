'use client'

import { useTranslations } from 'next-intl'

import { cn } from '@/lib/utils'

export type SkCheckoutAuthMode = 'guest' | 'login'

export function CheckoutSkAuthModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: SkCheckoutAuthMode
  onChange: (mode: SkCheckoutAuthMode) => void
  disabled?: boolean
}) {
  const t = useTranslations('checkout')

  return (
    <div
      className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-muted/60 p-1"
      role="tablist"
      aria-label={t('skAuthModeLabel')}
    >
      {(
        [
          { id: 'guest' as const, label: t('skAuthModeGuest') },
          { id: 'login' as const, label: t('skAuthModeLogin') },
        ] as const
      ).map((option) => (
        <button
          key={option.id}
          type="button"
          role="tab"
          aria-selected={mode === option.id}
          disabled={disabled}
          className={cn(
            'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            mode === option.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-60',
          )}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
