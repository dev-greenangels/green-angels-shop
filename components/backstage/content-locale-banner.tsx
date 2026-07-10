'use client'

import { useTranslations } from 'next-intl'

import { LOCALE_FLAGS, LOCALE_LABELS } from '@/lib/i18n/locales'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'

export function ContentLocaleBanner() {
  const { locale } = useBackstageContentLocale()
  const t = useTranslations('contentBanner')

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">
      <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
      <span>{t('editing', { locale: LOCALE_LABELS[locale] })}</span>
    </div>
  )
}
