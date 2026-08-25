export type AvailabilityNotifyPayload = {
  plantId: string
  plantName: string
  name: string
  contactType: 'email' | 'phone'
  contact: string
  consent: boolean
  locale: string
}

export type AvailabilityNotifyDefaults = {
  submitFailed: string
  success: string
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const record = data as Record<string, unknown>
  if (typeof record.message === 'string') return record.message
  if (Array.isArray(record.message)) return record.message.join(', ')
  if (typeof record.error === 'string') return record.error
  return fallback
}

export type AvailabilityNotifyResult = {
  ok: true
  alreadySubscribed: boolean
  message: string
}

export async function submitAvailabilityNotify(
  payload: AvailabilityNotifyPayload,
  defaults?: AvailabilityNotifyDefaults,
): Promise<AvailabilityNotifyResult> {
  const submitFailed =
    defaults?.submitFailed ?? 'Could not submit. Please try again later.'
  const success =
    defaults?.success ??
    'Thank you! Your request is saved. We will notify you when the item is in stock.'

  const body = {
    productId: payload.plantId,
    name: payload.name,
    consent: payload.consent,
    locale: payload.locale,
    ...(payload.contactType === 'email'
      ? { email: payload.contact.trim() }
      : { phone: payload.contact.trim() }),
  }

  const res = await fetch('/api/stock-notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, submitFailed))
  }

  const record = data as {
    alreadySubscribed?: boolean
    message?: string
  }

  return {
    ok: true,
    alreadySubscribed: Boolean(record.alreadySubscribed),
    message:
      typeof record.message === 'string' && record.message.trim()
        ? record.message
        : success,
  }
}
