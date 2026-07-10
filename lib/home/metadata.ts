import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { fetchPublicSiteSettings, getHomeSettings } from '@/lib/settings/fetch'

const SITE_SUFFIX = ' · Зелені Янголи'

export async function buildHomeMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')

  try {
    const fetched = await fetchPublicSiteSettings()
    const hero = getHomeSettings(fetched).hero
    const title = hero.title.trim() || t('title')
    const description = hero.subtitle.trim() || t('description')

    return {
      title: `${title}${SITE_SUFFIX}`,
      description,
    }
  } catch {
    return {
      title: t('title'),
      description: t('description'),
    }
  }
}
