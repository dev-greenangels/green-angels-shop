import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { resolveHeroDisplayUrl } from '@/lib/home/hero-image'
import { isSupportedLocale } from '@/lib/i18n/locales'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'
import { resolvePublicCompanyName } from '@/lib/settings/company-name'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
import { resolveHomePageForLocale } from '@/lib/settings/home-cms'
import { fetchPublicSiteSettings, getHomeSettings, getStoreSettings } from '@/lib/settings/fetch'

export async function buildHomeMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'metadata' })
  const tHome = await getTranslations({ locale, namespace: 'home' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const brand = tCommon('brand')

  try {
    const fetched = await fetchPublicSiteSettings()
    const appLocale = isSupportedLocale(locale) ? locale : 'uk'
    const hero = resolveHomePageForLocale(getHomeSettings(fetched), appLocale).hero
    const siteName = resolvePublicCompanyName(getStoreSettings(fetched, { locale }), brand)
    const title = pickHomeCmsText(hero.title, DEFAULT_HOME_SETTINGS.hero.title, tHome('heroTitle'))
    const description = pickHomeCmsText(
      hero.subtitle,
      DEFAULT_HOME_SETTINGS.hero.subtitle,
      t('description'),
    )

    const heroImage = resolveHeroDisplayUrl(hero.imageUrl)

    return buildIndexablePageMetadata(locale, '/', {
      title: `${title} · ${siteName}`,
      description,
      images: heroImage ? [heroImage] : undefined,
      siteName,
    })
  } catch {
    return buildIndexablePageMetadata(locale, '/', {
      title: t('title'),
      description: t('description'),
      siteName: brand,
    })
  }
}
