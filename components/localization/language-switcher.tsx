'use client'

import { useLocale } from 'next-intl'

import { useLocalizationSettings } from '@/components/providers/localization-settings-provider'
import { Link, usePathname } from '@/i18n/navigation'
import { LOCALE_FLAGS, LOCALE_LABELS, type AppLocale } from '@/lib/i18n/locales'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = {
  className?: string
  variant?: 'footer' | 'inline'
}

export function LanguageSwitcher({ className, variant = 'footer' }: LanguageSwitcherProps) {
  const pathname = usePathname()
  const currentLocale = useLocale() as AppLocale
  const { availableLocales } = useLocalizationSettings()

  if (availableLocales.length < 2) return null

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        variant === 'footer' && 'justify-center md:justify-start',
        className,
      )}
      role="navigation"
      aria-label={LOCALE_LABELS[currentLocale]}
    >
      {availableLocales.map((locale) => {
        const active = locale === currentLocale
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              variant === 'footer'
                ? active
                  ? 'border-primary-foreground bg-primary-foreground/15 text-primary-foreground'
                  : 'border-primary-foreground/25 text-primary-foreground/85 hover:border-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                : active
                  ? 'border-border bg-muted text-foreground'
                  : 'border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            aria-current={active ? 'true' : undefined}
            title={LOCALE_LABELS[locale]}
          >
            <span className="text-base leading-none" aria-hidden>
              {LOCALE_FLAGS[locale]}
            </span>
            <span>{LOCALE_LABELS[locale]}</span>
          </Link>
        )
      })}
    </div>
  )
}
