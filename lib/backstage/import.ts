export type ImportStatsResult = {
  type?: string
  created?: number
  updated?: number
  skipped?: number
  deleted?: number
  errors?: string[]
}

export type ImageJobStatus = {
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled'
  total: number
  processed: number
  imported: number
  updated?: number
  skipped: number
  /** Збої завантаження/обробки (окремо від already-imported «пропущено»). */
  failed?: number
  startedAt: string | null
  finishedAt: string | null
  cancelRequested: boolean
  currentImageId: string | null
  errors: Array<{ sourceId: string; error: string }>
}

export type ImportKind =
  | 'categories'
  | 'attributes'
  | 'features'
  | 'product-features'
  | 'products'
  | 'variants'
  | 'reviews'
  | 'review-images'
  | 'users'
  | 'orders'
  | 'order-lines'
  | 'blog'
  | 'product-images'
  | 'blog-images'

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string }
  if (!res.ok) {
    const msg =
      (data as { error?: string }).error ||
      (data as { message?: string }).message ||
      `Помилка імпорту (${res.status})`
    throw new Error(msg)
  }
  return data
}

export async function importCsvFile(
  kind: Exclude<ImportKind, 'product-images' | 'blog-images' | 'review-images'>,
  file: File,
) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`/api/backstage/import/csv/${kind}`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  return readJson<ImportStatsResult>(res)
}

export async function startProductImagesImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/backstage/import/product-images', {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  return readJson<ImageJobStatus>(res)
}

export async function fetchProductImagesStatus() {
  const res = await fetch('/api/backstage/import/product-images/status', {
    credentials: 'include',
    cache: 'no-store',
  })
  return readJson<ImageJobStatus>(res)
}

export async function cancelProductImagesImport() {
  const res = await fetch('/api/backstage/import/product-images/cancel', {
    method: 'POST',
    credentials: 'include',
  })
  return readJson<ImageJobStatus>(res)
}

export async function startBlogImagesImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/backstage/import/blog-images', {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  return readJson<ImageJobStatus>(res)
}

export async function fetchBlogImagesStatus() {
  const res = await fetch('/api/backstage/import/blog-images/status', {
    credentials: 'include',
    cache: 'no-store',
  })
  return readJson<ImageJobStatus>(res)
}

export async function cancelBlogImagesImport() {
  const res = await fetch('/api/backstage/import/blog-images/cancel', {
    method: 'POST',
    credentials: 'include',
  })
  return readJson<ImageJobStatus>(res)
}

export async function startReviewImagesImport(file: File) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/backstage/import/review-images', {
    method: 'POST',
    body: form,
    credentials: 'include',
  })
  return readJson<ImageJobStatus>(res)
}

export async function fetchReviewImagesStatus() {
  const res = await fetch('/api/backstage/import/review-images/status', {
    credentials: 'include',
    cache: 'no-store',
  })
  return readJson<ImageJobStatus>(res)
}

export async function cancelReviewImagesImport() {
  const res = await fetch('/api/backstage/import/review-images/cancel', {
    method: 'POST',
    credentials: 'include',
  })
  return readJson<ImageJobStatus>(res)
}
