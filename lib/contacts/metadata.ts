import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'
import { resolvePublicCompanyName } from '@/lib/settings/company-name'
import { fetchPublicSiteSettings, getStoreSettings } from '@/lib/settings/fetch'

export async function buildContactsMetadata(locale: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'contactsPage' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const brand = tCommon('brand')

  try {
    const fetched = await fetchPublicSiteSettings()
    const store = getStoreSettings(fetched)
    const company = resolvePublicCompanyName(store, brand)
    const title = t('seoTitle', { company })
    const description = t('seoDescription', { company })
    return buildIndexablePageMetadata(locale, '/contacts', {
      title: title.includes(company) ? title : `${title} · ${company}`,
      description,
      siteName: company,
    })
  } catch {
    return buildIndexablePageMetadata(locale, '/contacts', {
      title: `${t('title')} · ${brand}`,
      description: t('seoDescription', { company: brand }),
      siteName: brand,
    })
  }
}
