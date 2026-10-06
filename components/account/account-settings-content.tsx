'use client'

import { useFormatFieldError } from '@/lib/validation/use-field-error-messages'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import {
  AccountPageError,
  AccountPageLoading,
} from '@/components/account/account-page-state'
import { BillingCountryCombobox } from '@/components/checkout/billing-country-combobox'
import { FieldHint } from '@/components/auth/auth-form-ui'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ACCOUNT_ACTION_BUTTON_CLASS } from '@/lib/account/account-ui'
import {
  clearPhoneContact,
  confirmEmailContact,
  confirmPhoneContact,
  fetchAccountProfile,
  startEmailContact,
  startPhoneContact,
  updateAccountProfile,
  type AccountBillingDefaults,
  type AccountProfile,
} from '@/lib/account/api'
import {
  isBranchDeliveryMethod,
  isCourierDeliveryMethod,
  isPickupDeliveryMethod,
  needsSkCourierExtras,
} from '@/lib/account/delivery-defaults-ui'
import { mapAccountError } from '@/lib/account/map-account-error'
import {
  sendAuthEmailCode,
  sendAuthSmsCode,
  verifyAuthEmailCode,
  verifyAuthSmsCode,
} from '@/lib/checkout-customer-lookup'
import type { CheckoutDeliveryMethodSlug } from '@/lib/checkout/methods'
import {
  fetchPublicSiteSettingsFromApiRoute,
  getCartCheckoutSettings,
  getMarketSettings,
} from '@/lib/settings/fetch'
import {
  isOtpChannelEnabled,
  phoneErrorForPolicy,
  phonePlaceholderForPolicy,
  type MarketSettings,
} from '@/lib/settings/market'
import { sanitizeCheckoutPhoneInput } from '@/lib/validation/checkout-form'
import { cn } from '@/lib/utils'

type ContactFlow = 'idle' | 'enter' | 'code' | 'conflict'
type BuyerType = 'individual' | 'company'

