import { getBackendApiUrl } from '@/lib/api/backend-url'
import { ProductNotFoundError } from '@/lib/api/fetch-result'
import { formatDateTime } from '@/lib/i18n/format-datetime'

export type BlogPostListItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  image: string | null
  author: string
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export type BlogPostDetail = BlogPostListItem & {
  content: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
}

export type BlogPostsPageResult = {
  items: BlogPostListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const BLOG_PAGE_SIZE = 12

export type FetchBlogPostsParams = {
  page?: number
  pageSize?: number
  sort?: 'newest' | 'oldest'
}

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

export function parseBlogPostsPage(data: unknown): BlogPostsPageResult {
  if (Array.isArray(data)) {
    const items = data as BlogPostListItem[]
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length || BLOG_PAGE_SIZE,
      totalPages: 1,
    }
  }

  const page = data as Partial<BlogPostsPageResult>
  const items = Array.isArray(page.items) ? page.items : []
  const total = typeof page.total === 'number' ? page.total : items.length
  const currentPage = typeof page.page === 'number' && page.page > 0 ? page.page : 1
  const pageSize =
    typeof page.pageSize === 'number' && page.pageSize > 0 ? page.pageSize : BLOG_PAGE_SIZE
  const totalPages =
    typeof page.totalPages === 'number' && page.totalPages > 0
      ? page.totalPages
      : Math.max(1, Math.ceil(total / pageSize))

  return { items, total, page: currentPage, pageSize, totalPages }
}

export async function fetchBlogPosts(
  params: FetchBlogPostsParams = {},
): Promise<BlogPostsPageResult> {
  const search = new URLSearchParams()
  search.set('page', String(params.page ?? 1))
  search.set('pageSize', String(params.pageSize ?? BLOG_PAGE_SIZE))
  search.set('sort', params.sort ?? 'newest')

  const res = await fetch(`${getBackendApiUrl()}/blog?${search.toString()}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return parseBlogPostsPage(await res.json())
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetail> {
  const res = await fetch(`${getBackendApiUrl()}/blog/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  })
  if (res.status === 404) throw new ProductNotFoundError()
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function formatBlogDate(value: string, locale: string = 'uk'): string {
  return formatDateTime(value, locale, 'dateLong')
}

export function slugifyBlogTitle(title: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'h',
    ґ: 'g',
    д: 'd',
    е: 'e',
    є: 'ye',
    ж: 'zh',
    з: 'z',
    и: 'y',
    і: 'i',
    ї: 'yi',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ь: '',
    ю: 'yu',
    я: 'ya',
    ы: 'y',
    э: 'e',
    ё: 'yo',
    ъ: '',
  }

  const slug = title
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)

  return slug || 'post'
}

/** Ініціали для аватар-плейсхолдера автора. */
export function blogAuthorInitials(author: string): string {
  const parts = author.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'ЗЯ'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function isEmptyHtmlContent(html: string): boolean {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .length === 0
}
