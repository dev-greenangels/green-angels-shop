import {
  acceptCheckoutPersonName,
  type CheckoutMarketRegion,
} from '../validation/checkout-form'
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

function pickMarketName(
  profileName: string | undefined,
  formName: string,
  marketRegion: CheckoutMarketRegion | undefined,
): string {
  if (marketRegion == null) {
    return profileName ?? formName
  }
  const fromProfile = acceptCheckoutPersonName(profileName, marketRegion)
  if (fromProfile) return fromProfile
  return acceptCheckoutPersonName(formName, marketRegion)
}

/**
 * Checkout-form patch after OTP/OAuth. Proven channel syncs from the User;
 * a sibling contact the shopper already typed stays in the form for the order.
 * Does not mark the sibling verified or attach it to the User.
 * When marketRegion is set, only script-valid names are kept (SK Latin / UA Cyrillic).
 */
export function buildVerifiedCheckoutContactPatch(
  form: VerifiedCheckoutContactForm,
  profile: VerifiedCheckoutContactProfile,
  method: VerifiedCheckoutAuthMethod,
  marketRegion?: CheckoutMarketRegion,
): Pick<VerifiedCheckoutContactForm, 'firstName' | 'lastName' | 'phone' | 'email'> {
  const typedPhone = form.phone.trim()
  const typedEmail = form.email.trim()
  const dbPhone = (profile.phone ?? profile.user?.phone ?? '').trim()
  const dbEmailRaw = (profile.email ?? profile.user?.email ?? '').trim()
  const dbEmail = dbEmailRaw && isValidEmail(dbEmailRaw) ? dbEmailRaw : ''
  const firstName = pickMarketName(profile.firstName, form.firstName, marketRegion)
  const lastName = pickMarketName(profile.lastName, form.lastName, marketRegion)

  if (method === 'sms') {
    return {
      firstName,
      lastName,
      phone: dbPhone || typedPhone,
      email: typedEmail || dbEmail,
    }
  }

  return {
    firstName,
    lastName,
    email: dbEmail || typedEmail,
    phone: typedPhone || dbPhone,
  }
}
