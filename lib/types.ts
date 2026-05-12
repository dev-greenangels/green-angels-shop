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
