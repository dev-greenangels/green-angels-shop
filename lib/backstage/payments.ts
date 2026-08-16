export type PaymentProvidersStatus = {
  monopay: boolean
  stripe: boolean
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchPaymentProvidersStatus(): Promise<PaymentProvidersStatus> {
  const res = await fetch('/api/backstage/payments/providers/status', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
