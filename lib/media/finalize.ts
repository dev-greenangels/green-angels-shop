/**
 * Shop-local disk finalize/delete is not used. Nest CatalogMediaService
 * owns copy/delete via MEDIA_DRIVER.
 */
function denyLocalMediaWrite(): never {
  throw new Error(
    'Catalog media finalize/delete goes through Nest CatalogMediaService (MEDIA_DRIVER). Do not write to the shop UPLOAD_ROOT.',
  )
}

export type ProductImageInput = {
  url: string
  isMain?: boolean
}

export async function clearCategoryImageStorage(_categoryId: string): Promise<void> {
  denyLocalMediaWrite()
}

export async function finalizeCategoryImageUrl(
  _imageUrl: string | null | undefined,
  _categoryId: string,
): Promise<string | null> {
  denyLocalMediaWrite()
}

export async function finalizeProductImages(
  _images: ProductImageInput[] | undefined,
  _productId: string,
): Promise<ProductImageInput[] | undefined> {
  denyLocalMediaWrite()
}

export async function cleanupEmptyPendingParents(_url: string): Promise<void> {
  denyLocalMediaWrite()
}

export async function deleteProductImageFiles(_url: string): Promise<void> {
  denyLocalMediaWrite()
}

export async function deleteCategoryImageFiles(_url: string): Promise<void> {
  denyLocalMediaWrite()
}
