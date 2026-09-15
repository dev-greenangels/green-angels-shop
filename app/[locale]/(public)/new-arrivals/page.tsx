import type { Metadata } from 'next'

import { NewArrivalsPageContent } from '@/components/catalog/new-arrivals-page-content'
import { buildNewArrivalsMetadata } from '@/lib/catalog/marketing-metadata'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildNewArrivalsMetadata(locale)
}

export default function NewArrivalsPage() {
  return <NewArrivalsPageContent />
}
