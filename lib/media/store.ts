import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import { getUploadRoot } from '@/lib/media/config'
import { clearCategoryImageStorage } from '@/lib/media/finalize'
import {
  buildCategoryImageUrl,
  buildCategoryPendingUrl,
  buildProductImageUrl,
  buildProductPendingUrl,
  CATEGORY_COVER,
  CATEGORY_THUMB,
  PRODUCT_MAIN,
  PRODUCT_THUMB,
} from '@/lib/media/paths'
import { processCategoryImage, processProductImage } from '@/lib/media/process'

async function writePair(
  dir: string,
  mainName: string,
  thumbName: string,
  main: Buffer,
  thumb: Buffer,
) {
  await mkdir(dir, { recursive: true })
  await Promise.all([
    writeFile(path.join(dir, mainName), main),
    writeFile(path.join(dir, thumbName), thumb),
  ])
}

export async function storeCategoryImage(
  buffer: Buffer,
  options?: { categoryId?: string },
): Promise<{ url: string; thumbUrl: string }> {
  const { main, thumb } = await processCategoryImage(buffer)
  const entityId = options?.categoryId?.trim() || randomUUID()
  const isPending = !options?.categoryId?.trim()

  let relativeDir: string
  let url: string

  if (isPending) {
    relativeDir = path.join('categories', 'pending', entityId)
    url = buildCategoryPendingUrl(entityId)
  } else {
    const revision = Date.now()
    await clearCategoryImageStorage(entityId)
    relativeDir = path.join('categories', entityId, `v${revision}`)
    url = buildCategoryImageUrl(entityId, revision)
  }

  const dir = path.join(getUploadRoot(), relativeDir)
  await writePair(dir, CATEGORY_COVER, CATEGORY_THUMB, main, thumb)

  return { url, thumbUrl: url.replace(`/${CATEGORY_COVER}`, `/${CATEGORY_THUMB}`) }
}

export async function storeProductImage(
  buffer: Buffer,
  options?: { productId?: string },
): Promise<{ url: string; thumbUrl: string; imageId: string }> {
  const { main, thumb } = await processProductImage(buffer)
  const imageId = randomUUID()
  const pendingId = randomUUID()
  const isPending = !options?.productId?.trim()
  const productSegment = isPending ? `pending/${pendingId}` : options!.productId!.trim()

  const relativeDir = path.join('products', productSegment, imageId)
  const dir = path.join(getUploadRoot(), relativeDir)
  await writePair(dir, PRODUCT_MAIN, PRODUCT_THUMB, main, thumb)

  const url = isPending
    ? buildProductPendingUrl(pendingId, imageId)
    : buildProductImageUrl(options!.productId!.trim(), imageId)

  return { url, thumbUrl: url.replace(`/${PRODUCT_MAIN}`, `/${PRODUCT_THUMB}`), imageId }
}
