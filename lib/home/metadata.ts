import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { fetchPublicSiteSettings, getHomeSettings } from '@/lib/settings/fetch'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildHomeMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')

  try {
    const fetched = await fetchPublicSiteSettings()
    const hero = getHomeSettings(fetched).hero
    const title = hero.title.trim() || t('title')
    const description = hero.subtitle.trim() || t('description')

    return buildIndexablePageMetadata(locale, '/', {
      title: `${title} · ${siteName}`,
      description,
      images: hero.imageUrl ? [hero.imageUrl] : undefined,
      siteName,
    })
  } catch {
    return buildIndexablePageMetadata(locale, '/', {
      title: t('title'),
      description: t('description'),
      siteName,
    })
  }
}
