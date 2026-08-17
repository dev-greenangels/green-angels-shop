'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { LOCALE_FLAGS, LOCALE_LABELS } from '@/lib/i18n/locales'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { Label } from '@/components/ui/label'

export function ContentLocaleBanner({ hint }: { hint?: string }) {
  const { locale } = useBackstageContentLocale()
  const t = useTranslations('contentBanner')

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
  const { locale } = useBackstageContentLocale()
  return (
    <Label htmlFor={htmlFor} className="flex flex-wrap items-center gap-2">
      <span>{children}</span>
      <span className="rounded border border-border px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {locale}
      </span>
    </Label>
  )
}
