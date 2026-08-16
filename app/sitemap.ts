import type { MetadataRoute } from 'next'

import { defaultLocale } from '@/i18n/routing'
import { isIndexingAllowed } from '@/lib/seo/indexing-policy'
import { resolveSeoRequestContext } from '@/lib/seo/request-context'
import {
  loadSitemapBlogPaths,
  loadSitemapCategoryPaths,
  loadSitemapProductPaths,
} from '@/lib/seo/sitemap-data'
import { buildSitemapEntries, collectSitemapPathnames } from '@/lib/seo/sitemap-urls'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ctx = await resolveSeoRequestContext(defaultLocale)
  if (!isIndexingAllowed({ origin: ctx.origin })) return []

  const locale = ctx.xDefaultLocale
  const [categories, blog] = await Promise.all([
    loadSitemapCategoryPaths(locale),
    loadSitemapBlogPaths(),
  ])
  const products = await loadSitemapProductPaths(categories.activeSlugs, locale)

  const pathnames = collectSitemapPathnames({
    categoryPaths: categories.paths,
    productPaths: products.paths,
    blogPaths: blog.paths,
  })

  const lastModifiedByPath = {
    ...blog.lastModifiedByPath,
    ...products.lastModifiedByPath,
  }

  return buildSitemapEntries({
    origin: ctx.origin,
    availableLocales: ctx.availableLocales,
    xDefaultLocale: ctx.xDefaultLocale,
    pathnames,
    lastModifiedByPath,
  })
}
