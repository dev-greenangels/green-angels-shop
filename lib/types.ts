/** Градація ціни: від minQuantity шт. — pricePerUnit за одиницю */
export interface PriceTier {
  minQuantity: number
  pricePerUnit: number
}

/** Варіант товару (розмір / маркування) */
export interface ProductVariant {
  id: string
  /** Маркування, напр. C2, C5, СВРБ, ТГ22-24… */
  label: string
  stock: number
  /** Орієнтовна дата відвантаження (напр. "25.05.2026"); дозволяє бронювання навіть при stock 0 */
  availableFrom?: string
  basePrice: number
  priceTiers: PriceTier[]
  /** Показувати кнопку «Свіжі фото» лише якщо true */
  freshPhotos?: boolean
}

export interface Plant {
  id: string
  name: string
  latinName: string
  slug: string
  category: 'conifers' | 'deciduous' | 'perennials' | 'shrubs'
  price: number
  originalPrice?: number
  sku: string
  images: string[]
  description: string
  shortDescription: string
  stock: number
  /** Розміри / варіанти з цінами та наявністю; якщо порожньо — використовується containerSize + price */
  variants?: ProductVariant[]
  containerSize: 'P9' | 'C2' | 'C3' | 'C5' | 'C7' | 'C10' | 'C20' | 'C30'
  height: string
  sunRequirement: 'full-sun' | 'partial-shade' | 'full-shade'
  soilType: 'acidic' | 'neutral' | 'alkaline' | 'any'
  hardinessZone: string
  wateringNeeds: 'low' | 'moderate' | 'high'
  plantingInstructions: string
  lightRequirements: string
  careInstructions: string
  isNew?: boolean
  isFeatured?: boolean
  createdAt: string
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

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  items: CartItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin'
  createdAt: string
}
