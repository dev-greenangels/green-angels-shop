export type ShelfPriceTier = {
  minQuantity: number
  unitPrice: number
  scope: string
}

export type ShelfPriceItem = {
  productVariantId: string
  unitPrice: number
  scope: string
  quantityTiers: ShelfPriceTier[]
}

export type ShelfPricesResult = {
  items: ShelfPriceItem[]
  personalized: boolean
}

function parseTiers(raw: unknown): ShelfPriceTier[] {
  if (!Array.isArray(raw)) return []
  const out: ShelfPriceTier[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const minQuantity = Number((row as { minQuantity?: unknown }).minQuantity)
    const unitPrice = Number((row as { unitPrice?: unknown }).unitPrice)
    const scope = String((row as { scope?: unknown }).scope ?? '')
    if (!(minQuantity > 0) || !(unitPrice > 0)) continue
    out.push({ minQuantity, unitPrice, scope })
  }
  return out.sort((a, b) => a.minQuantity - b.minQuantity)
}

export async function fetchShelfPrices(variantIds: string[]): Promise<ShelfPricesResult> {
  const unique = [...new Set(variantIds.filter(Boolean))].slice(0, 200)
  if (!unique.length) return { items: [], personalized: false }

  const res = await fetch('/api/pricing/shelf-prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ variantIds: unique }),
  })
  const data = (await res.json().catch(() => ({}))) as Partial<ShelfPricesResult> & {
    message?: string
  }
  if (!res.ok) {
    throw new Error(typeof data.message === 'string' ? data.message : 'Не вдалося завантажити ціни.')
  }
  const items = Array.isArray(data.items)
    ? data.items
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const productVariantId = String(
            (item as { productVariantId?: unknown }).productVariantId ?? '',
          )
          const unitPrice = Number((item as { unitPrice?: unknown }).unitPrice)
          const scope = String((item as { scope?: unknown }).scope ?? '')
          if (!productVariantId || !(unitPrice > 0)) return null
          return {
            productVariantId,
            unitPrice,
            scope,
            quantityTiers: parseTiers((item as { quantityTiers?: unknown }).quantityTiers),
          } satisfies ShelfPriceItem
        })
        .filter((row): row is ShelfPriceItem => row != null)
    : []
  return {
    items,
    personalized: data.personalized === true,
  }
}
