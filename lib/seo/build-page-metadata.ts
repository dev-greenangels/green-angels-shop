import type { Metadata } from 'next'

import type { AppLocale } from '@/i18n/routing'
import { getMarketBranding } from '@/lib/branding/market-branding'
import { OG_LOCALE, buildPageAlternates, type PageAlternates } from '@/lib/seo/page-alternates'
import { resolveSeoRequestContext } from '@/lib/seo/request-context'
import { isIndexingAllowed, previewRobotsDirective } from '@/lib/seo/indexing-policy'
import type { MarketRegion } from '@/lib/settings/market'

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
        marketRegion: ctx.marketRegion,
        countryCode: ctx.countryCode,
        enabledCountrySites: ctx.enabledCountrySites,
        countryHostsEnv: process.env.GA_COUNTRY_HOSTS,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      })
    : null
  return applyIndexableMetadata(
    {
      ...fields,
      locale: ctx.locale,
      marketRegion: ctx.marketRegion,
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
    marketRegion: MarketRegion
    siteName?: string
    robots?: Metadata['robots']
  },
  alternates: PageAlternates | null,
): Metadata {
  const requestedImage = base.images?.find((url) => Boolean(url?.trim()))
  const image = requestedImage ?? getMarketBranding(base.marketRegion).socialImage
  const openGraphImage = requestedImage
    ? { url: image }
    : {
        url: image,
        width: 1200,
        height: 630,
        alt: base.siteName ?? base.title,
      }
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
      images: [openGraphImage],
    }
    metadata.twitter = {
      card: 'summary_large_image',
      title: base.title,
      description: base.description,
      images: [image],
    }
  }

  return metadata
}
