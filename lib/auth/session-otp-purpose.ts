/** Purposes allowed when creating a storefront session via email/phone-session BFF. */
export const SESSION_OTP_PURPOSES = ['login', 'review'] as const

export type SessionOtpPurpose = (typeof SESSION_OTP_PURPOSES)[number]

/** Unknown / omitted → login (backward-compatible default). */
export function normalizeSessionOtpPurpose(
  purpose: string | null | undefined,
): SessionOtpPurpose {
  return purpose === 'review' ? 'review' : 'login'
}
