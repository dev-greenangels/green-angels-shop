import type { CartMergePreview, CartMergeStrategy, ServerCartLine } from '@/lib/carts/types'
import { buildPricingQuoteLineItems } from '@/lib/pricing/quote-line-items'
import type { CartItem } from '@/lib/types'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (Array.isArray(data.message)) return data.message.join(' ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка кошика.'
}

export async function fetchServerCart(): Promise<ServerCartLine[]> {
  const res = await fetch('/api/carts', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) return []
  const data = (await res.json()) as { items?: ServerCartLine[] }
  return Array.isArray(data.items) ? data.items : []
}

export async function syncServerCart(items: CartItem[]): Promise<ServerCartLine[]> {
  const payload = buildPricingQuoteLineItems(items)
  const res = await fetch('/api/carts', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: payload }),
  })
  const data = (await res.json().catch(() => ({}))) as { items?: ServerCartLine[]; message?: string }
  if (!res.ok) throw new Error(await parseError(res))
  return Array.isArray(data.items) ? data.items : []
}

export async function fetchCartMergePreview(): Promise<CartMergePreview | null> {
  const res = await fetch('/api/carts/merge-preview', { credentials: 'include', cache: 'no-store' })
  if (res.status === 401) return null
  if (!res.ok) return null
  return (await res.json()) as CartMergePreview
}

export async function applyCartMerge(strategy: CartMergeStrategy): Promise<ServerCartLine[]> {
  const res = await fetch('/api/carts/merge', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy }),
  })
  const data = (await res.json().catch(() => ({}))) as { items?: ServerCartLine[] }
  if (!res.ok) throw new Error(await parseError(res))
  return Array.isArray(data.items) ? data.items : []
}
