import type { CartItem, Plant } from '@/lib/types'

export type ServerCartLine = {
  productVariantId: string
  quantity: number
  productId: string
  productSlug: string
  productName: string
  variantLabel: string | null
}

export type CartMergePreview = {
  hasConflict: boolean
  guestItems: ServerCartLine[]
  userItems: ServerCartLine[]
}

export type CartMergeStrategy = 'merge' | 'keep_guest' | 'keep_user' | 'clear'

export type BackstageCartListItem = {
  id: string
  kind: 'guest' | 'user'
  updatedAt: string
  createdAt: string
  itemCount: number
  totalQuantity: number
  guestSessionId: string | null
  user: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
  } | null
  items: ServerCartLine[]
}

export function serverLinesToCartItems(lines: ServerCartLine[]): CartItem[] {
  return lines.map((line) => ({
    plant: {
      id: line.productId,
      name: line.productName,
      latinName: '',
      slug: line.productSlug,
      category: '',
      price: 0,
      sku: '',
      images: [],
      description: '',
      shortDescription: '',
      stock: 0,
      height: '—',
      sunRequirement: 'full-sun',
      soilType: 'any',
      hardinessZone: '—',
      wateringNeeds: 'moderate',
      createdAt: new Date().toISOString(),
      variants: [
        {
          id: line.productVariantId,
          label: line.variantLabel?.trim() || '',
          stock: 0,
          basePrice: 0,
          priceTiers: [],
        },
      ],
    } satisfies Plant,
    quantity: line.quantity,
    variantId: line.productVariantId,
    variantLabel: line.variantLabel?.trim() || undefined,
  }))
}
