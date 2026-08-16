import type { Metadata } from 'next'

import type { AppLocale } from '@/i18n/routing'
import { OG_LOCALE, buildPageAlternates, type PageAlternates } from '@/lib/seo/page-alternates'
import { resolveSeoRequestContext } from '@/lib/seo/request-context'
import { isIndexingAllowed, previewRobotsDirective } from '@/lib/seo/indexing-policy'

export async function buildIndexablePageMetadata(
  locale: string,
  pathname: string,
  fields: {
    title: string
    description?: string
    images?: string[]
    robots?: Metadata['robots']
    siteName?: string
  },
): Promise<Metadata> {
  const ctx = await resolveSeoRequestContext(locale)
  const indexing = isIndexingAllowed({ origin: ctx.origin })
  const alternates = indexing
    ? buildPageAlternates({
        origin: ctx.origin,
        locale: ctx.locale,
        pathname,
        availableLocales: ctx.availableLocales,
        xDefaultLocale: ctx.xDefaultLocale,
      })
    : null
  return applyIndexableMetadata(
    {
      ...fields,
      locale: ctx.locale,
      robots: indexing ? fields.robots : previewRobotsDirective(),
    },
    alternates,
  )
}

export function applyIndexableMetadata(
  base: {
    title: string
    description?: string
    images?: string[]
    locale: AppLocale
    siteName?: string
    robots?: Metadata['robots']
  },
  alternates: PageAlternates | null,
): Metadata {
  const image = base.images?.find((url) => Boolean(url?.trim()))
  const metadata: Metadata = {
    title: base.title,
    description: base.description,
    robots: base.robots,
  }

  if (alternates) {
    metadata.alternates = {
      canonical: alternates.canonical,
      languages: alternates.languages,
    }
    metadata.openGraph = {
      title: base.title,
      description: base.description,
      url: alternates.canonical,
      type: 'website',
      locale: OG_LOCALE[base.locale],
      siteName: base.siteName,
      ...(image ? { images: [{ url: image }] } : {}),
    }
    metadata.twitter = {
      card: image ? 'summary_large_image' : 'summary',
      title: base.title,
      description: base.description,
      ...(image ? { images: [image] } : {}),
    }
  }

  return metadata
}
