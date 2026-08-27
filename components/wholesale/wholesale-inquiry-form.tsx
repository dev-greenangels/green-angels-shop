'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { AuthConsentNotice } from '@/components/auth/auth-consent-notice'
import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  phonePlaceholderForPolicy,
  type MarketRegion,
  type PhonePolicy,
} from '@/lib/settings/market'
import { toast } from '@/lib/toast'
import { submitWholesaleInquiry } from '@/lib/wholesale/api'
import {
  EMPTY_WHOLESALE_INQUIRY_FORM,
  sanitizeCity,
  sanitizeCompanyName,
  sanitizeEmail,
  sanitizeIco,
  sanitizeMessage,
  sanitizePersonName,
  sanitizeVatId,
  sanitizeWebsiteInput,
  validateWholesaleInquiryForm,
  type WholesaleInquiryFormValues,
} from '@/lib/validation/wholesale-inquiry-form'

type WholesaleInquiryFormProps = {
  region: MarketRegion
  phonePolicy: PhonePolicy
  formTitle: string
  formIntro: string
  consentText?: string | null
}

export function WholesaleInquiryForm({
  region,
  phonePolicy,
  formTitle,
  formIntro,
  consentText,
}: WholesaleInquiryFormProps) {
  const t = useTranslations('wholesale')
  const locale = useLocale()
  const isSk = region === 'sk'
  const [values, setValues] = useState<WholesaleInquiryFormValues>(EMPTY_WHOLESALE_INQUIRY_FORM)
  const [startedAt] = useState(() => Date.now())
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showErrors, setShowErrors] = useState(false)

  const errorMessages = useMemo(
    () => ({
      fullName: t('errors.fullName'),
      companyName: t('errors.companyName'),
      phone: t('errors.phone'),
      email: t('errors.email'),
      city: t('errors.city'),
      website: t('errors.website'),
      message: t('errors.message'),
      companyIco: t('errors.companyIco'),
      companyVatId: t('errors.companyVatId'),
      consent: t('errors.consent'),
    }),
    [t],
  )

  const errors = validateWholesaleInquiryForm(values, {
    region,
    phonePolicy,
    messages: errorMessages,
  })
  const hasErrors = Object.keys(errors).length > 0

  const patch = (key: keyof WholesaleInquiryFormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (hasErrors) return
    setSubmitting(true)
    try {
      await submitWholesaleInquiry({
        fullName: values.fullName.trim(),
        companyName: values.companyName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        city: values.city.trim(),
        website: values.website.trim() || undefined,
        message: values.message.trim() || undefined,
        companyIco: values.companyIco.trim() || undefined,
        companyVatId: values.companyVatId.trim() || undefined,
        consent: isSk ? values.consent : undefined,
        locale,
        fax: values.fax,
        startedAt,
      })
      setSubmitted(true)
      toast.success(t('success'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
        <h2 className="font-serif text-2xl font-semibold text-foreground">{t('successTitle')}</h2>
        <p className="mt-3 text-muted-foreground">{t('successBody')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-5" noValidate>
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">{formTitle}</h2>
        {formIntro ? <p className="mt-2 text-muted-foreground">{formIntro}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="wholesale-fullName">{t('fields.fullName')}</RequiredLabel>
          <InputWithClear
            id="wholesale-fullName"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => patch('fullName', sanitizePersonName(e.target.value))}
            onClear={() => patch('fullName', '')}
            aria-invalid={showErrors && Boolean(errors.fullName)}
          />
          {showErrors && errors.fullName ? (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          ) : null}
        </div>
        <div className="space-y-2 min-w-0">
          <RequiredLabel
            htmlFor="wholesale-companyName"
            className="gap-0.5 text-sm leading-snug whitespace-nowrap"
          >
            {t('fields.companyName')}
          </RequiredLabel>
          <InputWithClear
            id="wholesale-companyName"
            autoComplete="organization"
            value={values.companyName}
            onChange={(e) => patch('companyName', sanitizeCompanyName(e.target.value))}
            onClear={() => patch('companyName', '')}
            aria-invalid={showErrors && Boolean(errors.companyName)}
          />
          {showErrors && errors.companyName ? (
            <p className="text-sm text-destructive">{errors.companyName}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="wholesale-phone">{t('fields.phone')}</RequiredLabel>
          <InputWithClear
            id="wholesale-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder={phonePlaceholderForPolicy(phonePolicy)}
            value={values.phone}
            onChange={(e) => patch('phone', e.target.value.slice(0, 30))}
            onClear={() => patch('phone', '')}
            aria-invalid={showErrors && Boolean(errors.phone)}
          />
          {showErrors && errors.phone ? (
            <p className="text-sm text-destructive">{errors.phone}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="wholesale-email">{t('fields.email')}</RequiredLabel>
          <InputWithClear
            id="wholesale-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => patch('email', sanitizeEmail(e.target.value))}
            onClear={() => patch('email', '')}
            aria-invalid={showErrors && Boolean(errors.email)}
          />
          {showErrors && errors.email ? (
            <p className="text-sm text-destructive">{errors.email}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <RequiredLabel htmlFor="wholesale-city">{t('fields.city')}</RequiredLabel>
          <InputWithClear
            id="wholesale-city"
            autoComplete="address-level2"
            value={values.city}
            onChange={(e) => patch('city', sanitizeCity(e.target.value))}
            onClear={() => patch('city', '')}
            aria-invalid={showErrors && Boolean(errors.city)}
          />
          {showErrors && errors.city ? (
            <p className="text-sm text-destructive">{errors.city}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="wholesale-website">{t('fields.website')}</Label>
          <InputWithClear
            id="wholesale-website"
            type="url"
            autoComplete="url"
            inputMode="url"
            placeholder="https://"
            value={values.website}
            onChange={(e) => patch('website', sanitizeWebsiteInput(e.target.value))}
            onClear={() => patch('website', '')}
            aria-invalid={showErrors && Boolean(errors.website)}
          />
          {showErrors && errors.website ? (
            <p className="text-sm text-destructive">{errors.website}</p>
          ) : null}
        </div>
      </div>

      {isSk ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <RequiredLabel htmlFor="wholesale-ico">{t('fields.companyIco')}</RequiredLabel>
            <InputWithClear
              id="wholesale-ico"
              inputMode="numeric"
              autoComplete="off"
              value={values.companyIco}
              onChange={(e) => patch('companyIco', sanitizeIco(e.target.value))}
              onClear={() => patch('companyIco', '')}
              aria-invalid={showErrors && Boolean(errors.companyIco)}
            />
            {showErrors && errors.companyIco ? (
              <p className="text-sm text-destructive">{errors.companyIco}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wholesale-vat">{t('fields.companyVatId')}</Label>
            <InputWithClear
              id="wholesale-vat"
              autoComplete="off"
              placeholder="XX1234567890"
              value={values.companyVatId}
              onChange={(e) => patch('companyVatId', sanitizeVatId(e.target.value))}
              onClear={() => patch('companyVatId', '')}
              aria-invalid={showErrors && Boolean(errors.companyVatId)}
            />
            {showErrors && errors.companyVatId ? (
              <p className="text-sm text-destructive">{errors.companyVatId}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="wholesale-message">{t('fields.message')}</Label>
        <Textarea
          id="wholesale-message"
          rows={5}
          value={values.message}
          onChange={(e) => patch('message', sanitizeMessage(e.target.value))}
          aria-invalid={showErrors && Boolean(errors.message)}
        />
        {showErrors && errors.message ? (
          <p className="text-sm text-destructive">{errors.message}</p>
        ) : null}
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="wholesale-fax">Fax</Label>
        <Input
          id="wholesale-fax"
          tabIndex={-1}
          autoComplete="off"
          value={values.fax}
          onChange={(e) => patch('fax', e.target.value)}
        />
      </div>

      {isSk ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm leading-relaxed">
            <Checkbox
              checked={values.consent}
              onCheckedChange={(checked) => patch('consent', checked === true)}
              className="mt-0.5"
              aria-invalid={showErrors && Boolean(errors.consent)}
            />
            <AuthConsentNotice text={consentText} className="text-sm leading-relaxed text-muted-foreground" />
          </div>
          {showErrors && errors.consent ? (
            <p className="text-sm text-destructive">{errors.consent}</p>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={submitting} className="min-h-11 w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  )
}
