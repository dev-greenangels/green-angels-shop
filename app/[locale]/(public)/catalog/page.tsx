import { getLocale } from 'next-intl/server'

import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import { redirect } from '@/i18n/navigation'

export default async function LegacyCatalogRedirect() {
  const locale = await getLocale()
  const catalogRootSlug = await fetchCatalogRootSlug(locale)
  redirect({ href: resolveCatalogHref(catalogRootSlug), locale })
}
