import type { Metadata } from 'next'

import { PromotionsPageContent } from '@/components/catalog/promotions-page-content'
import { buildPromotionsMetadata } from '@/lib/catalog/marketing-metadata'

type PageProps = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return buildPromotionsMetadata(locale)
}

export default function PromotionsPage() {
  return <PromotionsPageContent />
}
