import type { CartItem, Plant } from '@/lib/types'

export type ServerCartLine = {
  productVariantId: string
  quantity: number
  productId: string
  productSlug: string
  productName: string
  latinName?: string | null
  variantLabel: string | null
}

export type CartMergePreview = {
  hasConflict: boolean
  guestItems: ServerCartLine[]
  userItems: ServerCartLine[]
}

export type CartMergeStrategy = 'merge' | 'keep_guest' | 'keep_user' | 'clear'

export const CART_ABANDONED_THRESHOLD_MS = 2 * 60 * 60 * 1000

export type CartActivityState =
  | 'CART_ONLY'
  | 'CHECKOUT_ACTIVE'
  | 'CART_ABANDONED'
  | 'CHECKOUT_ABANDONED'

export type CheckoutDraftV1 = {
  v: 1
  locale?: string
  countryCode?: 'sk' | 'hu' | 'at'
  buyerType?: 'individual' | 'company'
  vatCountryCode?: string
  companyVatId?: string

  firstName?: string
  lastName?: string
  patronymic?: string
  email?: string
  phone?: string

  deliveryPhone?: string
  isOtherRecipient?: boolean
  recipientFirstName?: string
  recipientLastName?: string
  recipientPatronymic?: string
  recipientPhone?: string
  recipientCompanyName?: string

  deliveryMethod?: string
  deliveryCountryCode?: string
  city?: string
  cityLabel?: string
  postOffice?: string
  postOfficeLabel?: string
  packetaPickupKind?: '' | 'branch' | 'box' | 'carrier'
  packetaCarrierId?: number | null
  street?: string
  streetLabel?: string
  houseNumber?: string
  postalCode?: string

  billingFirstName?: string
  billingLastName?: string
  /** Courier delivery address mirrors billing while true. */
  deliveryAddressSameAsBilling?: boolean
  billingStreet?: string
  billingHouseNumber?: string
  billingCity?: string
  billingPostalCode?: string
  billingCountryCode?: string

  paymentMethod?: string
  companyEdrpou?: string
  companyLegalName?: string
  companyDic?: string
  companyStreet?: string
  companyCity?: string
  companyPostalCode?: string

  preferredShipDate?: string
  preferredShipDateImmediate?: string
  shipmentSplitMode?: 'together' | 'split'
  comment?: string
  promoCodes?: string[]
}

export type BackstageCartListItem = {
  id: string
  kind: 'guest' | 'user'
  state: CartActivityState
  activityBucket: 'active' | 'abandoned'
  updatedAt: string
  createdAt: string
  checkoutStartedAt: string | null
  ageMs: number
  itemCount: number
  totalQuantity: number
  productsSubtotal: number
  currency: string
  productsSubtotalBasis: 'current_retail'
  guestSessionId: string | null
  user: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
  } | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  locale: string | null
  siteCountryCode: string | null
  deliveryCountryCode: string | null
  billingCountryCode: string | null
  deliveryMethod: string | null
  paymentMethod: string | null
  hasCheckoutDraftPii: boolean
  piiCleanupAt: string | null
  piiStatus: 'none' | 'scheduled' | 'pending_cleanup'
  piiRetentionDays: number
  items: Array<{
    productVariantId: string
    quantity: number
    productId: string
    productSlug: string
    productName: string
    latinName?: string | null
    variantLabel: string | null
    imageUrl?: string | null
  }>
}

export type BackstageCartDetail = {
  id: string
  kind: 'guest' | 'user'
  state: CartActivityState | null
  activityBucket: 'active' | 'abandoned' | null
  updatedAt: string
  createdAt: string
  checkoutStartedAt: string | null
  ageMs: number
  guestSessionId: string | null
  user: BackstageCartListItem['user']
  accountCustomer: BackstageCartListItem['user']
  savedCheckoutData: {
    name: string | null
    email: string | null
    phone: string | null
    companyLegalName: string | null
    companyIco: string | null
    companyDic: string | null
    companyVatId: string | null
    vatCountryCode: string | null
    buyerType: string | null
  } | null
  customer: {
    name: string | null
    email: string | null
    phone: string | null
    companyLegalName: string | null
    companyIco: string | null
    companyDic: string | null
    companyVatId: string | null
    vatCountryCode: string | null
    buyerType: string | null
  }
  site: {
    countryCode: string | null
    locale: string | null
  }
  delivery: {
    countryCode: string | null
    method: string | null
    city: string | null
    street: string | null
    houseNumber: string | null
    postalCode: string | null
    postOffice: string | null
    postOfficeLabel: string | null
    packetaPickupKind: string | null
    packetaCarrierId: number | null
    isOtherRecipient: boolean
    recipientName: string | null
    recipientPhone: string | null
    recipientCompanyName: string | null
  }
  billing: {
    countryCode: string | null
    street: string | null
    houseNumber: string | null
    city: string | null
    postalCode: string | null
  }
  payment: {
    method: string | null
  }
  productsSubtotal: number
  currency: string
  productsSubtotalBasis: 'current_retail'
  hasCheckoutDraftPii: boolean
  piiCleanupAt: string | null
  piiStatus: 'none' | 'scheduled' | 'pending_cleanup'
  piiRetentionDays: number
  draft: CheckoutDraftV1 | null
  items: Array<{
    productVariantId: string
    quantity: number
    productId: string
    productSlug: string
    productName: string
    latinName?: string | null
    variantLabel: string | null
    imageUrl?: string | null
    unitPrice: number | null
    lineTotal: number | null
  }>
}

export type BackstageCartListResponse = {
  items: BackstageCartListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function serverLinesToCartItems(lines: ServerCartLine[]): CartItem[] {
  return lines.map((line) => ({
    plant: {
      id: line.productId,
      name: line.productName,
      latinName: line.latinName?.trim() || '',
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
