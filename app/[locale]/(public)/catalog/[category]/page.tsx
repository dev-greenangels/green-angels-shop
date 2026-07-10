import { getLocale } from 'next-intl/server'

import { categoryHref } from '@/lib/catalog/paths'
import { redirect } from '@/i18n/navigation'

type PageProps = {
  params: Promise<{ category: string }>
}

export default async function LegacyCatalogCategoryRedirect({ params }: PageProps) {
  const { category } = await params
  const locale = await getLocale()
  redirect({ href: categoryHref(category), locale })
}
