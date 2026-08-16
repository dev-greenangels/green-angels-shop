import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { normalizeSearchQuery } from '@/lib/search/normalize'
import { SEARCH_QUERY_PARAM } from '@/lib/search/url'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildSearchPageMetadata(query: string, locale: string): Promise<Metadata> {
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const t = await getTranslations({ locale, namespace: 'search' })
  const siteName = tCommon('brand')
  const normalized = normalizeSearchQuery(query)
  const robots: Metadata['robots'] = { index: false, follow: true }

  if (!normalized) {
    return buildIndexablePageMetadata(locale, '/search', {
      title: `${tCommon('search')} · ${siteName}`,
      siteName,
      robots,
    })
  }

  const pathname = `/search?${new URLSearchParams({ [SEARCH_QUERY_PARAM]: normalized }).toString()}`
  return buildIndexablePageMetadata(locale, pathname, {
    title: t('resultsTitle', { query: normalized }),
    description: t('resultsSubtitle', { brand: siteName }),
    siteName,
    robots,
  })
}
