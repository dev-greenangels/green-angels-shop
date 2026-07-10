'use client'

import { useTranslations } from 'next-intl'

import { BrandLogo } from '@/components/brand-logo'

export function BackstageLoginHeader() {
  const t = useTranslations('pages.login')

  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <BrandLogo alt={t('brandAlt')} imgClassName="max-h-10" />
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>
    </div>
  )
}
