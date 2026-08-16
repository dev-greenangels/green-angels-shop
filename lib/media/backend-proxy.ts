import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export async function proxyBackendForm(
  path: string,
  request: Request,
  formData: FormData,
): Promise<Response> {
  const res = await fetchBackend(path, {
    request,
    method: 'POST',
    body: formData,
  })
  const data = await readBackendJson(res)
  return Response.json(data, { status: res.status })
}

export async function postBackendJson<T>(
  path: string,
  request: Request,
  body: unknown,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetchBackend(path, {
    request,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await readBackendJson(res)) as T
  return { ok: res.ok, status: res.status, data }
}

export type ProductImageInput = {
  url: string
  isMain?: boolean
}

export async function finalizeProductImagesOnBackend(
  request: Request,
  productId: string,
  images: ProductImageInput[],
): Promise<{ ok: boolean; status: number; images?: ProductImageInput[]; error?: unknown }> {
  const result = await postBackendJson<{ images?: ProductImageInput[]; error?: unknown; message?: unknown }>(
    '/backstage/media/products/finalize',
    request,
    { productId, images },
  )
  if (!result.ok) {
    return { ok: false, status: result.status, error: result.data }
  }
  return { ok: true, status: result.status, images: result.data.images ?? images }
}

export async function finalizeCategoryImageOnBackend(
  request: Request,
  categoryId: string,
  imageUrl: string | null | undefined,
): Promise<{ ok: boolean; status: number; image?: string | null; error?: unknown }> {
  const result = await postBackendJson<{ image?: string | null }>(
    '/backstage/media/categories/finalize',
    request,
    { categoryId, imageUrl: imageUrl ?? null },
  )
  if (!result.ok) {
    return { ok: false, status: result.status, error: result.data }
  }
  return { ok: true, status: result.status, image: result.data.image ?? null }
}

export async function deleteCategoryImagesOnBackend(
  request: Request,
  categoryId: string,
): Promise<{ ok: boolean; status: number; error?: unknown }> {
  const result = await postBackendJson<{ ok?: boolean }>(
    '/backstage/media/categories/delete',
    request,
    { categoryId },
  )
  if (!result.ok) {
    return { ok: false, status: result.status, error: result.data }
  }
  return { ok: true, status: result.status }
}

