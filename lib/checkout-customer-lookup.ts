export type CustomerLookupResult = {
  found: boolean
  needsProfile?: boolean
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  personalDiscountPercent?: number
  user?: {
    id?: string
    email: string
    role: 'admin' | 'customer'
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
  }
}

type ApiErrorBody = {
  error?: string
  message?: string | string[]
}

function extractApiError(data: ApiErrorBody, fallback: string): string {
  if (data.error) return data.error
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  return fallback
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as ApiErrorBody
  return extractApiError(data, fallback)
}

export async function lookupCustomerByPhone(phone: string): Promise<CustomerLookupResult> {
  const res = await fetch(
    `/api/auth/customer-by-phone?phone=${encodeURIComponent(phone.trim())}`,
    { cache: 'no-store' },
  )

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося перевірити номер.'))
  }

  return (await res.json()) as CustomerLookupResult
}

export async function sendAuthEmailCode(email: string): Promise<void> {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'login' }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося надіслати лист.'))
  }
}

export async function verifyAuthEmailCode(
  email: string,
  code: string,
): Promise<{ verificationToken: string }> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Невірний код.'))
  }

  return (await res.json()) as { verificationToken: string }
}

export async function sendCheckoutSmsCode(phone: string): Promise<void> {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone.trim(), purpose: 'checkout' }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося надіслати SMS.'))
  }
}

export async function sendCheckoutEmailCode(email: string): Promise<void> {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'checkout' }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося надіслати лист.'))
  }
}

export async function verifyCheckoutSmsCode(
  phone: string,
  code: string,
): Promise<{ verificationToken: string }> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone.trim(), code }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Невірний код.'))
  }

  return (await res.json()) as { verificationToken: string }
}

export async function resolveCheckoutIdentity(input: {
  phone?: string
  email?: string
  verificationToken: string
  firstName?: string
  lastName?: string
}): Promise<CustomerLookupResult> {
  const res = await fetch('/api/auth/checkout/identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
      ...(input.email?.trim() ? { email: input.email.trim().toLowerCase() } : {}),
      verificationToken: input.verificationToken,
      ...(input.firstName?.trim() ? { firstName: input.firstName.trim() } : {}),
      ...(input.lastName?.trim() ? { lastName: input.lastName.trim() } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося підтвердити замовника.'))
  }

  return (await res.json()) as CustomerLookupResult
}
