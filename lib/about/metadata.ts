import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { fetchPublicSiteSettings, getResolvedAboutPageSettings } from '@/lib/settings/fetch'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildAboutMetadata(locale: string): Promise<Metadata> {
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tAbout = await getTranslations({ locale, namespace: 'aboutPage' })
  const siteName = tCommon('brand')
  const fallbackTitle = tNav('about')
  const fallbackDescription = tAbout('unavailableBody')

  try {
    const fetched = await fetchPublicSiteSettings()
    const page = getResolvedAboutPageSettings(fetched, locale)
    if (!page) {
      return buildIndexablePageMetadata(locale, '/about', {
        title: `${fallbackTitle} · ${siteName}`,
        description: fallbackDescription,
        siteName,
      })
    }
    const title = page.seo.title.trim() || page.hero.title.trim() || fallbackTitle
    const description = page.seo.description.trim() || fallbackDescription
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
