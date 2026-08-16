import {
  CheckoutAccountLockedError,
  isCheckoutAccountLockedPayload,
} from '@/lib/checkout/account-lock'

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

type OtpPurpose = 'login' | 'checkout' | 'review' | 'profile'

type ApiErrorBody = {
  error?: string
  code?: string
  message?: string | string[] | { code?: string; message?: string }
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

export async function sendAuthEmailCode(
  email: string,
  purpose: OtpPurpose = 'login',
): Promise<void> {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), purpose }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося надіслати лист.'))
  }
}

export async function verifyAuthEmailCode(
  email: string,
  code: string,
  purpose: OtpPurpose = 'login',
): Promise<{ verificationToken: string }> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase(), code, purpose }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Невірний код.'))
  }

  return (await res.json()) as { verificationToken: string }
}

export async function sendAuthSmsCode(
  phone: string,
  purpose: OtpPurpose = 'login',
): Promise<void> {
  const res = await fetch('/api/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone.trim(), purpose }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Не вдалося надіслати SMS.'))
  }
}

export async function sendCheckoutSmsCode(phone: string): Promise<void> {
  return sendAuthSmsCode(phone, 'checkout')
}

export async function sendCheckoutEmailCode(email: string): Promise<void> {
  return sendAuthEmailCode(email, 'checkout')
}

export async function verifyAuthSmsCode(
  phone: string,
  code: string,
  purpose: OtpPurpose = 'login',
): Promise<{ verificationToken: string }> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phone.trim(), code, purpose }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Невірний код.'))
  }

  return (await res.json()) as { verificationToken: string }
}

/** @deprecated Prefer verifyAuthSmsCode(phone, code, 'checkout') */
export async function verifyCheckoutSmsCode(
  phone: string,
  code: string,
): Promise<{ verificationToken: string }> {
  return verifyAuthSmsCode(phone, code, 'checkout')
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
    const data = (await res.json().catch(() => ({}))) as ApiErrorBody
    if (isCheckoutAccountLockedPayload(data)) {
      throw new CheckoutAccountLockedError()
    }
    throw new Error(extractApiError(data, 'Не вдалося підтвердити контакт.'))
  }

  return (await res.json()) as CustomerLookupResult
}
