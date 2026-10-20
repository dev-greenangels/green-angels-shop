/**
 * Shareable «Акції» quantity filter: /{locale}/promotions?qty=10
 */

export const PROMOTIONS_QTY_PARAM = 'qty'

export function parsePromotionsQtyParam(raw: string | null | undefined): number | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return null
  const qty = Math.max(1, Math.floor(value))
  return qty
}

/** Build next query string: set/clear qty, always drop page when qty changes. */
export function buildPromotionsSearchParams(
  current: URLSearchParams,
  nextQty: number | null,
): string {
  const params = new URLSearchParams(current.toString())
  if (nextQty == null) {
    params.delete(PROMOTIONS_QTY_PARAM)
  } else {
    params.set(PROMOTIONS_QTY_PARAM, String(nextQty))
  }
  params.delete('page')

  // Stable key order: qty then remaining (page already removed).
  const qty = params.get(PROMOTIONS_QTY_PARAM)
  params.delete(PROMOTIONS_QTY_PARAM)
  const rest = [...params.entries()].sort(([a], [b]) => a.localeCompare(b))
  const ordered = new URLSearchParams()
  if (qty != null) ordered.set(PROMOTIONS_QTY_PARAM, qty)
  for (const [key, value] of rest) ordered.append(key, value)
  return ordered.toString()
}
