export type VariantPhoto = {
  id: string
  url: string
  alt: string
}

/** Тимчасові зображення для галереї варіанту — замінити на API пізніше. */
export function getMockVariantPhotos(variantId: string, variantLabel: string): VariantPhoto[] {
  const seed = variantId.replace(/\W/g, '').slice(0, 10) || 'variant'

  return Array.from({ length: 5 }, (_, index) => ({
    id: `${variantId}-${index}`,
    url: `https://picsum.photos/seed/${seed}${index}/1200/900`,
    alt: `${variantLabel} — фото ${index + 1}`,
  }))
}
