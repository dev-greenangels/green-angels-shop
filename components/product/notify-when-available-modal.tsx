'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { AuthConsentNotice } from '@/components/auth/auth-consent-notice'

import { useMarketRegion } from '@/components/providers/market-region-provider'
import { submitAvailabilityNotify } from '@/components/product/submit-availability-notify'
import { notifyAvailabilityButtonClassName } from '@/components/product/notify-availability-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  fetchPublicSiteSettingsFromApiRoute,
  getMarketSettings,
} from '@/lib/settings/fetch'
import {
  phonePlaceholderForPolicy,
  type PhonePolicy,
} from '@/lib/settings/market'
import { cn } from '@/lib/utils'
import {
  formatCheckoutPhoneDisplay,
  formatPhoneDisplay,
  sanitizeEmail,
  sanitizeNotifyName,
  sanitizeNotifyPhoneInput,
  validateNotifyEmail,
  validateNotifyName,
  validateNotifyPhone,
} from '@/lib/validation/stock-notification-form'

type NotifyWhenAvailableModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: string
  plantName: string
}

export function NotifyWhenAvailableModal({
  open,
  onOpenChange,
  plantId,
  plantName,
}: NotifyWhenAvailableModalProps) {
  const t = useTranslations('product')
  const tc = useTranslations('common')
  const locale = useLocale()
  const marketRegion = useMarketRegion()
  const [phonePolicy, setPhonePolicy] = useState<PhonePolicy>(
    marketRegion === 'sk' ? 'sk_e164' : 'ua_e164',
  )
  const [name, setName] = useState('')
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [contact, setContact] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void fetchPublicSiteSettingsFromApiRoute().then((result) => {
      if (cancelled) return
      setPhonePolicy(getMarketSettings(result).authPhonePolicy)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const resetForm = () => {
    setName('')
    setContact('')
    setContactType('email')
    setSubmitted(false)
    setSuccessMessage(null)
    setError(null)
    setConsent(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleContactTypeChange = (next: 'email' | 'phone') => {
    setContactType(next)
    setContact('')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const nameError = validateNotifyName(trimmedName, marketRegion, {
      required: tc('requiredField'),
      invalid: t('notifyNameInvalid'),
    })
    if (nameError) {
      setError(nameError)
      return
    }

    const contactError =
      contactType === 'email'
        ? validateNotifyEmail(contact, {
            required: tc('requiredField'),
            invalid: tc('invalidEmail'),
          })
        : validateNotifyPhone(contact, phonePolicy, {
            required: tc('requiredField'),
            invalid: t('notifyPhoneInvalid'),
          })
    if (contactError) {
      setError(contactError)
      return
    }

    if (!consent) {
      setError(t('notifyConsentRequired'))
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitAvailabilityNotify(
        {
          plantId,
          plantName,
          name: trimmedName,
          contactType,
          contact: contact.trim(),
          consent: true,
          locale,
        },
        {
          submitFailed: t('notifySubmitFailed'),
        },
      )
      setSuccessMessage(
        result.alreadySubscribed
          ? contactType === 'email'
            ? t('notifyAlreadySubscribedEmail')
            : t('notifyAlreadySubscribedPhone')
          : t('notifySuccess'),
      )
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('notifySubmitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const phoneDisplay =
    phonePolicy === 'ua_e164' ? formatPhoneDisplay(contact) : formatCheckoutPhoneDisplay(contact)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            {t('notifyTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('notifyDescription', { name: plantName })}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
              {successMessage ?? t('notifySuccess')}
            </p>
            <Button type="button" className="w-full" onClick={() => handleOpenChange(false)}>
              {tc('close')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notify-name">{t('notifyName')}</Label>
              <Input
                id="notify-name"
                value={name}
                onChange={(e) => setName(sanitizeNotifyName(e.target.value, marketRegion))}
                placeholder={t('notifyNamePlaceholder')}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('notifyContactMethod')}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleContactTypeChange('email')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    contactType === 'email'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {tc('email')}
                </button>
                <button
                  type="button"
                  onClick={() => handleContactTypeChange('phone')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    contactType === 'phone'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {tc('phone')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notify-contact">
                {contactType === 'email' ? tc('email') : tc('phone')}
              </Label>
              <Input
                id="notify-contact"
                type={contactType === 'email' ? 'email' : 'tel'}
                inputMode={contactType === 'email' ? 'email' : 'tel'}
                value={contactType === 'phone' ? phoneDisplay : contact}
                onChange={(e) =>
                  setContact(
                    contactType === 'email'
                      ? sanitizeEmail(e.target.value)
                      : sanitizeNotifyPhoneInput(e.target.value, phonePolicy),
                  )
                }
                placeholder={
                  contactType === 'email'
                    ? t('notifyEmailPlaceholder')
                    : phonePlaceholderForPolicy(phonePolicy)
                }
                autoComplete={contactType === 'email' ? 'email' : 'tel'}
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex items-start gap-3">
              <Checkbox
                id="notify-consent"
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className="mt-0.5"
                aria-invalid={Boolean(error && !consent)}
              />
              <div className="min-w-0 space-y-1">
                <AuthConsentNotice
                  text={t.raw('notifyConsentTemplate') as string}
                  className="text-sm leading-relaxed text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">{t('notifyConsentHint')}</p>
              </div>
            </div>

            <Button
              type="submit"
              className={cn('w-full', notifyAvailabilityButtonClassName)}
              disabled={isSubmitting}
            >
              {isSubmitting ? tc('submitting') : t('notifySubscribe')}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
