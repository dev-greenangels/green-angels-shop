export async function fetchFavoriteIds(): Promise<string[]> {
  const res = await fetch('/api/favorites', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data.filter((id): id is string => typeof id === 'string') : []
}

export async function addFavorite(productId: string): Promise<string[]> {
  const res = await fetch('/api/favorites', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Не вдалося додати до обраного.')
  }
  return Array.isArray(data) ? data : []
}

export async function removeFavorite(productId: string): Promise<string[]> {
  const res = await fetch(`/api/favorites/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Не вдалося прибрати з обраного.')
  }
  return Array.isArray(data) ? data : []
}

export async function mergeFavorites(productIds: string[]): Promise<string[]> {
  const res = await fetch('/api/favorites/merge', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productIds }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Не вдалося синхронізувати обране.')
  }
  return Array.isArray(data) ? data : []
}
