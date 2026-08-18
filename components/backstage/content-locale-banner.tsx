'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { LOCALE_FLAGS, LOCALE_LABELS, isSupportedLocale } from '@/lib/i18n/locales'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { Label } from '@/components/ui/label'

export function ContentLocaleBanner({ hint }: { hint?: string }) {
  const { locale, ready } = useBackstageContentLocale()
  const t = useTranslations('contentBanner')

  if (!ready) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
      <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
      <span>{hint ?? t('editing', { locale: LOCALE_LABELS[locale] })}</span>
    </div>
  )
}

export function ContentLocaleLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string
  children: ReactNode
}) {
  const { locale, ready } = useBackstageContentLocale()
  return (
    <Label htmlFor={htmlFor} className="flex flex-wrap items-center gap-2">
      <span>{children}</span>
      {ready ? (
        <span className="rounded border border-border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {locale}
        </span>
      ) : null}
    </Label>
  )
}

export function TranslationHint({
  hint,
}: {
  hint?: { locale: string; text: string } | null
}) {
  const t = useTranslations('contentBanner')
  const { locale: currentLocale } = useBackstageContentLocale()
  const text = hint?.text.trim()
  const hintLocale = hint?.locale
  if (!text || !hintLocale || hintLocale === currentLocale) return null

  const localeLabel = isSupportedLocale(hintLocale)
    ? LOCALE_LABELS[hintLocale]
    : hintLocale.toUpperCase()
  const flag = isSupportedLocale(hintLocale) ? LOCALE_FLAGS[hintLocale] : ''

  return (
    <p className="text-xs text-muted-foreground">
      <span className="mr-1 font-medium text-foreground/80">
        {flag} {t('hintFrom', { locale: localeLabel })}
      </span>
      <span className="line-clamp-3 whitespace-pre-wrap break-words">{text}</span>
    </p>
  )
}
