import type { MetadataRoute } from 'next'

import { isIndexingAllowed } from '@/lib/seo/indexing-policy'
import { buildRobotsRules } from '@/lib/seo/robots-policy'
import { resolvePublicOriginFromRequest } from '@/lib/seo/request-context'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await resolvePublicOriginFromRequest()
  const indexingAllowed = isIndexingAllowed({ origin })
  return buildRobotsRules({ origin, indexingAllowed })
}
