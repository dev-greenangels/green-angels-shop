import { resolveBackstageThumbnailSrc } from '@/lib/category-image'

export type CategoryTreeNode = {
  id: string
  slug: string
  parentId: string | null
  legacyId: number | null
  isActive: boolean
  isCatalogRoot: boolean
  position: number
  name: string
  /** First filled translation — list/parent picker only, never the SK editor field. */
  fallbackName?: string | null
  nameHint?: { locale: string; text: string } | null
  descriptionHint?: { locale: string; text: string } | null
  footerDescriptionHint?: { locale: string; text: string } | null
  metaTitleHint?: { locale: string; text: string } | null
  metaDescHint?: { locale: string; text: string } | null
  description: string | null
  footerDescription: string | null
  image: string | null
  imageUrl: string
  metaTitle: string | null
  metaDesc: string | null
  productCount: number
  children: CategoryTreeNode[]
}

export type CategoryFlat = {
  id: string
  slug: string
  parentId: string | null
  legacyId: number | null
  isActive: boolean
  isCatalogRoot: boolean
  position: number
  name: string
  description: string | null
  footerDescription: string | null
  image: string | null
  imageUrl: string
  metaTitle: string | null
  metaDesc: string | null
  productCount: number
}

export type CategoryFormValues = {
  name: string
  slug: string
  parentId: string | null
  image: string | null
  description: string
  footerDescription: string
  metaTitle: string
  metaDesc: string
  isCatalogRoot: boolean
}

export type CategoryPatch = Partial<CategoryFormValues> & {
  isActive?: boolean
  position?: number
}

export function categoryLabel(
  node: Pick<CategoryTreeNode, 'name' | 'slug'> & { fallbackName?: string | null },
): string {
  return node.name.trim() || node.fallbackName?.trim() || node.slug
}

export function slugifyCategoryName(name: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'yo', ъ: '',
  }

  return name
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function flattenCategoryTree(nodes: CategoryTreeNode[]): CategoryFlat[] {
  const result: CategoryFlat[] = []
  const walk = (list: CategoryTreeNode[]) => {
    for (const node of list) {
      const { children, ...flat } = node
      result.push(flat)
      walk(children)
    }
  }
  walk(nodes)
  return result
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

function normalizeCategoryNode(node: CategoryTreeNode): CategoryTreeNode {
  const imageUrl = resolveBackstageThumbnailSrc(node.imageUrl || node.image)
  return {
    ...node,
    imageUrl,
    children: (node.children ?? []).map(normalizeCategoryNode),
  }
}

export async function fetchCategoryTree(
  locale: string,
  options?: { edit?: boolean },
): Promise<CategoryTreeNode[]> {
  const query = new URLSearchParams({ locale })
  if (options?.edit === false) query.set('edit', '0')
  const res = await fetch(`/api/backstage/categories?${query}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as CategoryTreeNode[]
  return data.map(normalizeCategoryNode)
}

export async function createCategory(
  payload: CategoryFormValues,
  locale: string,
): Promise<CategoryFlat> {
  const res = await fetch('/api/backstage/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      name: payload.name.trim(),
      slug: payload.slug.trim().toLowerCase(),
      parentId: payload.parentId || undefined,
      image: payload.image || undefined,
      description: payload.description.trim() || undefined,
      footerDescription: payload.footerDescription.trim() || undefined,
      metaTitle: payload.metaTitle.trim() || undefined,
      metaDesc: payload.metaDesc.trim() || undefined,
      isCatalogRoot: payload.isCatalogRoot,
      locale,
    }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function patchCategory(
  id: string,
  payload: CategoryPatch,
  locale?: string,
): Promise<CategoryFlat> {
  const body: Record<string, unknown> = {}
  if (locale) body.locale = locale

  if (payload.name !== undefined) {
    const name = payload.name.trim()
    if (name) body.name = name
  }
  if (payload.slug !== undefined) body.slug = payload.slug.trim().toLowerCase()
  if (payload.parentId !== undefined) body.parentId = payload.parentId
  if (payload.image !== undefined) body.image = payload.image
  if (payload.description !== undefined) body.description = payload.description.trim() || undefined
  if (payload.footerDescription !== undefined) {
    body.footerDescription = payload.footerDescription.trim() || undefined
  }
  if (payload.metaTitle !== undefined) body.metaTitle = payload.metaTitle.trim() || undefined
  if (payload.metaDesc !== undefined) body.metaDesc = payload.metaDesc.trim() || undefined
  if (payload.isCatalogRoot !== undefined) body.isCatalogRoot = payload.isCatalogRoot
  if (payload.isActive !== undefined) body.isActive = payload.isActive
  if (payload.position !== undefined) body.position = payload.position

  const res = await fetch(`/api/backstage/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateCategory(
  id: string,
  payload: CategoryFormValues,
  locale: string,
): Promise<CategoryFlat> {
  return patchCategory(
    id,
    {
      ...payload,
      image: payload.image,
    },
    locale,
  )
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<CategoryFlat> {
  return patchCategory(id, { isActive })
}

export type BulkActionResult = {
  succeeded: string[]
  failed: Array<{ id: string; error: string }>
}

async function runBulk(
  ids: string[],
  action: (id: string) => Promise<void>
): Promise<BulkActionResult> {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        await action(id)
        return { id, ok: true as const }
      } catch (err) {
        return {
          id,
          ok: false as const,
          error: err instanceof Error ? err.message : 'Помилка',
        }
      }
    })
  )

  return {
    succeeded: results.filter((r) => r.ok).map((r) => r.id),
    failed: results
      .filter((r): r is { id: string; ok: false; error: string } => !r.ok)
      .map((r) => ({ id: r.id, error: r.error })),
  }
}

export async function bulkSetCategoryActive(
  ids: string[],
  isActive: boolean
): Promise<BulkActionResult> {
  return runBulk(ids, async (id) => {
    await setCategoryActive(id, isActive)
  })
}

export async function bulkDeleteCategories(ids: string[]): Promise<BulkActionResult> {
  return runBulk(ids, async (id) => {
    await deleteCategory(id)
  })
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/backstage/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function reorderCategories(
  parentId: string | null,
  orderedIds: string[],
): Promise<void> {
  const res = await fetch('/api/backstage/categories/reorder', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ parentId, orderedIds }),
  })
  if (!res.ok) throw new Error(await parseError(res))
}
