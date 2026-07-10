import { randomUUID } from 'crypto'
import { mkdir, rename, rm } from 'fs/promises'
import path from 'path'

import { getUploadRoot, uploadUrlToAbsolutePath } from '@/lib/media/config'
import {
  buildCategoryImageUrl,
  buildProductImageUrl,
  CATEGORY_COVER,
  CATEGORY_THUMB,
  isPendingCategoryPath,
  isPendingProductPath,
  PRODUCT_MAIN,
  PRODUCT_THUMB,
} from '@/lib/media/paths'

export type ProductImageInput = {
  url: string
  isMain?: boolean
}

async function moveDirContents(fromDir: string, toDir: string) {
  await mkdir(toDir, { recursive: true })
  const entries = await import('fs/promises').then((fs) => fs.readdir(fromDir))
  await Promise.all(
    entries.map((name) => rename(path.join(fromDir, name), path.join(toDir, name))),
  )
  await rm(fromDir, { recursive: true, force: true })
}

/** Видаляє всі збережені файли зображення категорії (усі ревізії та legacy cover.webp). */
export async function clearCategoryImageStorage(categoryId: string) {
  const trimmed = categoryId.trim()
  if (!trimmed) return

  try {
    await rm(path.join(getUploadRoot(), 'categories', trimmed), { recursive: true, force: true })
  } catch {
    // ignore missing dir
  }
}

export async function finalizeCategoryImageUrl(
  imageUrl: string | null | undefined,
  categoryId: string,
): Promise<string | null> {
  const trimmed = imageUrl?.trim()
  if (!trimmed) return null
  if (!isPendingCategoryPath(trimmed)) return trimmed

  const revision = Date.now()
  await clearCategoryImageStorage(categoryId)

  const pendingDir = uploadUrlToAbsolutePath(trimmed.replace(`/${CATEGORY_COVER}`, ''))
  const targetDir = path.join(getUploadRoot(), 'categories', categoryId, `v${revision}`)
  await moveDirContents(pendingDir, targetDir)
  return buildCategoryImageUrl(categoryId, revision)
}

export async function finalizeProductImages(
  images: ProductImageInput[] | undefined,
  productId: string,
): Promise<ProductImageInput[] | undefined> {
  if (!images?.length) return images

  const finalized: ProductImageInput[] = []
  for (const image of images) {
    const trimmed = image.url.trim()
    if (!isPendingProductPath(trimmed)) {
      finalized.push(image)
      continue
    }

    const parts = trimmed.split('/')
    const imageId = parts[parts.length - 2] ?? randomUUID()
    const pendingDir = uploadUrlToAbsolutePath(
      trimmed.replace(`/${PRODUCT_MAIN}`, ''),
    )
    const targetDir = path.join(getUploadRoot(), 'products', productId, imageId)
    await moveDirContents(pendingDir, targetDir)
    finalized.push({
      ...image,
      url: buildProductImageUrl(productId, imageId),
    })
  }

  return finalized
}

/** Видаляє порожні pending-папки після переносу (best-effort). */
export async function cleanupEmptyPendingParents(url: string) {
  if (!isPendingProductPath(url) && !isPendingCategoryPath(url)) return

  try {
    const abs = uploadUrlToAbsolutePath(url.replace(/\/(main|cover)\.webp$/, ''))
    const parent = path.dirname(abs)
    const grandparent = path.dirname(parent)
    await rm(parent, { recursive: true, force: true })
    const remaining = await import('fs/promises').then((fs) => fs.readdir(grandparent))
    if (remaining.length === 0) {
      await rm(grandparent, { recursive: true, force: true })
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function deleteProductImageFiles(url: string) {
  if (!url.includes('/uploads/products/')) return
  try {
    const dir = uploadUrlToAbsolutePath(url.replace(`/${PRODUCT_MAIN}`, ''))
    await rm(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

export async function deleteCategoryImageFiles(url: string) {
  if (!url.includes('/uploads/categories/')) return

  const match = url.match(/\/uploads\/categories\/([a-f0-9-]{36})/i)
  if (match?.[1]) {
    await clearCategoryImageStorage(match[1])
    return
  }

  try {
    const dir = uploadUrlToAbsolutePath(url.replace(`/${CATEGORY_COVER}`, ''))
    await rm(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}
