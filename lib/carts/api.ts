import type { CartMergePreview, CartMergeStrategy, ServerCartLine } from '@/lib/carts/types'
import { extractCustomerErrorCode } from '@/lib/api/extract-customer-error-code'
import { buildPricingQuoteLineItems } from '@/lib/pricing/quote-line-items'
import type { CartItem } from '@/lib/types'

export class CartApiError extends Error {
  readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'CartApiError'
    this.code = code
  }
}

function throwCartError(data: unknown): never {
  const code = extractCustomerErrorCode(data) ?? undefined
  throw new CartApiError(code ?? 'CART_ERROR', code)
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
  const data = (await res.json().catch(() => ({}))) as { items?: ServerCartLine[] }
  if (!res.ok) throwCartError(data)
  return Array.isArray(data.items) ? data.items : []
}

export async function fetchCheckoutDraft(): Promise<{
  draft: import('@/lib/carts/types').CheckoutDraftV1 | null
  checkoutStartedAt: string | null
  updatedAt: string | null
}> {
  const res = await fetch('/api/carts/checkout-draft', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) {
    return { draft: null, checkoutStartedAt: null, updatedAt: null }
  }
  const data = (await res.json()) as {
    draft?: import('@/lib/carts/types').CheckoutDraftV1 | null
    checkoutStartedAt?: string | null
    updatedAt?: string | null
  }
  return {
    draft: data.draft ?? null,
    checkoutStartedAt: data.checkoutStartedAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

/** Best-effort: never throws to callers that soft-fail. */
export async function patchCheckoutDraft(
  draft: import('@/lib/carts/types').CheckoutDraftV1,
): Promise<boolean> {
  try {
    const res = await fetch('/api/carts/checkout-draft', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Best-effort: set checkoutStartedAt once. */
export async function startCheckoutDraft(): Promise<boolean> {
  try {
    const res = await fetch('/api/carts/checkout-start', {
      method: 'POST',
      credentials: 'include',
    })
    return res.ok
  } catch {
    return false
  }
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
  if (!res.ok) throwCartError(data)
  return Array.isArray(data.items) ? data.items : []
}
