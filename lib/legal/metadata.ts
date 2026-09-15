import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

async function buildLegalPageMetadata(
  locale: string,
  pathname: string,
  seoTitleKey: string,
  seoDescriptionKey: string,
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'legalPages' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const title = t(seoTitleKey)
  const description = t(seoDescriptionKey)

  return buildIndexablePageMetadata(locale, pathname, {
    title: title.includes(siteName) ? title : `${title} · ${siteName}`,
    description,
    siteName,
  })
}

export function buildTermsMetadata(locale: string): Promise<Metadata> {
  return buildLegalPageMetadata(locale, '/terms', 'termsSeoTitle', 'termsSeoDescription')
}

export function buildPrivacyMetadata(locale: string): Promise<Metadata> {
  return buildLegalPageMetadata(locale, '/privacy', 'privacySeoTitle', 'privacySeoDescription')
}

export function buildCookiesMetadata(locale: string): Promise<Metadata> {
  return buildLegalPageMetadata(locale, '/cookies', 'cookiesSeoTitle', 'cookiesSeoDescription')
}

export function buildReturnsMetadata(locale: string): Promise<Metadata> {
  return buildLegalPageMetadata(locale, '/returns', 'returnsSeoTitle', 'returnsSeoDescription')
}
