import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildShippingMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'shippingPage' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const title = t('seoTitle')
  const description = t('seoDescription')

  return buildIndexablePageMetadata(locale, '/shipping', {
    title: title.includes(siteName) ? title : `${title} | ${siteName}`,
    description,
    siteName,
  })
}
