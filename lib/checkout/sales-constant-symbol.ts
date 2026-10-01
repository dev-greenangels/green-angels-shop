/**
 * EU e-shop Slovak constant symbol (KS) = Platby za tovar.
 * Must match FlexiSettings.salesConstantSymbol default — not banka.kod.
 */
export const EU_SALES_CONSTANT_SYMBOL = '0008'

/** Numeric VS from display order number `ZY-00000037` → `37`. */
export function numericOrderVarSym(orderNumber: string | number | null | undefined): string {
  if (typeof orderNumber === 'number' && Number.isFinite(orderNumber)) {
    return String(orderNumber)
  }
  const raw = String(orderNumber ?? '').trim()
  const match = raw.match(/(\d+)\s*$/)
  if (!match) return raw
  return String(Number(match[1]))
}
