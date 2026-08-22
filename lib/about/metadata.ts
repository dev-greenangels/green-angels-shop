import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { fetchPublicSiteSettings, getResolvedAboutPageSettings } from '@/lib/settings/fetch'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildAboutMetadata(locale: string): Promise<Metadata> {
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const fallbackTitle = tNav('about')
  const fallbackDescription = fallbackTitle

  try {
    const fetched = await fetchPublicSiteSettings()
    const page = getResolvedAboutPageSettings(fetched, locale)
    const title = page.seoTitle.trim() || page.heroTitle.trim() || fallbackTitle
    const description = page.seoDescription.trim() || fallbackDescription
    return buildIndexablePageMetadata(locale, '/about', {
      title: title.includes(siteName) ? title : `${title} · ${siteName}`,
      description,
      siteName,
    })
  } catch {
    return buildIndexablePageMetadata(locale, '/about', {
      title: `${fallbackTitle} · ${siteName}`,
      description: fallbackDescription,
      siteName,
    })
  }
}
