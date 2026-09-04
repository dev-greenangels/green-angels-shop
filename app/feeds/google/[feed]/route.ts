import { NextResponse } from 'next/server'

import { buildMerchantFeedXml } from '@/lib/merchant/build-feed'
import {
  MERCHANT_FEED_CACHE_CONTROL,
  parseMerchantFeedParam,
} from '@/lib/merchant/feeds'
import {
  isMerchantFeedEnabledOnHost,
  requestHostnameFromHeaders,
} from '@/lib/merchant/host-feeds'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ feed: string }>
}

export async function GET(request: Request, context: RouteContext) {
  const { feed: feedParam } = await context.params
  const feed = parseMerchantFeedParam(feedParam)
  if (!feed) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const hostname = requestHostnameFromHeaders(request.headers)
  if (
    !isMerchantFeedEnabledOnHost(feed.code, hostname, {
      countryHostsEnv: process.env.GA_COUNTRY_HOSTS,
    })
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const built = await buildMerchantFeedXml(feed)
  if ('status' in built) {
    return new NextResponse(built.message, {
      status: built.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const debug =
    process.env.NODE_ENV !== 'production' &&
    new URL(request.url).searchParams.get('debug') === '1'
  if (debug) {
    return NextResponse.json(
      {
        itemCount: built.itemCount,
        origin: built.origin,
        diag: built.diag,
        health: built.health,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return new NextResponse(built.xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': MERCHANT_FEED_CACHE_CONTROL,
      'X-Robots-Tag': 'noindex',
      'X-Merchant-Items': String(built.itemCount),
      'X-Merchant-Health': built.health,
    },
  })
}
