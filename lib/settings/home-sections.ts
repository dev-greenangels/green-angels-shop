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
