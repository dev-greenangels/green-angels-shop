import { jsPDF } from 'jspdf'

import {
  DELIVERY_METHOD_BACKSTAGE_LABELS,
  PAYMENT_METHOD_BACKSTAGE_LABELS,
} from '@/lib/checkout/methods'
import type { PublicOrderConfirmation } from '@/lib/orders/fetch-order-confirmation'
import { formatPaymentPurpose } from '@/lib/settings/cart-checkout.normalize'
import type { CartCheckoutSettings } from '@/lib/settings/types'

function formatPersonName(last: string, first: string, patronymic?: string | null) {
  return [last, first, patronymic?.trim()].filter(Boolean).join(' ')
}

function formatDeliveryAddress(order: PublicOrderConfirmation): string {
  if (order.deliveryMethod === 'pickup') return 'Самовивіз'
  if (order.deliveryMethod === 'nova-poshta-branch') {
    return [order.deliveryCity, order.deliveryBranch].filter(Boolean).join(', ')
  }
  if (order.deliveryMethod === 'nova-poshta-address') {
    return [
      order.deliveryCity,
      order.deliveryStreet,
      order.deliveryHouseNumber ? `буд. ${order.deliveryHouseNumber}` : null,
    ]
      .filter(Boolean)
      .join(', ')
  }
  return [order.deliveryCity, order.deliveryBranch, order.deliveryStreet].filter(Boolean).join(', ')
}

function isBankTransfer(paymentMethod: string) {
  return paymentMethod === 'bank-transfer' || paymentMethod === 'bank-transfer-legal'
}

