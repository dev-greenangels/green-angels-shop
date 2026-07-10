import { getLocale } from 'next-intl/server'

import { productHref } from '@/lib/catalog/paths'
import { fetchCatalogProductBySlug } from '@/lib/catalog/products'
import { redirect } from '@/i18n/navigation'
import { notFound } from 'next/navigation'

export default async function LegacyProductRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const locale = await getLocale()

  const productResult = await fetchCatalogProductBySlug(slug)
  if (!productResult.data) {
    notFound()
  }

  const plant = productResult.data
  if (!plant.category) {
    notFound()
  }

  redirect({ href: productHref(plant.category, plant.slug), locale })
}
