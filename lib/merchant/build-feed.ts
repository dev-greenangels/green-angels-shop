import { fetchCommerceSettings } from '@/lib/commerce/fetch'
import { applyCountrySiteOverlay } from '@/lib/country-sites/apply-overlay'
import { resolveSeoOffer } from '@/lib/seo/offer-context'
import {
  fetchPublicSiteSettings,
  getCartCheckoutSettings,
  getMarketSettings,
} from '@/lib/settings/fetch'

import {
  evaluateMerchantCatalog,
  merchantFeedHealth,
  type MerchantCatalogEvaluation,
  type MerchantDiagCounters,
  type MerchantFeedHealth,
} from './evaluate'
import { resolveMerchantFeedOrigin, type MerchantFeedConfig } from './feeds'
import { loadAllMerchantCatalogProducts } from './load-catalog'
import { mapProductToMerchantItems } from './map-item'
import type { MerchantFeedItem } from './types'
import { buildMerchantRssXml } from './xml'

export type MerchantFeedBuildError = {
  status: 503
  message: string
}

export type MerchantFeedBuildSuccess = {
  xml: string
  origin: string
  itemCount: number
  diag: MerchantDiagCounters
  health: MerchantFeedHealth
  evaluation: MerchantCatalogEvaluation
}

async function loadFeedContext(feed: MerchantFeedConfig) {
  const origin = resolveMerchantFeedOrigin(feed.countrySite, {
    countryHostsEnv: process.env.GA_COUNTRY_HOSTS,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? null

  const [siteSettings, commerce] = await Promise.all([
    fetchPublicSiteSettings(),
    fetchCommerceSettings(feed.locale),
  ])
  const market = getMarketSettings(siteSettings)
  if (market.region !== 'sk') {
    return {
      error: {
        status: 503 as const,
        message: 'Merchant feeds require an SK/EU market deploy (commerce.market.region=sk).',
      },
    }
  }

  const overlay = applyCountrySiteOverlay(market, feed.countrySite)
  if (!overlay) {
    return {
      error: {
        status: 503 as const,
        message: `Merchant feed overlay missing for country site "${feed.countrySite}".`,
      },
    }
  }

  const cartTaxRatePercent = getCartCheckoutSettings(siteSettings).taxRatePercent
  const resolveOffer = (storedPrice: number) =>
    resolveSeoOffer(storedPrice, {
      market,
      overlay,
      commerce,
      cartTaxRatePercent,
    })

  const products = await loadAllMerchantCatalogProducts(feed)
  const evaluation = evaluateMerchantCatalog(products, { siteUrl, resolveOffer })

  return { origin, siteUrl, resolveOffer, products, evaluation }
}

export async function buildMerchantFeedXml(
  feed: MerchantFeedConfig,
): Promise<MerchantFeedBuildSuccess | MerchantFeedBuildError> {
  const ctx = await loadFeedContext(feed)
  if ('error' in ctx && ctx.error) return ctx.error

  const { origin, siteUrl, resolveOffer, products, evaluation } = ctx as Exclude<
    Awaited<ReturnType<typeof loadFeedContext>>,
    { error: MerchantFeedBuildError }
  >

  const items: MerchantFeedItem[] = []
  for (const product of products) {
    items.push(
      ...mapProductToMerchantItems({
        product,
        feed,
        origin,
        resolveOffer,
        siteUrl,
      }).items,
    )
  }

  console.info(
    `[merchant-feed ${feed.code}] products=${evaluation.counters.productsFetched} ` +
      `variants=${evaluation.counters.variantsInspected} included=${evaluation.counters.included} ` +
      `excluded=${evaluation.counters.excluded} exclImage=${evaluation.counters.excludedMissingNonPublicImage}`,
  )

  const feedLink = `${origin.replace(/\/$/, '')}/feeds/google/${feed.fileName}`
  const xml = buildMerchantRssXml({
    title: feed.channelTitle,
    link: feedLink,
    description: `Google Merchant product feed (${feed.gmcTargets.join(', ')})`,
    items,
  })

  return {
    xml,
    origin,
    itemCount: items.length,
    diag: evaluation.counters,
    health: merchantFeedHealth(evaluation.counters.included, evaluation.counters.excluded),
    evaluation,
  }
}

/** Full evaluation for Backoffice diagnostics (same eligibility as XML). */
export async function buildMerchantFeedDiagnostics(feed: MerchantFeedConfig) {
  const ctx = await loadFeedContext(feed)
  if ('error' in ctx && ctx.error) return ctx.error

  const { origin, evaluation } = ctx as Exclude<
    Awaited<ReturnType<typeof loadFeedContext>>,
    { error: MerchantFeedBuildError }
  >

  return {
    feed: feed.code,
    locale: feed.locale,
    origin,
    publicUrl: `${origin.replace(/\/$/, '')}/feeds/google/${feed.fileName}`,
    gmcTargets: feed.gmcTargets,
    counters: evaluation.counters,
    health: merchantFeedHealth(evaluation.counters.included, evaluation.counters.excluded),
    includedRows: evaluation.includedRows,
    excludedRows: evaluation.excludedRows,
  }
}
