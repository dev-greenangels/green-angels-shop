/** Градація ціни: від minQuantity шт. — pricePerUnit за одиницю */
export interface PriceTier {
  minQuantity: number
  pricePerUnit: number
}

/** Атрибут / характеристика для блоку на сторінці товару */
export interface ProductDisplayCharacteristic {
  id: string
  slug: string
  name: string
  icon: string | null
  unit: string | null
  valueType: string
  displayValue: string
  colorHex?: string | null
  colorDisplayMode?: 'TEXT' | 'SWATCH' | 'BOTH' | null
  sortOrder: number
}

/** Варіант товару (розмір / маркування) */
export interface ProductVariant {
  id: string
  /** Маркування, напр. C2, C5, СВРБ, ТГ22-24… */
  label: string
  /** EAN / штрихкод варіанту — Fresh Photos (UA) */
  ean?: string | null
  /** SKU варіанту — Fresh Photos (SK, коли EAN немає) */
  sku?: string | null
  stock: number
  /** Орієнтовна дата відвантаження (напр. "25.05.2026"); дозволяє бронювання навіть при stock 0 */
  availableFrom?: string
  basePrice: number
  priceTiers: PriceTier[]
  /** Символ одиниці продажу (шт, кг…) */
  salesUnitSymbol?: string | null
  /** Показувати кнопку «Свіжі фото» лише якщо true */
  freshPhotos?: boolean
  /** Атрибути з showOnProductPage для цього варіанта */
  displayAttributes?: ProductDisplayCharacteristic[]
}

export interface Plant {
  id: string
  name: string
  latinName: string
  slug: string
  categoryId?: string
  category: string
  price: number
  sku: string
  images: string[]
  description: string
  shortDescription: string
  stock: number
  /** Розміри / варіанти з цінами та наявністю; якщо порожньо — використовується containerSize + price */
  variants?: ProductVariant[]
  containerSize?: 'P9' | 'C2' | 'C3' | 'C5' | 'C7' | 'C10' | 'C20' | 'C30' | string
  height: string
  width?: string
  sunRequirement: 'full-sun' | 'partial-shade' | 'full-shade' | string
  soilType: 'acidic' | 'neutral' | 'alkaline' | 'any' | string
  hardinessZone: string
  wateringNeeds: 'low' | 'moderate' | 'high' | string
  plantingInstructions?: string
  lightRequirements?: string
  careInstructions?: string
  isNew?: boolean
  isFeatured?: boolean
  maxDiscountPercent?: number | null
  createdAt: string
  displayCharacteristics?: ProductDisplayCharacteristic[]
  metaTitle?: string | null
  metaDesc?: string | null
}

export interface CartItem {
  plant: Plant
  quantity: number
  /** id варіанту з ProductVariant */
  variantId?: string
  variantLabel?: string
  /** Ціна за од. на момент додавання (з урахуванням градації) */
  unitPrice?: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  plantCount: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin'
  createdAt: string
}
