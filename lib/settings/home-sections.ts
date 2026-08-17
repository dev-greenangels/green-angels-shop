export const HOME_SECTION_KEYS = [
  'categories',
  'newArrivals',
  'bestsellers',
  'lowStock',
  'whyUs',
  'nurseryGallery',
  'freshPlantPhotos',
  'reviews',
  'recentlyViewed',
] as const

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number]

export const HOME_SECTION_LABELS: Record<HomeSectionKey, string> = {
  categories: 'Категорії',
  newArrivals: 'Новинки',
  bestsellers: 'Популярний вибір',
  lowStock: 'Закінчується',
  whyUs: 'Чому обирають нас',
  nurseryGallery: 'Галерея розсадника',
  freshPlantPhotos: 'Актуальні фото рослин',
  reviews: 'Відгуки',
  recentlyViewed: 'Останні переглянуті',
}

export function normalizeHomeSectionOrder(order: HomeSectionKey[] | undefined): HomeSectionKey[] {
  const defaultOrder = [...HOME_SECTION_KEYS]
  const source = Array.isArray(order) ? order : defaultOrder
  const valid = source.filter((key): key is HomeSectionKey => HOME_SECTION_KEYS.includes(key))
  const missing = defaultOrder.filter((key) => !valid.includes(key))
  return [...valid, ...missing]
}

export function normalizeHomeSectionHidden(hidden: HomeSectionKey[] | undefined): HomeSectionKey[] {
  if (!Array.isArray(hidden)) return []
  const seen = new Set<HomeSectionKey>()
  const result: HomeSectionKey[] = []
  for (const key of hidden) {
    if (!HOME_SECTION_KEYS.includes(key) || seen.has(key)) continue
    seen.add(key)
    result.push(key)
  }
  return result
}

export function isHomeSectionHidden(hidden: HomeSectionKey[], key: HomeSectionKey): boolean {
  return hidden.includes(key)
}

export function setHomeSectionHidden(
  hidden: HomeSectionKey[],
  key: HomeSectionKey,
  hide: boolean,
): HomeSectionKey[] {
  const current = new Set(normalizeHomeSectionHidden(hidden))
  if (hide) current.add(key)
  else current.delete(key)
  return HOME_SECTION_KEYS.filter((item) => current.has(item))
}

export function resolveHomeSectionHidden(input: {
  sectionHidden?: HomeSectionKey[]
  reviewsEnabled?: boolean
  freshPlantPhotosEnabled?: boolean
}): HomeSectionKey[] {
  const hidden = new Set(normalizeHomeSectionHidden(input.sectionHidden))
  if (input.reviewsEnabled === false) hidden.add('reviews')
  if (input.freshPlantPhotosEnabled === false) hidden.add('freshPlantPhotos')
  return HOME_SECTION_KEYS.filter((key) => hidden.has(key))
}
