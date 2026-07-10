import type { GoogleCheckoutProfile, PublicSession } from '@/lib/auth/types'
import type { CheckoutFormValues, CheckoutIdentificationState } from '@/lib/validation/checkout-form'
import { isValidEmail } from '@/lib/validation/register-form'

export type CheckoutSessionData = {
  user: PublicSession
  profile: GoogleCheckoutProfile | null
}

export async function fetchCheckoutSession(): Promise<CheckoutSessionData | null> {
  const res = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' })
  if (!res.ok) return null

  const data = (await res.json()) as {
    user?: PublicSession | null
    profile?: GoogleCheckoutProfile | null
  }

  if (!data.user) return null
  return { user: data.user, profile: data.profile ?? null }
}

export function buildCheckoutHydrationFromSession(data: CheckoutSessionData): {
  formPatch: Partial<CheckoutFormValues>
  identification: CheckoutIdentificationState
  personalDiscountPercent: number
} {
  const { user, profile } = data

  return {
    formPatch: {
      firstName: profile?.firstName ?? user.firstName ?? '',
      lastName: profile?.lastName ?? user.lastName ?? '',
      phone: profile?.phone ?? user.phone ?? '',
      email: user.email && isValidEmail(user.email) ? user.email : '',
    },
    identification: {
      lookupDone: true,
      customerFound: true,
      returningVerified: true,
      skippedReturningLogin: false,
      attemptingReturningLogin: false,
      authMethod: null,
    },
    personalDiscountPercent: profile?.personalDiscountPercent ?? 0,
  }
}
