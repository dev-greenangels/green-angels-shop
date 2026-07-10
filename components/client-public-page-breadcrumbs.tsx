'use client'

import { useLocale, useTranslations } from 'next-intl'

import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'
import { SiteBreadcrumbs } from '@/components/site-breadcrumbs'
import type { AppLocale } from '@/i18n/routing'
import type { SiteBreadcrumbItem } from '@/lib/catalog/breadcrumbs'

type ClientPublicPageBreadcrumbsProps = {
  items: SiteBreadcrumbItem[]
  className?: string
  loading?: boolean
}

export function ClientPublicPageBreadcrumbs({
  items,
  className,
  loading = false,
}: ClientPublicPageBreadcrumbsProps) {
  const locale = useLocale() as AppLocale
  const tNav = useTranslations('nav')
  const homeLabel = tNav('home')

  return (
    <>
      <BreadcrumbJsonLd locale={locale} homeLabel={homeLabel} items={items} />
      <SiteBreadcrumbs
        items={items}
        homeLabel={homeLabel}
        className={className}
        loading={loading}
      />
    </>
  )
}
