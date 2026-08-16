import { getLocale, getTranslations } from 'next-intl/server'

import { BreadcrumbJsonLd } from '@/components/seo/breadcrumb-json-ld'
import { SiteBreadcrumbs } from '@/components/site-breadcrumbs'
import type { AppLocale } from '@/i18n/routing'
import type { SiteBreadcrumbItem } from '@/lib/catalog/breadcrumbs'
import { resolvePublicOriginFromRequest } from '@/lib/seo/request-context'

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
  const [locale, tNav, origin] = await Promise.all([
    getLocale(),
    getTranslations('nav'),
    resolvePublicOriginFromRequest(),
  ])
  const homeLabel = tNav('home')

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale as AppLocale}
        homeLabel={homeLabel}
        items={items}
        origin={origin}
      />
      <SiteBreadcrumbs
        items={items}
        homeLabel={homeLabel}
        className={className}
        loading={loading}
      />
    </>
  )
}
