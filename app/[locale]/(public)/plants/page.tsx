import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PlantsAlphabetPageContent } from '@/components/catalog/plants-alphabet-page-content'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'
import { UTILITY_PAGE_ROBOTS } from '@/lib/seo/robots-directives'

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ letter?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = await searchParams
  const letter = resolved.letter?.trim()
  const t = await getTranslations({ locale, namespace: 'catalog' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const title = `${t('plantsAlphabetTitle')} · ${siteName}`
  const description = t('plantsAlphabetSubtitle')

  if (letter) {
    const pathname = `/plants?letter=${encodeURIComponent(letter)}`
    return buildIndexablePageMetadata(locale, pathname, {
      title,
      description,
      siteName,
      robots: UTILITY_PAGE_ROBOTS,
    })
  }

  return buildIndexablePageMetadata(locale, '/plants', {
    title,
    description,
    siteName,
  })
}

export default async function PlantsAlphabetPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return <PlantsAlphabetPageContent />
}
