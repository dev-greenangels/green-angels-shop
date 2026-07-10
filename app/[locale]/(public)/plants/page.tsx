import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PlantsAlphabetPageContent } from '@/components/catalog/plants-alphabet-page-content'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'catalog' })
  return {
    title: t('plantsAlphabetTitle'),
    description: t('plantsAlphabetSubtitle'),
  }
}

export default async function PlantsAlphabetPage({ params }: PageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return <PlantsAlphabetPageContent />
}
