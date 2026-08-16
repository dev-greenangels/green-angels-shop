import type { AppLocale } from '@/i18n/routing'
import { isAppLocale } from '@/i18n/routing'
import { buildPageAlternates } from '@/lib/seo/page-alternates'

export const SITEMAP_STATIC_PATHS = [
  '/',
  '/blog',
  '/about',
  '/contacts',
  '/faq',
  '/shipping',
  '/terms',
  '/returns',
  '/reviews',
  '/plants',
  '/promotions',
  '/new-arrivals',
] as const

export type SitemapUrlEntry = {
  url: string
  lastModified?: string
}

function unique(paths: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const path of paths) {
    const trimmed = path.trim()
    if (!trimmed || trimmed.includes('?') || seen.has(trimmed)) continue
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

export function collectSitemapPathnames(input: {
  categoryPaths: string[]
  productPaths: string[]
  blogPaths: string[]
}): string[] {
  return unique([
    ...SITEMAP_STATIC_PATHS,
    ...input.categoryPaths,
    ...input.productPaths,
    ...input.blogPaths,
  ])
}

/** One sitemap row per allowed locale, all on this origin only. */
export function buildSitemapEntries(input: {
  origin: string
  availableLocales: readonly string[]
  xDefaultLocale: string
  pathnames: string[]
  lastModifiedByPath?: Record<string, string>
}): SitemapUrlEntry[] {
  const locales = input.availableLocales.filter(isAppLocale)
  if (!input.origin || locales.length === 0) return []

  const entries: SitemapUrlEntry[] = []
  const seen = new Set<string>()

  for (const locale of locales as AppLocale[]) {
    for (const pathname of input.pathnames) {
      const alt = buildPageAlternates({
        origin: input.origin,
        locale,
        pathname,
        availableLocales: locales,
        xDefaultLocale: input.xDefaultLocale,
      })
      if (!alt?.canonical || seen.has(alt.canonical)) continue
      seen.add(alt.canonical)
      const lastModified = input.lastModifiedByPath?.[pathname]
      entries.push(lastModified ? { url: alt.canonical, lastModified } : { url: alt.canonical })
    }
  }

  return entries
}
