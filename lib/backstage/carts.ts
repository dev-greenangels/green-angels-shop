import type { BackstageCartListItem } from '@/lib/carts/types'

export type { BackstageCartListItem }

export async function fetchBackstageCarts(params?: {
  search?: string
  kind?: 'guest' | 'user' | 'all'
}): Promise<BackstageCartListItem[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set('search', params.search)
  if (params?.kind && params.kind !== 'all') query.set('kind', params.kind)

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
  return Array.isArray(data) ? (data as BackstageCartListItem[]) : []
}
