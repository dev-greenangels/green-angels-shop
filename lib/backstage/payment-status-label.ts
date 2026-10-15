/**
 * Backoffice payment status label. Missing / unpaid statuses must never read as paid.
 */
export function backstagePaymentStatusLabel(
  paymentStatus: string | null | undefined,
  labels: {
    unpaid: string
    paid: string
  },
): string {
  const raw = (paymentStatus ?? '').trim().toLowerCase()
  if (raw === 'success' || raw === 'paid') return labels.paid
  if (!raw || raw === 'unpaid' || raw === 'pending' || raw === 'created' || raw === 'cod') {
    return labels.unpaid
  }
  return paymentStatus!.trim()
}
