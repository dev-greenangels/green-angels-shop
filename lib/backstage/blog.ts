import type { BlogPostDetail, BlogPostListItem } from '@/lib/blog/posts'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export type BlogPostFormValues = {
  title: string
  slug: string
  content: string
  image: string
}

export async function fetchBackstageBlogPosts(): Promise<BlogPostListItem[]> {
  const res = await fetch('/api/backstage/blog', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createBackstageBlogPost(
  payload: BlogPostFormValues,
): Promise<BlogPostDetail> {
  const res = await fetch('/api/backstage/blog', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      image: payload.image.trim() || null,
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageBlogPost(
  id: string,
  payload: Partial<BlogPostFormValues>,
): Promise<BlogPostDetail> {
  const res = await fetch(`/api/backstage/blog/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      ...(payload.image !== undefined ? { image: payload.image.trim() || null } : {}),
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function deleteBackstageBlogPost(id: string): Promise<{ ok: true }> {
  const res = await fetch(`/api/backstage/blog/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
