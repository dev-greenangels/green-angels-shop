/**
 * Shop-local disk writes are not used. Catalog/blog/category media goes
 * Nest `CatalogMediaService` → MEDIA_DRIVER (R2 in production).
 */
function denyLocalMediaWrite(): never {
  throw new Error(
    'Catalog media writes go through Nest CatalogMediaService (MEDIA_DRIVER). Do not write to the shop UPLOAD_ROOT.',
  )
}

export async function storeCategoryImage(
  _buffer: Buffer,
  _options?: { categoryId?: string },
): Promise<{ url: string; thumbUrl: string }> {
  denyLocalMediaWrite()
}

export async function storeProductImage(
  _buffer: Buffer,
  _options?: { productId?: string },
): Promise<{ url: string; thumbUrl: string; imageId: string }> {
  denyLocalMediaWrite()
}

export async function storeBlogImage(
  _buffer: Buffer,
  _options?: { blogPostId?: string },
): Promise<{ url: string; thumbUrl: string }> {
  denyLocalMediaWrite()
}
