import type { MarketSettings } from '@/lib/settings/market'
import { isOtpChannelEnabled } from '@/lib/settings/market'

export type AuthSubtitleKey =
  | 'authSubtitleNeutral'
  | 'authSubtitleEmailOnly'
  | 'authSubtitlePhoneOnly'
  | 'authSubtitleEmailPhone'
  | 'authSubtitleGoogleOnly'
  | 'authSubtitleGoogleEmail'
  | 'authSubtitleGooglePhone'
  | 'authSubtitleGoogleEmailPhone'

export function resolveAuthSubtitleKey(
  market: MarketSettings,
  googleEnabled: boolean,
): AuthSubtitleKey {
  const sms = isOtpChannelEnabled(market, 'sms', 'login')
  const email = isOtpChannelEnabled(market, 'email', 'login')

  if (googleEnabled && email && sms) return 'authSubtitleGoogleEmailPhone'
  if (googleEnabled && email && !sms) return 'authSubtitleGoogleEmail'
  if (googleEnabled && sms && !email) return 'authSubtitleGooglePhone'
  if (googleEnabled && !email && !sms) return 'authSubtitleGoogleOnly'
  if (!googleEnabled && email && sms) return 'authSubtitleEmailPhone'
  if (!googleEnabled && email && !sms) return 'authSubtitleEmailOnly'
  if (!googleEnabled && sms && !email) return 'authSubtitlePhoneOnly'
  return 'authSubtitleNeutral'
}
