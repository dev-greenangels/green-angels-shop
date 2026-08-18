import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { fetchPublicSiteSettings, getWholesalePageSettings } from '@/lib/settings/fetch'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildWholesaleMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'wholesale' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const fallbackTitle = t('seoTitle')
  const fallbackDescription = t('seoDescription')

  try {
    const fetched = await fetchPublicSiteSettings()
    const page = getWholesalePageSettings(fetched)
    const title = page.seoTitle.trim() || page.title.trim() || fallbackTitle
    const description = page.seoDescription.trim() || page.intro.trim() || fallbackDescription
    return buildIndexablePageMetadata(locale, '/wholesale', {
      title: `${title} · ${siteName}`,
      description,
      siteName,
    })
  } catch {
    return buildIndexablePageMetadata(locale, '/wholesale', {
      title: `${fallbackTitle} · ${siteName}`,
      description: fallbackDescription,
      siteName,
    })
  }
}
