import { getLocale, getTranslations } from 'next-intl/server'

import { HomeProductRowSection } from '@/components/home/home-product-row-section'
import { fetchBestsellerProducts, type HomeProductsResult } from '@/lib/catalog/home-products'
import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import type { HomePageSettings } from '@/lib/settings/types'

type BestsellersSectionProps = {
  settings: HomePageSettings['bestsellers']
  initialProducts?: HomeProductsResult
}

export async function BestsellersSection({
  settings,
  initialProducts,
}: BestsellersSectionProps) {
  const locale = await getLocale()
  const t = await getTranslations('home')
  const catalogHref = resolveCatalogHref(await fetchCatalogRootSlug(locale))
  const { plants, unavailable } =
    initialProducts ?? (await fetchBestsellerProducts(settings, locale))

  return (
    <HomeProductRowSection
      id="bestsellers"
      title={settings.title}
      subtitle={settings.subtitle}
      plants={plants}
      unavailable={unavailable}
      viewAllHref={catalogHref}
      viewAllLabel={t('viewAllPopular')}
      className="scroll-mt-20 bg-transparent"
    />
  )
}
