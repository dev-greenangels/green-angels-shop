'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputWithClear } from '@/components/ui/input-with-clear'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { submitPublicContractWithdrawal } from '@/lib/contract-withdrawals/api'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import {
  EMPTY_CONTRACT_WITHDRAWAL_FORM,
  sanitizeEmail,
  sanitizeOptionalPhone,
  sanitizeOrderNumber,
  sanitizePartialItemsText,
  sanitizePersonName,
  validateContractWithdrawalForm,
  type ContractWithdrawalFormValues,
} from '@/lib/validation/contract-withdrawal-form'

type ContractWithdrawalPublicFormProps = {
  id?: string
}

const scopeOptionClassName = (selected: boolean) =>
  cn(
    'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-[border-color,background-color,box-shadow]',
    selected
      ? 'border-primary bg-primary/10 shadow-sm'
      : 'border-border bg-background hover:border-primary/45',
  )

const scopeRadioClassName =
  'mt-0.5 size-[1.125rem] border-2 border-foreground/40 text-primary shadow-none data-[state=checked]:border-primary'

export function ContractWithdrawalPublicForm({ id }: ContractWithdrawalPublicFormProps) {
  const t = useTranslations('contractWithdrawal')
  const locale = useLocale()
  const [values, setValues] = useState<ContractWithdrawalFormValues>(EMPTY_CONTRACT_WITHDRAWAL_FORM)
  const [startedAt] = useState(() => Date.now())
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [result, setResult] = useState<{ referenceNumber: string; submittedAt: string } | null>(null)

  const errorMessages = useMemo(
    () => ({
      customerName: t('errors.customerName'),
      email: t('errors.email'),
      orderNumber: t('errors.orderNumber'),
      partialItemsText: t('errors.partialItemsText'),
    }),
    [t],
  )

  const errors = validateContractWithdrawalForm(values, errorMessages)
  const hasErrors = Object.keys(errors).length > 0

  const patch = (key: keyof ContractWithdrawalFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const buildPayload = () => ({
    customerName: sanitizePersonName(values.customerName).trim(),
    email: sanitizeEmail(values.email).trim(),
    orderNumber: sanitizeOrderNumber(values.orderNumber).trim(),
    scope: values.scope,
    phone: sanitizeOptionalPhone(values.phone) || undefined,
    partialItemsText:
      values.scope === 'PARTIAL'
        ? sanitizePartialItemsText(values.partialItemsText).trim() || undefined
        : undefined,
    locale,
    fax: values.fax,
    startedAt,
  })

  const onReview = (event: React.FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (hasErrors) return
    setStep('confirm')
  }

  const onConfirm = async () => {
    setSubmitting(true)
    try {
      const response = await submitPublicContractWithdrawal(buildPayload())
      setResult(response)
      setStep('done')
      toast.success(t('successTitle'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errors.submit'))
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done' && result) {
    return (
      <div
        id={id}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8"
        aria-live="polite"
      >
        <h3 className="font-serif text-xl font-semibold text-foreground">{t('successTitle')}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('successBody')}</p>
        <dl className="mt-4 space-y-2 rounded-lg border border-border/60 bg-background/80 p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">{t('referenceLabel')}</dt>
            <dd className="font-medium tabular-nums text-foreground">{result.referenceNumber}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">{t('submittedAtLabel')}</dt>
            <dd className="font-medium text-foreground">
              {formatDateTime(result.submittedAt, locale, 'datetime')}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">{t('disclaimer')}</p>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div id={id} className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h3 className="font-serif text-xl font-semibold text-foreground">{t('confirmTitle')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('confirmHint')}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('fields.customerName')}</dt>
            <dd className="font-medium">{sanitizePersonName(values.customerName).trim()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('fields.email')}</dt>
            <dd className="font-medium">{sanitizeEmail(values.email).trim()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('fields.orderNumber')}</dt>
            <dd className="font-medium">{sanitizeOrderNumber(values.orderNumber).trim()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('fields.scope')}</dt>
            <dd className="font-medium">
              {values.scope === 'ENTIRE_ORDER' ? t('scope.entireOrder') : t('scope.partial')}
            </dd>
          </div>
          {values.scope === 'PARTIAL' ? (
            <div>
              <dt className="text-muted-foreground">{t('fields.partialItemsText')}</dt>
              <dd className="whitespace-pre-wrap font-medium">
                {sanitizePartialItemsText(values.partialItemsText).trim()}
              </dd>
            </div>
          ) : null}
          {sanitizeOptionalPhone(values.phone) ? (
            <div>
              <dt className="text-muted-foreground">{t('fields.phone')}</dt>
              <dd className="font-medium">{sanitizeOptionalPhone(values.phone)}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => setStep('form')} disabled={submitting}>
            {t('confirmBack')}
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('submit')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form id={id} onSubmit={onReview} className="space-y-5 rounded-2xl border border-border/80 bg-background/90 p-5 md:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <RequiredLabel htmlFor="cw-customerName">{t('fields.customerName')}</RequiredLabel>
          <InputWithClear
            id="cw-customerName"
            autoComplete="name"
            value={values.customerName}
            onChange={(e) => patch('customerName', sanitizePersonName(e.target.value))}
            onClear={() => patch('customerName', '')}
            aria-invalid={showErrors && Boolean(errors.customerName)}
          />
          {showErrors && errors.customerName ? (
            <p className="text-sm text-destructive">{errors.customerName}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <RequiredLabel htmlFor="cw-email">{t('fields.email')}</RequiredLabel>
          <InputWithClear
            id="cw-email"
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
        <div className="space-y-2">
          <RequiredLabel htmlFor="cw-orderNumber">{t('fields.orderNumber')}</RequiredLabel>
          <InputWithClear
            id="cw-orderNumber"
            inputMode="numeric"
            value={values.orderNumber}
            onChange={(e) => patch('orderNumber', sanitizeOrderNumber(e.target.value))}
            onClear={() => patch('orderNumber', '')}
            aria-invalid={showErrors && Boolean(errors.orderNumber)}
          />
          {showErrors && errors.orderNumber ? (
            <p className="text-sm text-destructive">{errors.orderNumber}</p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cw-phone">{t('fields.phone')}</Label>
          <Input
            id="cw-phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => patch('phone', sanitizeOptionalPhone(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>{t('fields.scope')}</Label>
        <RadioGroup
          value={values.scope}
          onValueChange={(value) => patch('scope', value)}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className={scopeOptionClassName(values.scope === 'ENTIRE_ORDER')}>
            <RadioGroupItem value="ENTIRE_ORDER" className={scopeRadioClassName} />
            <span className="font-medium">{t('scope.entireOrder')}</span>
          </label>
          <label className={scopeOptionClassName(values.scope === 'PARTIAL')}>
            <RadioGroupItem value="PARTIAL" className={scopeRadioClassName} />
            <span className="font-medium">{t('scope.partial')}</span>
          </label>
        </RadioGroup>
      </div>

      {values.scope === 'PARTIAL' ? (
        <div className="space-y-2">
          <RequiredLabel htmlFor="cw-partialItems">{t('fields.partialItemsText')}</RequiredLabel>
          <Textarea
            id="cw-partialItems"
            rows={4}
            placeholder={t('fields.partialItemsPlaceholder')}
            value={values.partialItemsText}
            onChange={(e) => patch('partialItemsText', sanitizePartialItemsText(e.target.value))}
            aria-invalid={showErrors && Boolean(errors.partialItemsText)}
          />
          {showErrors && errors.partialItemsText ? (
            <p className="text-sm text-destructive">{errors.partialItemsText}</p>
          ) : null}
        </div>
      ) : null}

      <input
        type="text"
        name="fax"
        value={values.fax}
        onChange={(e) => patch('fax', e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      <Button type="submit" className="w-full sm:w-auto">
        {t('review')}
      </Button>
    </form>
  )
}
