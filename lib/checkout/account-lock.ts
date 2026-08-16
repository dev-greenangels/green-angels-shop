import { CHECKOUT_ACCOUNT_LOCKED } from '@/lib/auth/constants'

export { CHECKOUT_ACCOUNT_LOCKED }

export class CheckoutAccountLockedError extends Error {
  readonly code = CHECKOUT_ACCOUNT_LOCKED

  constructor(message = CHECKOUT_ACCOUNT_LOCKED) {
    super(message)
    this.name = 'CheckoutAccountLockedError'
  }
}

export function isCheckoutAccountLockedPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const body = data as { code?: unknown; error?: unknown; message?: unknown }
  if (body.code === CHECKOUT_ACCOUNT_LOCKED || body.error === CHECKOUT_ACCOUNT_LOCKED) {
    return true
  }
  if (body.message && typeof body.message === 'object') {
    const nested = body.message as { code?: unknown }
    if (nested.code === CHECKOUT_ACCOUNT_LOCKED) return true
  }
  return typeof body.message === 'string' && body.message.includes(CHECKOUT_ACCOUNT_LOCKED)
}
