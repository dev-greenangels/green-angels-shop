import type { BlogPostDetail, BlogPostListItem, BlogPostsPageResult } from '@/lib/blog/posts'

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
  excerpt: string
  image: string
  author: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  isPublished: boolean
}

export type BlogBulkAction = 'publish' | 'unpublish' | 'delete'

export type FetchBackstageBlogParams = {
  page?: number
  pageSize?: number
  status?: 'all' | 'published' | 'hidden'
  q?: string
  sort?: 'newest' | 'oldest'
}

function toPayload(payload: BlogPostFormValues) {
  return {
    title: payload.title.trim(),
    slug: payload.slug.trim().toLowerCase(),
    content: payload.content.trim(),
    excerpt: payload.excerpt.trim() || null,
    image: payload.image.trim() || null,
    author: payload.author.trim() || null,
    metaTitle: payload.metaTitle.trim() || null,
    metaDescription: payload.metaDescription.trim() || null,
    metaKeywords: payload.metaKeywords.trim() || null,
    isPublished: payload.isPublished,
  }
}

export async function fetchBackstageBlogPosts(
  params: FetchBackstageBlogParams = {},
): Promise<BlogPostsPageResult> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 1))
  search.set('pageSize', String(params.pageSize ?? 20))
  if (params.status && params.status !== 'all') search.set('status', params.status)
  if (params.q?.trim()) search.set('q', params.q.trim())
  if (params.sort) search.set('sort', params.sort)

  const res = await fetch(`/api/backstage/blog?${search.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBackstageBlogPostById(id: string): Promise<BlogPostDetail> {
  const res = await fetch(`/api/backstage/blog/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  })
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
    body: JSON.stringify(toPayload(payload)),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateBackstageBlogPost(
  id: string,
  payload: BlogPostFormValues,
): Promise<BlogPostDetail> {
  const res = await fetch(`/api/backstage/blog/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(payload)),
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

export async function bulkBackstageBlogPosts(
  ids: string[],
  action: BlogBulkAction,
): Promise<{ ok: true; affected: number }> {
  const res = await fetch('/api/backstage/blog/bulk', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, action }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type { BlogPostListItem }
