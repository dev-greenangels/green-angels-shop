import { ArrowRight } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { HomeCategoryCarousel } from '@/components/home/home-category-carousel'
import { HomeSectionHeader } from '@/components/home/home-section-header'
import { Button } from '@/components/ui/button'
import { ServiceUnavailableNotice } from '@/components/ui/service-unavailable-notice'
import { Link } from '@/i18n/navigation'
import { fetchCatalogCategories } from '@/lib/catalog/categories'
import { orderCategoriesBySlugs } from '@/lib/catalog/order-categories'
import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import type { CatalogCategory } from '@/lib/catalog/types'
import type { FetchResult } from '@/lib/api/fetch-result'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import type { HomePageSettings } from '@/lib/settings/types'

type CategoriesSectionProps = {
  settings: HomePageSettings['categories']
  initialCategories?: FetchResult<CatalogCategory[]>
}

export async function CategoriesSection({
  settings,
  initialCategories,
}: CategoriesSectionProps) {
  const locale = await getLocale()
  const t = await getTranslations('home')
  const tc = await getTranslations('common')
  const te = await getTranslations('errors')
  const catalogHref = resolveCatalogHref(await fetchCatalogRootSlug(locale))
  const { data: categories, unavailable } =
    initialCategories ?? (await fetchCatalogCategories(locale))
  const visibleCategories = orderCategoriesBySlugs(
    categories,
    settings.categorySlugs,
    settings.limit,
  )
  const title = settings.title.trim()

  return (
    <section className="py-10 md:py-14">
      <div className={siteContentShellClassName}>
        {title ? (
          <HomeSectionHeader
            title={title}
            subtitle={settings.subtitle || undefined}
            align="left"
            className="mb-6 md:mb-8"
          />
        ) : settings.subtitle ? (
          <p className="mb-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:mb-8 md:text-lg">
            {settings.subtitle}
          </p>
        ) : null}

        {unavailable ? (
          <ServiceUnavailableNotice
            compact
            message={te('catalogUnavailable')}
            className="mx-auto max-w-lg"
          />
        ) : visibleCategories.length > 0 ? (
          <>
            <HomeCategoryCarousel categories={visibleCategories} />
            <div className="mt-8 flex justify-center md:mt-10">
              <Button variant="secondary" size="lg" asChild className="rounded-full px-6">
                <Link href={catalogHref}>
                  {tc('fullCatalog')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground">{t('categoriesComingSoon')}</p>
        )}
      </div>
    </section>
  )
}
