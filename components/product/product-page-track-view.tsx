'use client'

import { useTrackProductView } from '@/lib/recently-viewed-store'

export function ProductPageTrackView({ productId }: { productId: string }) {
  useTrackProductView(productId)
  return null
}
