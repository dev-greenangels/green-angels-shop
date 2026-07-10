import { getBackendApiUrl } from '@/lib/api/backend-url'
import { ProductNotFoundError } from '@/lib/api/fetch-result'

export type BlogPostListItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  image: string | null
  createdAt: string
  updatedAt: string
}

export type BlogPostDetail = BlogPostListItem & {
  content: string
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

export async function fetchBlogPosts(): Promise<BlogPostListItem[]> {
  const res = await fetch(`${getBackendApiUrl()}/blog`, { cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostDetail> {
  const res = await fetch(`${getBackendApiUrl()}/blog/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  })
  if (res.status === 404) throw new ProductNotFoundError()
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function slugifyBlogTitle(title: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'yo', ъ: '',
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

export function formatBlogDate(value: string): string {
  return new Date(value).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