export function AccountSettingsContent() {
  const fe = useFormatFieldError()
  const locale = useLocale()

  const t = useTranslations('account')
  const tc = useTranslations('common')
  const tCheckout = useTranslations('checkout')
  const tApi = useTranslations('apiErrors')
  const errMsg = useCallback(
    (e: unknown, fallback: string) => mapAccountError(e, tApi, 'generic') || fallback,
    [tApi],
  )

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [market, setMarket] = useState<MarketSettings | null>(null)
  const [enabledDeliveryMethods, setEnabledDeliveryMethods] = useState<
    CheckoutDeliveryMethodSlug[]
  >([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('')
  const [deliveryCity, setDeliveryCity] = useState('')
  const [deliveryBranch, setDeliveryBranch] = useState('')
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryHouseNumber, setDeliveryHouseNumber] = useState('')
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('')
  const [deliveryCountryCode, setDeliveryCountryCode] = useState('')

  const [buyerType, setBuyerType] = useState<BuyerType>('individual')
  const [billingFirstName, setBillingFirstName] = useState('')
  const [billingLastName, setBillingLastName] = useState('')
  const [billingCountryCode, setBillingCountryCode] = useState('')
  const [billingStreet, setBillingStreet] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [companyLegalName, setCompanyLegalName] = useState('')
  const [companyIco, setCompanyIco] = useState('')
  const [companyDic, setCompanyDic] = useState('')
  const [companyVatId, setCompanyVatId] = useState('')
  const [vatCountryCode, setVatCountryCode] = useState('')

  const [emailFlow, setEmailFlow] = useState<ContactFlow>('idle')
  const [phoneFlow, setPhoneFlow] = useState<ContactFlow>('idle')
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [phoneBusy, setPhoneBusy] = useState(false)

  const applyBillingDefaults = useCallback((billing: AccountBillingDefaults | null) => {
    setBuyerType(billing?.buyerType === 'company' ? 'company' : 'individual')
    setBillingFirstName(billing?.firstName ?? '')
    setBillingLastName(billing?.lastName ?? '')
    setBillingCountryCode(billing?.countryCode ?? '')
    setBillingStreet(billing?.street ?? '')
    setBillingCity(billing?.city ?? '')
    setBillingPostalCode(billing?.postalCode ?? '')
    setCompanyLegalName(billing?.companyLegalName ?? '')
    setCompanyIco(billing?.companyIco ?? '')
    setCompanyDic(billing?.companyDic ?? '')
    setCompanyVatId(billing?.companyVatId ?? '')
    setVatCountryCode(billing?.vatCountryCode ?? '')
  }, [])

  const loadProfile = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    void Promise.all([fetchAccountProfile(), fetchPublicSiteSettingsFromApiRoute()])
      .then(([data, settings]) => {
        setProfile(data)
        const nextMarket = getMarketSettings(settings)
        setMarket(nextMarket)
        const cart = getCartCheckoutSettings(settings)
        const methods = cart.enabledDeliveryMethods
        setEnabledDeliveryMethods(methods)
        setFirstName(data.firstName ?? '')
        setLastName(data.lastName ?? '')
        setPatronymic(data.patronymic ?? '')
        const d = data.deliveryDefaults
        const savedMethod = d?.method?.trim() ?? ''
        const method =
          savedMethod && methods.includes(savedMethod as CheckoutDeliveryMethodSlug)
            ? savedMethod
            : (methods[0] ?? '')
        setDeliveryMethod(method)
        setDeliveryCity(d?.city ?? '')
        setDeliveryBranch(d?.branch ?? '')
        setDeliveryStreet(d?.street ?? '')
        setDeliveryHouseNumber(d?.houseNumber ?? '')
        setDeliveryPostalCode(d?.postalCode ?? '')
        setDeliveryCountryCode(d?.countryCode ?? '')
        applyBillingDefaults(data.billingDefaults)
      })
      .catch((e) => {
        setLoadError(errMsg(e, t('loadError')))
      })
      .finally(() => setLoading(false))
  }, [applyBillingDefaults, errMsg, t])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const emailOtpEnabled = market ? isOtpChannelEnabled(market, 'email', 'profile') : false
  const smsOtpEnabled = market ? isOtpChannelEnabled(market, 'sms', 'profile') : false
  const isSk = market?.region === 'sk'
  const showPatronymic = market?.region === 'ua'
  const showCourierAddress = isCourierDeliveryMethod(deliveryMethod)
  const showBranch = isBranchDeliveryMethod(deliveryMethod)
  const showSkCourierExtras = needsSkCourierExtras(deliveryMethod, market?.region ?? 'ua')

  const deliveryMethodLabel = useCallback(
    (slug: string) => {
      const key = `deliveryMethods.${slug}` as Parameters<typeof tCheckout>[0]
      return tCheckout.has(key) ? tCheckout(key) : slug
    },
    [tCheckout],
  )

  const preferCountryFirst = useMemo(
    () => (isSk ? ['sk', 'cz', 'hu', 'at', 'de'] : ['ua']),
    [isSk],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const billingDefaults: AccountBillingDefaults = {
        buyerType,
        firstName: billingFirstName.trim() || firstName.trim(),
        lastName: billingLastName.trim() || lastName.trim(),
        countryCode: billingCountryCode.trim(),
        street: billingStreet.trim(),
        city: billingCity.trim(),
        postalCode: billingPostalCode.trim(),
        ...(buyerType === 'company'
          ? {
              companyLegalName: companyLegalName.trim(),
              companyIco: companyIco.trim(),
              companyDic: companyDic.trim(),
              companyVatId: companyVatId.trim(),
              vatCountryCode: vatCountryCode.trim(),
            }
          : {}),
      }
      const updated = await updateAccountProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        patronymic: showPatronymic ? patronymic.trim() : '',
        deliveryDefaults: {
          method: deliveryMethod,
          city: isPickupDeliveryMethod(deliveryMethod) ? '' : deliveryCity.trim(),
          branch: showBranch ? deliveryBranch.trim() : '',
          street: showCourierAddress ? deliveryStreet.trim() : '',
          houseNumber: showCourierAddress ? deliveryHouseNumber.trim() : '',
          postalCode: showSkCourierExtras ? deliveryPostalCode.trim() : '',
          countryCode: showSkCourierExtras ? deliveryCountryCode.trim() : '',
        },
        billingDefaults,
      })
      setProfile(updated)
      applyBillingDefaults(updated.billingDefaults)
      toast.success(tc('profileSaved'))
    } catch (e) {
      toast.error(errMsg(e, tc('profileSaveFailed')))
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
      setEmailFlow('code')
      toast.success(t('contactOtpSent'))
    } catch (e) {
      toast.error(errMsg(e, t('contactStartFailed')))
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
      toast.error(errMsg(e, t('contactConfirmFailed')))
    } finally {
      setEmailBusy(false)
    }
  }

  const submitPhoneStart = async () => {
    if (!market) return
    const phoneErr = fe(phoneErrorForPolicy(phoneInput, market.authPhonePolicy, market.region))
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
      toast.error(errMsg(e, t('contactStartFailed')))
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
      toast.error(errMsg(e, t('contactConfirmFailed')))
    } finally {
      setPhoneBusy(false)
    }
  }

  const submitPhoneClear = async () => {
    setPhoneBusy(true)
    try {
      const updated = await clearPhoneContact()
      setProfile(updated)
      setPhoneFlow('idle')
      toast.success(t('contactPhoneCleared'))
    } catch (e) {
      toast.error(errMsg(e, t('contactConfirmFailed')))
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
                className={cn('min-h-11 w-full shrink-0 sm:w-auto', ACCOUNT_ACTION_BUTTON_CLASS)}
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
                <Button
                  type="button"
                  size="sm"
                  disabled={emailBusy}
                  className={ACCOUNT_ACTION_BUTTON_CLASS}
                  onClick={() => void submitEmailStart()}
                >
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
                  className={ACCOUNT_ACTION_BUTTON_CLASS}
                  onClick={() => void submitEmailConfirm()}
                >
                  {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirmContact')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void sendAuthEmailCode(emailInput.trim(), 'profile', locale)
                      .then(() => toast.success(t('contactOtpSent')))
                      .catch((e) => toast.error(errMsg(e, t('contactStartFailed'))))
                  }
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
                  className={cn('min-h-11 w-full sm:w-auto', ACCOUNT_ACTION_BUTTON_CLASS)}
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
                  className={cn('min-h-11 w-full sm:w-auto', ACCOUNT_ACTION_BUTTON_CLASS)}
                  disabled={phoneBusy}
                  onClick={() => void submitPhoneClear()}
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
                  market ? phonePlaceholderForPolicy(market.authPhonePolicy) : undefined
                }
                value={phoneInput}
                onChange={(e) =>
                  setPhoneInput(sanitizeCheckoutPhoneInput(e.target.value))
                }
              />
              {market ? (
                <FieldHint
                  id="newPhone-error"
                  show={Boolean(phoneInput.trim())}
                  message={fe(
                    phoneErrorForPolicy(phoneInput, market.authPhonePolicy, market.region),
                  )}
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={phoneBusy}
                  className={ACCOUNT_ACTION_BUTTON_CLASS}
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
                  className={ACCOUNT_ACTION_BUTTON_CLASS}
                  onClick={() => void submitPhoneConfirm()}
                >
                  {phoneBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirmContact')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void sendAuthSmsCode(phoneInput.trim(), 'profile')
                      .then(() => toast.success(t('contactOtpSent')))
                      .catch((e) => toast.error(errMsg(e, t('contactStartFailed'))))
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
            {showPatronymic ? (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patronymic">{tc('patronymic')}</Label>
                <Input
                  id="patronymic"
                  value={patronymic}
                  onChange={(e) => setPatronymic(e.target.value)}
                />
              </div>
            ) : null}
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
                  {enabledDeliveryMethods.map((value) => (
                    <SelectItem key={value} value={value}>
                      {deliveryMethodLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isPickupDeliveryMethod(deliveryMethod) ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryCity">{t('citySettlement')}</Label>
                <Input
                  id="deliveryCity"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                />
              </div>
            ) : null}
            {showBranch ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryBranch">
                  {deliveryMethod.startsWith('packeta')
                    ? tCheckout('packetaPickupPointLabel')
                    : tc('branch')}
                </Label>
                <Input
                  id="deliveryBranch"
                  value={deliveryBranch}
                  onChange={(e) => setDeliveryBranch(e.target.value)}
                />
              </div>
            ) : null}
            {showCourierAddress ? (
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
                {showSkCourierExtras ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryPostalCode">{tCheckout('postalCode')}</Label>
                      <Input
                        id="deliveryPostalCode"
                        value={deliveryPostalCode}
                        onChange={(e) => setDeliveryPostalCode(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{tCheckout('deliveryCountry')}</Label>
                      <BillingCountryCombobox
                        value={deliveryCountryCode}
                        onChange={setDeliveryCountryCode}
                        preferFirst={preferCountryFirst}
                      />
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:p-5">
          <h2 className="font-serif text-lg font-semibold">{t('billingDefaultsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('billingDefaultsHint')}</p>

          <RadioGroup
            value={buyerType}
            onValueChange={(value) => setBuyerType(value as BuyerType)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Label
              htmlFor="buyer-individual"
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3',
                buyerType === 'individual' ? 'border-primary bg-primary/5' : 'border-border/60',
              )}
            >
              <RadioGroupItem id="buyer-individual" value="individual" />
              <span className="text-sm font-medium">{t('buyerTypeIndividual')}</span>
            </Label>
            <Label
              htmlFor="buyer-company"
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3',
                buyerType === 'company' ? 'border-primary bg-primary/5' : 'border-border/60',
              )}
            >
              <RadioGroupItem id="buyer-company" value="company" />
              <span className="text-sm font-medium">{t('buyerTypeCompany')}</span>
            </Label>
          </RadioGroup>

          {buyerType === 'company' ? (
            <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
              <div className="space-y-2">
                <Label htmlFor="companyLegalName">{tCheckout('companyLegalName')}</Label>
                <Input
                  id="companyLegalName"
                  value={companyLegalName}
                  onChange={(e) => setCompanyLegalName(e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyIco">
                    {isSk ? tCheckout('ico') : t('companyTaxId')}
                  </Label>
                  <Input
                    id="companyIco"
                    value={companyIco}
                    onChange={(e) => setCompanyIco(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDic">
                    {isSk ? tCheckout('companyDic') : t('companyVatLabel')}
                  </Label>
                  <Input
                    id="companyDic"
                    value={companyDic}
                    onChange={(e) => setCompanyDic(e.target.value)}
                  />
                </div>
              </div>
              {isSk ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vatCountryCode">{tCheckout('companyCountry')}</Label>
                    <Input
                      id="vatCountryCode"
                      value={vatCountryCode}
                      onChange={(e) => setVatCountryCode(e.target.value.toUpperCase())}
                      placeholder="SK"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyVatId">{tCheckout('vatIdLabel')}</Label>
                    <Input
                      id="companyVatId"
                      value={companyVatId}
                      onChange={(e) => setCompanyVatId(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="billingLastName">{tc('lastName')}</Label>
                <Input
                  id="billingLastName"
                  value={billingLastName}
                  onChange={(e) => setBillingLastName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingFirstName">{tc('firstName')}</Label>
                <Input
                  id="billingFirstName"
                  value={billingFirstName}
                  onChange={(e) => setBillingFirstName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{tCheckout(isSk ? 'billingCountry' : 'deliveryCountry')}</Label>
            <BillingCountryCombobox
              value={billingCountryCode}
              onChange={setBillingCountryCode}
              preferFirst={preferCountryFirst}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingStreet">{tc('street')}</Label>
            <Input
              id="billingStreet"
              value={billingStreet}
              onChange={(e) => setBillingStreet(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billingCity">{t('citySettlement')}</Label>
              <Input
                id="billingCity"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingPostalCode">{tCheckout('postalCode')}</Label>
              <Input
                id="billingPostalCode"
                value={billingPostalCode}
                onChange={(e) => setBillingPostalCode(e.target.value)}
              />
            </div>
          </div>
        </section>

        <Button
          type="submit"
          disabled={saving}
          className={cn('min-h-11 w-full sm:w-auto', ACCOUNT_ACTION_BUTTON_CLASS)}
        >
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
