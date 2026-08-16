'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import {
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  clearPhoneContact,
  confirmEmailContact,
  confirmPhoneContact,
  fetchAccountProfile,
  startEmailContact,
  startPhoneContact,
  updateAccountProfile,
  type AccountProfile,
} from '@/lib/account/api'
import {
  sendAuthEmailCode,
  sendAuthSmsCode,
  verifyAuthEmailCode,
  verifyAuthSmsCode,
} from '@/lib/checkout-customer-lookup'
import { DELIVERY_METHOD_LABELS } from '@/lib/backstage/order-status'
import {
  fetchPublicSiteSettingsFromApiRoute,
  getMarketSettings,
} from '@/lib/settings/fetch'
import {
  isOtpChannelEnabled,
  isValidPhoneForPolicy,
  phoneErrorForPolicy,
  phonePlaceholderForPolicy,
  type MarketSettings,
} from '@/lib/settings/market'
import { sanitizeCheckoutPhoneInput } from '@/lib/validation/checkout-form'
import { cn } from '@/lib/utils'
import { FieldHint } from '@/components/auth/auth-form-ui'

type ContactFlow = 'idle' | 'enter' | 'code' | 'conflict'

export function AccountSettingsContent() {
  const t = useTranslations('account')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('nova-poshta-branch')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryBranch, setDeliveryBranch] = useState('')
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryHouseNumber, setDeliveryHouseNumber] = useState('')

  const [emailFlow, setEmailFlow] = useState<ContactFlow>('idle')
  const [phoneFlow, setPhoneFlow] = useState<ContactFlow>('idle')
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [phoneBusy, setPhoneBusy] = useState(false)

  const loadProfile = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    void Promise.all([fetchAccountProfile(), fetchPublicSiteSettingsFromApiRoute()])
      .then(([data, settings]) => {
        setProfile(data)
        setMarket(getMarketSettings(settings))
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setPatronymic(data.patronymic ?? '')
        const d = data.deliveryDefaults
        setDeliveryMethod(d?.method ?? 'nova-poshta-branch')
        setDeliveryCity(d?.city ?? '')
        setDeliveryBranch(d?.branch ?? '')
        setDeliveryStreet(d?.street ?? '')
        setDeliveryHouseNumber(d?.houseNumber ?? '')
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : t('loadError'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const emailOtpEnabled = market ? isOtpChannelEnabled(market, 'email', 'profile') : false
  const smsOtpEnabled = market ? isOtpChannelEnabled(market, 'sms', 'profile') : false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateAccountProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        patronymic: patronymic.trim(),
        deliveryDefaults: {
          method: deliveryMethod as 'nova-poshta-branch' | 'nova-poshta-address' | 'pickup',
          city: deliveryCity.trim(),
          branch: deliveryBranch.trim(),
          street: deliveryStreet.trim(),
          houseNumber: deliveryHouseNumber.trim(),
        },
      })
      setProfile(updated)
      toast.success(tc('profileSaved'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : tc('profileSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const beginEmailFlow = () => {
    setEmailInput(profile?.email ?? '')
    setEmailCode('')
    setEmailFlow('enter')
  }

  const beginPhoneFlow = () => {
    setPhoneInput(profile?.phone ?? '')
    setPhoneCode('')
    setPhoneFlow('enter')
  }

  const submitEmailStart = async () => {
    setEmailBusy(true)
    try {
      const result = await startEmailContact(emailInput.trim())
      if (result.alreadyOwned) {
        toast.success(t('contactAlreadyOnAccount'))
        setEmailFlow('idle')
        return
      }
      // OTP already sent by start; verify step uses same mailbox.
      setEmailFlow('code')
      toast.success(t('contactOtpSent'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('contactStartFailed'))
    } finally {
      setEmailBusy(false)
    }
  }

  const submitEmailConfirm = async () => {
    setEmailBusy(true)
    try {
      const { verificationToken } = await verifyAuthEmailCode(
        emailInput.trim(),
        emailCode.trim(),
        'profile',
      )
      const updated = await confirmEmailContact(verificationToken)
      setProfile(updated)
      setEmailFlow('idle')
      toast.success(t('contactEmailUpdated'))
    } catch (e) {
      const err = e as Error & { code?: string }
      if (err.code === 'CONTACT_ALREADY_ASSOCIATED') {
        setEmailFlow('conflict')
        return
      }
      toast.error(err.message || t('contactConfirmFailed'))
    } finally {
      setEmailBusy(false)
    }
  }

  const submitPhoneStart = async () => {
    if (!market) return
    const phoneErr = phoneErrorForPolicy(phoneInput, market.authPhonePolicy)
    if (phoneErr) {
      toast.error(phoneErr)
      return
    }
    setPhoneBusy(true)
    try {
      const result = await startPhoneContact(phoneInput.trim())
      if (result.alreadyOwned) {
        toast.success(t('contactAlreadyOnAccount'))
        setPhoneFlow('idle')
        return
      }
      setPhoneFlow('code')
      toast.success(t('contactOtpSent'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('contactStartFailed'))
    } finally {
      setPhoneBusy(false)
    }
  }

  const submitPhoneConfirm = async () => {
    setPhoneBusy(true)
    try {
      const { verificationToken } = await verifyAuthSmsCode(
        phoneInput.trim(),
        phoneCode.trim(),
        'profile',
      )
      const updated = await confirmPhoneContact(verificationToken)
      setProfile(updated)
      setPhoneFlow('idle')
      toast.success(t('contactPhoneUpdated'))
    } catch (e) {
      const err = e as Error & { code?: string }
      if (err.code === 'CONTACT_ALREADY_ASSOCIATED') {
        setPhoneFlow('conflict')
        return
      }
      toast.error(err.message || t('contactConfirmFailed'))
    } finally {
      setPhoneBusy(false)
    }
  }

  const handleClearPhone = async () => {
    setPhoneBusy(true)
    try {
      const updated = await clearPhoneContact()
      setProfile(updated)
      setPhoneFlow('idle')
      toast.success(t('contactPhoneCleared'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('contactConfirmFailed'))
    } finally {
      setPhoneBusy(false)
    }
  }

  if (loading) {
    return <AccountPageLoading />
  }

  if (loadError || !profile) {
    return (
      <AccountPageError
        message={loadError ?? t('loadError')}
        onRetry={loadProfile}
      />
    )
  }

  return (
    <div className="max-w-xl space-y-8">
      <section className="space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-lg font-semibold">{t('contactDetails')}</h2>

        <div className="space-y-3 border-b border-border/40 pb-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{tc('email')}</p>
              <p className="text-sm text-foreground">{profile?.email || t('contactEmpty')}</p>
              <p
                className={cn(
                  'text-xs',
                  profile?.emailVerified ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {profile?.email
                  ? profile.emailVerified
                    ? t('contactVerified')
                    : t('emailNotVerified')
                  : null}
              </p>
            </div>
            {emailOtpEnabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 w-full shrink-0 sm:w-auto"
                onClick={beginEmailFlow}
              >
                {profile?.email ? t('changeEmail') : t('addEmail')}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">{t('emailOtpUnavailable')}</p>
            )}
          </div>

          {emailFlow === 'enter' ? (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <Label htmlFor="newEmail">{t('newEmailLabel')}</Label>
              <Input
                id="newEmail"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={emailBusy} onClick={() => void submitEmailStart()}>
                  {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendContactOtp')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEmailFlow('idle')}>
                  {tc('cancel')}
                </Button>
              </div>
            </div>
          ) : null}

          {emailFlow === 'code' ? (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">{t('contactOtpHint')}</p>
              <Label htmlFor="emailCode">{t('contactOtpCode')}</Label>
              <Input
                id="emailCode"
                inputMode="numeric"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={emailBusy}
                  onClick={() => void submitEmailConfirm()}
                >
                  {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirmContact')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={emailBusy}
                  onClick={() => void sendAuthEmailCode(emailInput.trim(), 'profile').then(() => toast.success(t('contactOtpSent'))).catch((e) => toast.error(e instanceof Error ? e.message : t('contactStartFailed')))}
                >
                  {t('resendContactOtp')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEmailFlow('idle')}>
                  {tc('cancel')}
                </Button>
              </div>
            </div>
          ) : null}

          {emailFlow === 'conflict' ? (
            <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              {t('contactAlreadyAssociated')}
            </p>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{tc('phone')}</p>
              <p className="text-sm text-foreground">{profile?.phone || t('contactEmpty')}</p>
              <p
                className={cn(
                  'text-xs',
                  profile?.phoneVerified ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {profile?.phone
                  ? profile.phoneVerified
                    ? t('contactVerified')
                    : t('phoneNotVerified')
                  : null}
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {smsOtpEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11 w-full sm:w-auto"
                  onClick={beginPhoneFlow}
                >
                  {profile?.phone ? t('changePhone') : t('addPhone')}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">{t('phoneOtpUnavailable')}</p>
              )}
              {profile?.phone ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11 w-full sm:w-auto"
                  disabled={phoneBusy}
                  onClick={() => void handleClearPhone()}
                >
                  {t('clearPhone')}
                </Button>
              ) : null}
            </div>
          </div>

          {phoneFlow === 'enter' ? (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <Label htmlFor="newPhone">{t('newPhoneLabel')}</Label>
              <Input
                id="newPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={
                  market
                    ? phonePlaceholderForPolicy(market.authPhonePolicy)
                    : '+...'
                }
                value={phoneInput}
                onChange={(e) =>
                  setPhoneInput(sanitizeCheckoutPhoneInput(e.target.value))
                }
                className={cn(
                  market &&
                    phoneInput.trim() &&
                    !isValidPhoneForPolicy(phoneInput, market.authPhonePolicy) &&
                    'border-destructive/80',
                )}
              />
              <FieldHint
                id="newPhone-error"
                show={Boolean(
                  market &&
                    phoneInput.trim() &&
                    !isValidPhoneForPolicy(phoneInput, market.authPhonePolicy),
                )}
                message={
                  market
                    ? phoneErrorForPolicy(phoneInput, market.authPhonePolicy)
                    : null
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={
                    phoneBusy ||
                    !market ||
                    !isValidPhoneForPolicy(phoneInput, market.authPhonePolicy)
                  }
                  onClick={() => void submitPhoneStart()}
                >
                  {phoneBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('sendContactOtp')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setPhoneFlow('idle')}>
                  {tc('cancel')}
                </Button>
              </div>
            </div>
          ) : null}

          {phoneFlow === 'code' ? (
            <div className="space-y-3 rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">{t('contactOtpHint')}</p>
              <Label htmlFor="phoneCode">{t('contactOtpCode')}</Label>
              <Input
                id="phoneCode"
                inputMode="numeric"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={phoneBusy}
                  onClick={() => void submitPhoneConfirm()}
                >
                  {phoneBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirmContact')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={phoneBusy}
                  onClick={() =>
                    void sendAuthSmsCode(phoneInput.trim(), 'profile')
                      .then(() => toast.success(t('contactOtpSent')))
                      .catch((e) =>
                        toast.error(e instanceof Error ? e.message : t('contactStartFailed')),
                      )
                  }
                >
                  {t('resendContactOtp')}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setPhoneFlow('idle')}>
                  {tc('cancel')}
                </Button>
              </div>
            </div>
          ) : null}

          {phoneFlow === 'conflict' ? (
            <p className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
              {t('contactAlreadyAssociated')}
            </p>
          ) : null}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="font-serif text-lg font-semibold">{t('profileNameSection')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">{tc('lastName')}</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">{tc('firstName')}</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="patronymic">{tc('patronymic')}</Label>
              <Input
                id="patronymic"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="font-serif text-lg font-semibold">{t('defaultDeliveryAddress')}</h2>
          <p className="text-sm text-muted-foreground">{t('defaultDeliveryHint')}</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('deliveryMethod')}</Label>
              <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DELIVERY_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {deliveryMethod !== 'pickup' ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">{t('citySettlement')}</Label>
                <Input
                  id="deliveryCity"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                />
              </div>
            ) : null}
            {deliveryMethod === 'nova-poshta-branch' ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryBranch">{tc('branch')}</Label>
                <Input
                  id="deliveryBranch"
                  value={deliveryBranch}
                  onChange={(e) => setDeliveryBranch(e.target.value)}
                />
              </div>
            ) : null}
            {deliveryMethod === 'nova-poshta-address' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="deliveryStreet">{tc('street')}</Label>
                  <Input
                    id="deliveryStreet"
                    value={deliveryStreet}
                    onChange={(e) => setDeliveryStreet(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryHouseNumber">{tc('house')}</Label>
                  <Input
                    id="deliveryHouseNumber"
                    value={deliveryHouseNumber}
                    onChange={(e) => setDeliveryHouseNumber(e.target.value)}
                  />
                </div>
              </>
            ) : null}
          </div>
        </section>

        <Button type="submit" disabled={saving} className="min-h-11 w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {tc('saving')}
            </>
          ) : (
            tc('saveChanges')
          )}
        </Button>
      </form>
    </div>
  )
}
