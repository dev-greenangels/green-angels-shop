import type { AppLocale } from '@/i18n/routing'
import { getSiteUrl } from '@/lib/auth/google-oauth'
import type { SiteBreadcrumbItem } from '@/lib/catalog/breadcrumbs'
import { localePath } from '@/lib/locale-path'

type BreadcrumbJsonLdProps = {
  locale: AppLocale
  homeLabel: string
  items: SiteBreadcrumbItem[]
}

export function BreadcrumbJsonLd({ locale, homeLabel, items }: BreadcrumbJsonLdProps) {
  const baseUrl = getSiteUrl()

  const itemListElement = [
    {
      '@type': 'ListItem',
      position: 1,
      name: homeLabel,
      item: `${baseUrl}${localePath('/', locale)}`,
    },
    ...items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: item.label,
      ...(item.href ? { item: `${baseUrl}${localePath(item.href, locale)}` } : {}),
    })),
  ]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
