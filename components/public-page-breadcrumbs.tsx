import { getLocale, getTranslations } from 'next-intl/server'

import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'
import { SiteBreadcrumbs } from '@/components/site-breadcrumbs'
import type { AppLocale } from '@/i18n/routing'
import type { SiteBreadcrumbItem } from '@/lib/catalog/breadcrumbs'

type PublicPageBreadcrumbsProps = {
  items: SiteBreadcrumbItem[]
  className?: string
  loading?: boolean
}

export async function PublicPageBreadcrumbs({
  items,
  className,
  loading = false,
}: PublicPageBreadcrumbsProps) {
  const [locale, tNav] = await Promise.all([getLocale(), getTranslations('nav')])
  const homeLabel = tNav('home')

  return (
    <>
      <BreadcrumbJsonLd locale={locale as AppLocale} homeLabel={homeLabel} items={items} />
      <SiteBreadcrumbs
        items={items}
        homeLabel={homeLabel}
        className={className}
        loading={loading}
      />
    </>
  )
}
