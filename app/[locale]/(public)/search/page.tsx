import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Navigation } from '@/components/navigation'
import { PublicPageBreadcrumbs } from '@/components/public-page-breadcrumbs'
import { SearchResultsContent } from '@/components/search/search-results-content'
import { siteContentShellClassName } from '@/lib/layout/site-shell'
import { fetchCatalogRootSlug, resolveCatalogHref } from '@/lib/catalog/paths'
import { redirect } from '@/i18n/navigation'
import { buildSearchPageMetadata } from '@/lib/search/metadata'
import { normalizeSearchQuery } from '@/lib/search/url'

type SearchPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params
  const { q } = await searchParams
  return buildSearchPageMetadata(q ?? '', locale)
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('search')
  const tCommon = await getTranslations('common')
  const tNav = await getTranslations('nav')
  const { q } = await searchParams
  const query = normalizeSearchQuery(q)

  if (!query) {
    const catalogRootSlug = await fetchCatalogRootSlug(locale)
    redirect({ href: resolveCatalogHref(catalogRootSlug), locale })
  }

  const catalogHref = resolveCatalogHref(await fetchCatalogRootSlug(locale))

  return (
    <>
      <Navigation />
      <main className="flex-1 bg-transparent">
        <div className="border-b border-border/40 bg-secondary/30 py-8 md:py-12">
          <div className={siteContentShellClassName}>
            <PublicPageBreadcrumbs
              className="mb-4"
              items={[
                { label: tNav('catalog'), href: catalogHref },
                { label: tNav('search') },
              ]}
            />
            <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
              {t('resultsTitle', { query })}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t('resultsSubtitle', { brand: tCommon('brand') })}
            </p>
          </div>
        </div>
        <SearchResultsContent query={query} />
      </main>
    </>
  )
}
