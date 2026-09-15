import type { Metadata } from 'next'

import { FreshPhotosPageContent } from '@/components/catalog/fresh-photos-page-content'
import { buildFreshPhotosMetadata } from '@/lib/catalog/marketing-metadata'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildFreshPhotosMetadata(locale)
}

export default function FreshPhotosPage() {
  return <FreshPhotosPageContent />
}
