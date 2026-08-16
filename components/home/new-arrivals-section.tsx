import { getLocale, getTranslations } from 'next-intl/server'

import { HomeProductRowSection } from '@/components/home/home-product-row-section'
import type { FetchResult } from '@/lib/api/fetch-result'
import { fetchNewArrivalProducts } from '@/lib/catalog/home-products'
import type { HomePageSettings } from '@/lib/settings/types'
import type { Plant } from '@/lib/types'

export async function NewArrivalsSection({
  settings,
  initialProducts,
}: {
  settings: HomePageSettings['newArrivals']
  initialProducts?: FetchResult<Plant[]>
}) {
  const locale = await getLocale()
  const t = await getTranslations('home')
  const result =
    initialProducts != null
      ? { plants: initialProducts.data, unavailable: initialProducts.unavailable }
      : await fetchNewArrivalProducts(settings, locale)

  return (
    <HomeProductRowSection
      title={settings.title}
      subtitle={settings.subtitle}
      plants={result.plants}
      unavailable={result.unavailable}
      viewAllHref="/new-arrivals"
      viewAllLabel={t('viewAllNewArrivals')}
      className="border-y border-border/30"
    />
  )
}
