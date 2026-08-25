import { getLocale, getTranslations } from 'next-intl/server'

import { HomeProductRowSection } from '@/components/home/home-product-row-section'
import type { FetchResult } from '@/lib/api/fetch-result'
import { fetchNewArrivalProducts } from '@/lib/catalog/home-products'
import { pickHomeCmsText } from '@/lib/home/cms-or-translated'
import { DEFAULT_HOME_SETTINGS } from '@/lib/settings/defaults'
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
      title={pickHomeCmsText(
        settings.title,
        DEFAULT_HOME_SETTINGS.newArrivals.title,
        t('newArrivalsTitle'),
      )}
      subtitle={pickHomeCmsText(
        settings.subtitle,
        DEFAULT_HOME_SETTINGS.newArrivals.subtitle,
        t('newArrivalsSubtitle'),
      )}
      plants={result.plants}
      unavailable={result.unavailable}
      viewAllHref="/new-arrivals"
      viewAllLabel={t('viewAllNewArrivals')}
      className="border-y border-border/30"
    />
  )
}
