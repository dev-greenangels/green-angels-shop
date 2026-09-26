import type {
  BackstageCartDetail,
  BackstageCartListResponse,
  CartActivityState,
} from '@/lib/carts/types'

export type { BackstageCartDetail, BackstageCartListItem } from '@/lib/carts/types'
export type { BackstageCartListResponse, CartActivityState }

export type BackstageCartsQuery = {
  search?: string
  kind?: 'guest' | 'user' | 'all'
  state?:
    | 'all'
    | 'active'
    | 'abandoned'
    | 'cart_only'
    | 'checkout_started'
    | 'cart_abandoned'
    | 'checkout_abandoned'
  locale?: string
  updatedFrom?: string
  updatedTo?: string
  page?: number
  pageSize?: number
}

export async function fetchBackstageCarts(
  params?: BackstageCartsQuery,
): Promise<BackstageCartListResponse> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.kind && params.kind !== 'all') query.set('kind', params.kind)
  if (params?.state && params.state !== 'all') query.set('state', params.state)
  if (params?.locale) query.set('locale', params.locale)
  if (params?.updatedFrom) query.set('updatedFrom', params.updatedFrom)
  if (params?.updatedTo) query.set('updatedTo', params.updatedTo)
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))

  const suffix = query.toString() ? `?${query}` : ''
  const res = await fetch(`/api/backstage/carts${suffix}`, { cache: 'no-store' })
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data as { message?: string | string[]; error?: string }
    if (Array.isArray(err.message)) throw new Error(err.message.join(', '))
    if (typeof err.message === 'string') throw new Error(err.message)
    if (typeof err.error === 'string') throw new Error(err.error)
    throw new Error('Помилка запиту')
  }

  if (data && typeof data === 'object' && Array.isArray((data as BackstageCartListResponse).items)) {
    return data as BackstageCartListResponse
  }

  // Legacy array response fallback (should not happen after deploy).
  if (Array.isArray(data)) {
    return {
      items: data as BackstageCartListResponse['items'],
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    }
  }

  return { items: [], total: 0, page: 1, pageSize: 50, totalPages: 1 }
}

export async function fetchBackstageCart(id: string): Promise<BackstageCartDetail> {
  const res = await fetch(`/api/backstage/carts/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  })
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = data as { message?: string | string[]; error?: string }
    if (Array.isArray(err.message)) throw new Error(err.message.join(', '))
    if (typeof err.message === 'string') throw new Error(err.message)
    if (typeof err.error === 'string') throw new Error(err.error)
    throw new Error('Помилка запиту')
  }
  return data as BackstageCartDetail
}

export function cartStateLabel(state: CartActivityState | null | undefined): string {
  switch (state) {
    case 'CART_ONLY':
      return 'Кошик (активний)'
    case 'CHECKOUT_ACTIVE':
      return 'Оформлення (активне)'
    case 'CART_ABANDONED':
      return 'Покинутий кошик'
    case 'CHECKOUT_ABANDONED':
      return 'Покинуте оформлення'
    default:
      return '—'
  }
}
