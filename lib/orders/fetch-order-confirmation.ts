export type PublicOrderConfirmationItem = {
  id: string
  quantity: number
  priceAtPurchase: number
  lineTotal: number
  productName: string
  productSlug: string
  variantLabel: string | null
}

export type PublicOrderConfirmation = {
  id: string
  orderNumber: string
  status: string
  currency: string
  createdAt: string
  totalAmount: number
  productsSubtotal: number | null
  deliveryAmount: number | null
  packagingAmount: number | null
  taxAmount: number | null
  customerFirstName: string
  customerLastName: string
  customerPatronymic: string | null
  customerPhone: string
  customerEmail: string | null
  receiverFirstName: string
  receiverLastName: string
  receiverPatronymic: string | null
  receiverPhone: string
  deliveryMethod: string
  deliveryCity: string | null
  deliveryBranch: string | null
  deliveryStreet: string | null
  deliveryHouseNumber: string | null
  paymentMethod: string
  comment: string | null
  items: PublicOrderConfirmationItem[]
}

export async function fetchOrderConfirmation(
  orderNumber: string,
): Promise<PublicOrderConfirmation | null> {
  const res = await fetch(`/api/orders/confirmation/${encodeURIComponent(orderNumber)}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  return (await res.json()) as PublicOrderConfirmation
}
