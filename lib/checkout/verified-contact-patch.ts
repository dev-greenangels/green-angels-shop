import { isValidEmail } from '../validation/register-form'

export type VerifiedCheckoutAuthMethod = 'google' | 'sms' | 'email' | null

export type VerifiedCheckoutContactForm = {
  firstName: string
  lastName: string
  phone: string
  email: string
}

export type VerifiedCheckoutContactProfile = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  user?: {
    phone?: string | null
    email?: string | null
  }
}

/**
 * Checkout-form patch after OTP/OAuth. Proven channel syncs from the User;
 * a sibling contact the shopper already typed stays in the form for the order.
 * Does not mark the sibling verified or attach it to the User.
 */
export function buildVerifiedCheckoutContactPatch(
  form: VerifiedCheckoutContactForm,
  profile: VerifiedCheckoutContactProfile,
  method: VerifiedCheckoutAuthMethod,
): Pick<VerifiedCheckoutContactForm, 'firstName' | 'lastName' | 'phone' | 'email'> {
  const typedPhone = form.phone.trim()
  const typedEmail = form.email.trim()
  const dbPhone = (profile.phone ?? profile.user?.phone ?? '').trim()
  const dbEmailRaw = (profile.email ?? profile.user?.email ?? '').trim()
  const dbEmail = dbEmailRaw && isValidEmail(dbEmailRaw) ? dbEmailRaw : ''

  if (method === 'sms') {
    return {
      firstName: profile.firstName ?? form.firstName,
      lastName: profile.lastName ?? form.lastName,
      phone: dbPhone || typedPhone,
      email: typedEmail || dbEmail,
    }
  }

  return {
    firstName: profile.firstName ?? form.firstName,
    lastName: profile.lastName ?? form.lastName,
    email: dbEmail || typedEmail,
    phone: typedPhone || dbPhone,
  }
}
