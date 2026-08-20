export async function downloadOrderConfirmationPdf(
  orders: Array<{ orderNumber: string }>,
  confirmationToken?: string,
): Promise<void> {
  if (!orders.length) {
    throw new Error('Немає даних замовлення')
  }

  const token = confirmationToken?.trim() ?? ''
  const headers: Record<string, string> = {}
  if (token) {
    headers['X-Order-Confirmation-Token'] = token
  }

  const blobs: Blob[] = []
  for (const order of orders) {
    const res = await fetch(`/api/orders/confirmation/${encodeURIComponent(order.orderNumber)}/pdf`, {
      cache: 'no-store',
      credentials: 'include',
      headers,
    })
    if (!res.ok) {
      throw new Error('Не вдалося завантажити PDF замовлення.')
    }
    blobs.push(await res.blob())
  }

  const filename =
    orders.length === 1
      ? `order-${orders[0].orderNumber.replace(/[^\w-]+/g, '-')}.pdf`
      : `orders-${orders.map((o) => o.orderNumber.replace(/[^\w-]+/g, '-')).join('-')}.pdf`

  const blob = blobs.length === 1 ? blobs[0] : new Blob(blobs, { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
