export type PrestaImportSettings = {
  productImageUrlTemplate: string
  blogImageUrlTemplate: string
  /** Шаблон URL фото відгуку. Плейсхолдери: {id_comment}, {id_image} */
  reviewImageUrlTemplate: string
}

export const DEFAULT_PRESTA_IMPORT_SETTINGS: PrestaImportSettings = {
  productImageUrlTemplate:
    'https://landshaft.info/{id_image}-thickbox_default/{link_rewrite}.jpg',
  blogImageUrlTemplate:
    'https://landshaft.info/upload/stblog/1/{id_blog}/{id_image}/{id_blog}{id_image}medium.jpg',
  reviewImageUrlTemplate:
    'https://landshaft.info/upload/productcomment/{id_comment}/{id_image}.jpg',
}

export function normalizePrestaImportSettings(raw: unknown): PrestaImportSettings {
  const value = raw && typeof raw === 'object' ? (raw as Partial<PrestaImportSettings>) : {}
  let blogImageUrlTemplate =
    typeof value.blogImageUrlTemplate === 'string' && value.blogImageUrlTemplate.trim()
      ? value.blogImageUrlTemplate.trim()
      : DEFAULT_PRESTA_IMPORT_SETTINGS.blogImageUrlTemplate

  if (blogImageUrlTemplate.includes('/modules/stblog/views/img/')) {
    blogImageUrlTemplate = DEFAULT_PRESTA_IMPORT_SETTINGS.blogImageUrlTemplate
  }

  const reviewImageUrlTemplate =
    typeof value.reviewImageUrlTemplate === 'string' && value.reviewImageUrlTemplate.trim()
      ? value.reviewImageUrlTemplate.trim()
      : DEFAULT_PRESTA_IMPORT_SETTINGS.reviewImageUrlTemplate

  return {
    productImageUrlTemplate:
      typeof value.productImageUrlTemplate === 'string' && value.productImageUrlTemplate.trim()
        ? value.productImageUrlTemplate.trim()
        : DEFAULT_PRESTA_IMPORT_SETTINGS.productImageUrlTemplate,
    blogImageUrlTemplate,
    reviewImageUrlTemplate,
  }
}
