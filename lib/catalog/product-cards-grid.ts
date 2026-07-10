import {
  getProductCardsGridClassName,
  DEFAULT_PRODUCT_GRID_COLUMNS,
} from '@/lib/catalog/grid-columns'

/** @deprecated Використовуйте getProductCardsGridClassName() або useProductGridClassName(). */
export const productCardsGridClassName = getProductCardsGridClassName()

/** Сітка на повну ширину site-shell — ті самі налаштування, що й для каталогу. */
export const productCardsGridFullWidthClassName = getProductCardsGridClassName(
  DEFAULT_PRODUCT_GRID_COLUMNS,
)

export {
  getProductCardsGridClassName,
  getCategoryCardsGridClassName,
  DEFAULT_PRODUCT_GRID_COLUMNS,
  DEFAULT_CATEGORY_GRID_COLUMNS,
} from '@/lib/catalog/grid-columns'
