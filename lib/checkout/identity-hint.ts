export type IdentityResolution = 'none' | 'single' | 'conflict'
export type SuggestedAuth = 'email' | 'phone' | 'either' | null

export type CheckoutIdentityHint = {
  identityResolution: IdentityResolution
  suggestedAuth: SuggestedAuth
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

export async function fetchCheckoutIdentityHint(
  email: string,
  phone: string,
): Promise<CheckoutIdentityHint> {
  const res = await fetch('/api/auth/checkout/identity-hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
    }),
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, 'Identity hint unavailable'))
  }

  return (await res.json()) as CheckoutIdentityHint
}
