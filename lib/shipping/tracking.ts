/**
 * Customer-facing shipment tracking helpers (cabinet).
 * Prefer order.trackingCarrier; fall back to delivery method slug.
 */

export type TrackingCarrierId = 'nova-poshta' | 'packeta' | 'gls'

const CARRIER_ALIASES: Record<string, TrackingCarrierId> = {
  'nova-poshta': 'nova-poshta',
  novaposhta: 'nova-poshta',
  np: 'nova-poshta',
  packeta: 'packeta',
  zasilkovna: 'packeta',
  gls: 'gls',
}

export function resolveTrackingCarrier(
  trackingCarrier?: string | null,
  deliveryMethod?: string | null,
): TrackingCarrierId | null {
  const raw = (trackingCarrier ?? '').trim().toLowerCase()
  if (raw && CARRIER_ALIASES[raw]) return CARRIER_ALIASES[raw]

  const method = (deliveryMethod ?? '').trim().toLowerCase()
  if (method.startsWith('nova-poshta')) return 'nova-poshta'
  if (method.startsWith('packeta')) return 'packeta'
  if (method.startsWith('gls')) return 'gls'
  return null
}

/** Public tracking page URL, or null when carrier is unknown / pickup. */
export function buildTrackingUrl(
  trackingNumber: string,
  options?: {
    trackingCarrier?: string | null
    deliveryMethod?: string | null
  },
): string | null {
  const number = trackingNumber.trim()
  if (!number) return null

  const carrier = resolveTrackingCarrier(
    options?.trackingCarrier,
    options?.deliveryMethod,
  )
  const encoded = encodeURIComponent(number)

  switch (carrier) {
    case 'nova-poshta':
      return `https://novaposhta.ua/tracking/?cargo_number=${encoded}`
    case 'packeta':
      return `https://tracking.packeta.com/?id=${encoded}`
    case 'gls':
      return `https://gls-group.com/EU/en/parcel-tracking?match=${encoded}`
    default:
      return null
  }
}