function hasBankDetails(bank: CartCheckoutSettings['bankDetails']) {
  return Boolean(
    bank.organizationName || bank.edrpou || bank.iban || bank.bankName || bank.mfo,
  )
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('uk-UA', {
    style: 'currency',
    currency: 'UAH',
    minimumFractionDigits: 2,
  }).format(amount)
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function loadFontBase64(path: string): Promise<string> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Не вдалося завантажити шрифт: ${path}`)
  return arrayBufferToBase64(await res.arrayBuffer())
}

type PdfCursor = {
  doc: jsPDF
  y: number
  margin: number
  pageWidth: number
  pageHeight: number
  contentWidth: number
}

function ensureSpace(ctx: PdfCursor, needed: number) {
  if (ctx.y + needed <= ctx.pageHeight - ctx.margin) return
  ctx.doc.addPage()
  ctx.y = ctx.margin
}

function writeText(
  ctx: PdfCursor,
  text: string,
  options?: { bold?: boolean; size?: number; gap?: number },
) {
  const size = options?.size ?? 11
  const gap = options?.gap ?? 5
  ctx.doc.setFont('DejaVuSans', options?.bold ? 'bold' : 'normal')
  ctx.doc.setFontSize(size)
  const lines = ctx.doc.splitTextToSize(text, ctx.contentWidth) as string[]
  const lineHeight = size * 0.45
  ensureSpace(ctx, lines.length * lineHeight + gap)
  ctx.doc.text(lines, ctx.margin, ctx.y)
  ctx.y += lines.length * lineHeight + gap
}

function writeKeyValue(ctx: PdfCursor, label: string, value: string) {
  writeText(ctx, `${label}: ${value}`, { size: 10, gap: 3.5 })
}

export async function downloadOrderConfirmationPdf(
  orders: PublicOrderConfirmation[],
  cart: CartCheckoutSettings,
): Promise<void> {
  if (!orders.length) {
    throw new Error('Немає даних замовлення')
  }

  const [regularFont, boldFont] = await Promise.all([
    loadFontBase64('/fonts/DejaVuSans.ttf'),
    loadFontBase64('/fonts/DejaVuSans-Bold.ttf'),
  ])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  doc.addFileToVFS('DejaVuSans.ttf', regularFont)
  doc.addFileToVFS('DejaVuSans-Bold.ttf', boldFont)
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal')
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold')

  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const ctx: PdfCursor = {
    doc,
    y: margin,
    margin,
    pageWidth,
    pageHeight,
    contentWidth: pageWidth - margin * 2,
  }

  writeText(ctx, 'Підтвердження замовлення', { bold: true, size: 18, gap: 8 })
  writeText(ctx, `Дата формування: ${new Date().toLocaleString('uk-UA')}`, {
    size: 9,
    gap: 8,
  })

  for (const order of orders) {
    ensureSpace(ctx, 28)
    writeText(ctx, `Замовлення ${order.orderNumber}`, { bold: true, size: 14, gap: 5 })

    writeKeyValue(
      ctx,
      'Отримувач',
      `${formatPersonName(order.receiverLastName, order.receiverFirstName, order.receiverPatronymic)} · ${order.receiverPhone}`,
    )
    writeKeyValue(
      ctx,
      'Доставка',
      `${
        DELIVERY_METHOD_BACKSTAGE_LABELS[
          order.deliveryMethod as keyof typeof DELIVERY_METHOD_BACKSTAGE_LABELS
        ] ?? order.deliveryMethod
      } — ${formatDeliveryAddress(order)}`,
    )
    writeKeyValue(
      ctx,
      'Оплата',
      PAYMENT_METHOD_BACKSTAGE_LABELS[
        order.paymentMethod as keyof typeof PAYMENT_METHOD_BACKSTAGE_LABELS
      ] ?? order.paymentMethod,
    )

    ctx.y += 2
    writeText(ctx, 'Товари', { bold: true, size: 11, gap: 4 })

    for (const item of order.items) {
      const title = `${item.productName}${item.variantLabel ? ` · ${item.variantLabel}` : ''}`
      const line = `${title}  × ${item.quantity}  —  ${formatMoney(item.lineTotal)}`
      writeText(ctx, line, { size: 10, gap: 3 })
    }

    ctx.y += 2
    if (order.productsSubtotal != null) {
      writeKeyValue(ctx, 'Товари', formatMoney(order.productsSubtotal))
    }
    if (order.packagingAmount != null && order.packagingAmount > 0) {
      writeKeyValue(ctx, 'Пакування', formatMoney(order.packagingAmount))
    }
    if (order.deliveryAmount != null && order.deliveryAmount > 0) {
      writeKeyValue(ctx, 'Доставка', formatMoney(order.deliveryAmount))
    }
    writeText(ctx, `Разом: ${formatMoney(order.totalAmount)}`, {
      bold: true,
      size: 12,
      gap: 8,
    })
  }

  if (orders.some((order) => isBankTransfer(order.paymentMethod)) && hasBankDetails(cart.bankDetails)) {
    const bank = cart.bankDetails
    const purpose = formatPaymentPurpose(
      cart.paymentPurposeTemplate,
      orders.map((order) => order.orderNumber),
    )

    ensureSpace(ctx, 40)
    writeText(ctx, 'Реквізити для оплати', { bold: true, size: 14, gap: 5 })
    if (bank.organizationName) writeKeyValue(ctx, 'Одержувач', bank.organizationName)
    if (bank.edrpou) writeKeyValue(ctx, 'ЄДРПОУ / ІПН', bank.edrpou)
    if (bank.iban) writeKeyValue(ctx, 'IBAN', bank.iban)
    if (bank.bankName) writeKeyValue(ctx, 'Банк', bank.bankName)
    if (bank.mfo) writeKeyValue(ctx, 'МФО', bank.mfo)
    if (bank.legalAddress) writeKeyValue(ctx, 'Юридична адреса', bank.legalAddress)
    if (bank.taxStatus) writeKeyValue(ctx, 'Податковий статус', bank.taxStatus)
    writeKeyValue(ctx, 'Призначення платежу', purpose)
  }

  const filename =
    orders.length === 1
      ? `zamovlennya-${orders[0].orderNumber}.pdf`
      : `zamovlennya-${orders.map((o) => o.orderNumber).join('-')}.pdf`

  doc.save(filename)
}
