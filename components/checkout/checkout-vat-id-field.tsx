'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Check, Loader2, RefreshCw, X } from 'lucide-react'

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
import { cn } from '@/lib/utils'
import { EU_VIES_VAT_COUNTRY_CODES } from '@/lib/checkout/eu-member-states'
import { isIntraEuB2bGoodsEligible } from '@/lib/checkout/intra-eu-b2b-eligibility'
import {
  resolveCheckoutViesUiState,
  viesRequestKey,
} from '@/lib/checkout/vies-status'

export type CheckoutViesResult = {
  valid: boolean | null
  countryCode: string
  vatNumber: string
  name?: string | null
  address?: string | null
  message?: string | null
  source?: string | null
}

const EU_VAT_COUNTRIES = EU_VIES_VAT_COUNTRY_CODES
const EU_VAT_COUNTRY_SET = new Set<string>(EU_VAT_COUNTRIES)

const MIN_VAT_DIGITS = 4
const DEBOUNCE_MS = 1000

/** Parse leading ISO2 (e.g. HU17781774 / hu 17781774) → country + digits. */
export function parseVatInput(
  raw: string,
  currentCountry: string,
): { countryCode: string; vatNumber: string; countryChanged: boolean } {
  const compact = raw.replace(/\s+/g, '').toUpperCase()
  const match = compact.match(/^([A-Z]{2})(.*)$/)
  if (match && EU_VAT_COUNTRY_SET.has(match[1])) {
    const digits = match[2].replace(/\D/g, '')
    return {
      countryCode: match[1],
      vatNumber: digits,
      countryChanged: match[1] !== currentCountry.toUpperCase(),
    }
  }
  return {
    countryCode: currentCountry.toUpperCase(),
    vatNumber: compact.replace(/\D/g, ''),
    countryChanged: false,
  }
}

/**
 * Immediately invalidate prior VIES success when VAT digits/country change.
 * Exported for unit tests (stale quote protection).
 */
export function shouldClearViesOnVatChange(
  previousKey: string | null,
  nextCountry: string,
  nextDigits: string,
): boolean {
  const next = viesRequestKey(nextCountry, nextDigits)
  if (!previousKey) return false
  if (!nextDigits.replace(/\D/g, '').trim()) return true
  return previousKey !== next
}

export function CheckoutVatIdField({
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  onViesResult,
  buyerType = 'company',
  deliveryCountryCode,
}: {
  countryCode: string
  onCountryCodeChange?: (code: string) => void
  value: string
  onChange: (value: string) => void
  onViesResult?: (result: CheckoutViesResult | null) => void
  buyerType?: 'individual' | 'company'
  deliveryCountryCode?: string | null
}) {
  const t = useTranslations('checkout')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckoutViesResult | null>(null)
  const lastValidatedRef = useRef<string>('')
  const inFlightKeyRef = useRef<string>('')
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countryRef = useRef(countryCode)
  countryRef.current = countryCode

  const clearVerification = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    inFlightKeyRef.current = ''
    lastValidatedRef.current = ''
    setResult(null)
    setLoading(false)
    onViesResult?.(null)
  }, [onViesResult])

  const validate = useCallback(
    async (cc: string, vatNumber: string, opts?: { force?: boolean }) => {
      const digits = vatNumber.replace(/\D/g, '').trim()
      if (digits.length < MIN_VAT_DIGITS) {
        abortRef.current?.abort()
        abortRef.current = null
        inFlightKeyRef.current = ''
        lastValidatedRef.current = ''
        setLoading(false)
        if (!digits) {
          setResult(null)
          onViesResult?.(null)
        } else {
          const formatResult: CheckoutViesResult = {
            valid: null,
            countryCode: cc,
            vatNumber: digits,
            source: 'format',
            message: t('vatIdFormatError'),
          }
          setResult(formatResult)
          onViesResult?.(formatResult)
        }
        return
      }

      const key = viesRequestKey(cc, digits)
      if (!opts?.force && lastValidatedRef.current === key) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      inFlightKeyRef.current = key
      // Stale success must not linger while a new check runs.
      lastValidatedRef.current = ''
      setResult(null)
      onViesResult?.(null)
      setLoading(true)

      try {
        const res = await fetch('/api/checkout/vies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryCode: cc, vatNumber: digits }),
          signal: controller.signal,
        })
        const data = (await res.json()) as CheckoutViesResult & { error?: string }
        if (inFlightKeyRef.current !== key) return
        if (!res.ok) throw new Error('vies_http')
        lastValidatedRef.current = key
        setResult(data)
        onViesResult?.(data)
      } catch {
        if (controller.signal.aborted) return
        if (inFlightKeyRef.current !== key) return
        const fallback: CheckoutViesResult = {
          valid: null,
          countryCode: cc,
          vatNumber: digits,
          source: 'unavailable',
          // Customer UI uses i18n for ERROR — never surface raw HTTP/stack text.
          message: null,
        }
        lastValidatedRef.current = ''
        setResult(fallback)
        onViesResult?.(fallback)
      } finally {
        if (inFlightKeyRef.current === key) {
          setLoading(false)
        }
      }
    },
    [onViesResult, t],
  )

  const scheduleValidate = useCallback(
    (cc: string, vatNumber: string) => {
      const digits = vatNumber.replace(/\D/g, '').trim()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (digits.length >= MIN_VAT_DIGITS) {
        // Avoid showing stale VALID / empty-optional while debounce waits.
        setLoading(true)
        setResult(null)
      }
      debounceRef.current = setTimeout(() => {
        void validate(cc, vatNumber)
      }, DEBOUNCE_MS)
    },
    [validate],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const handleInputChange = (raw: string) => {
    const parsed = parseVatInput(raw, countryRef.current)
    if (parsed.countryChanged) {
      onCountryCodeChange?.(parsed.countryCode)
    }
    onChange(parsed.vatNumber)
    const prevKey = lastValidatedRef.current || inFlightKeyRef.current || null
    if (
      shouldClearViesOnVatChange(
        prevKey,
        parsed.countryChanged ? parsed.countryCode : countryRef.current,
        parsed.vatNumber,
      ) ||
      parsed.vatNumber !== value.replace(/\D/g, '')
    ) {
      clearVerification()
    }
    scheduleValidate(
      parsed.countryChanged ? parsed.countryCode : countryRef.current,
      parsed.vatNumber,
    )
  }

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    void validate(countryCode, value)
  }

  const handleCountryChange = (code: string) => {
    onCountryCodeChange?.(code)
    clearVerification()
    scheduleValidate(code, value)
  }

  const handleRetry = () => {
    void validate(countryCode, value, { force: true })
  }

  const uiState = resolveCheckoutViesUiState({
    vatDigits: value,
    loading,
    result,
  })

  const zeroEligible =
    result?.valid === true &&
    isIntraEuB2bGoodsEligible({
      buyerType,
      viesValid: true,
      vatCountryCode: countryCode,
      deliveryCountryCode,
    })

  const deliveryIsSk =
    (deliveryCountryCode ?? '').trim().toLowerCase() === 'sk'

  const statusMessage = (() => {
    switch (uiState) {
      case 'EMPTY':
        return t('vatIdOptionalHint')
      case 'CHECKING':
        return t('vatIdChecking')
      case 'FORMAT':
        return t('vatIdFormatError')
      case 'VALID':
        if (zeroEligible) {
          return `${t('vatIdVerified')} ${t('vatIdZeroEligible')}`
        }
        if (deliveryIsSk) {
          return `${t('vatIdVerified')} ${t('vatIdDeliverySkVatApplies')}`
        }
        return `${t('vatIdVerified')} ${t('vatIdVerifiedVatApplies')}`
      case 'INVALID':
        return t('vatIdInvalidContinue')
      case 'ERROR':
        return t('vatIdUnavailableContinue')
      default:
        return t('vatIdOptionalHint')
    }
  })()

  const statusIcon =
    uiState === 'CHECKING' ? (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
    ) : uiState === 'VALID' ? (
      <Check className="h-4 w-4 text-primary" aria-hidden />
    ) : uiState === 'INVALID' ? (
      <X className="h-4 w-4 text-destructive" aria-hidden />
    ) : uiState === 'ERROR' ? (
      <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden />
    ) : uiState === 'FORMAT' ? (
      <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
    ) : null

  const showRetry = uiState === 'ERROR' || uiState === 'INVALID'

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted p-4">
      <Label htmlFor="checkout-ic-dph">{t('vatIdLabel')}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onCountryCodeChange ? (
          <Select value={countryCode || 'SK'} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-full sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EU_VAT_COUNTRIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <div className="relative min-w-0 flex-1">
          <Input
            id="checkout-ic-dph"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={t('vatIdPlaceholder')}
            className={cn(
              'pr-10',
              uiState === 'VALID' && 'border-primary/50',
              uiState === 'ERROR' && 'border-amber-500/50',
              (uiState === 'INVALID' || uiState === 'FORMAT') && 'border-destructive/50',
            )}
            autoComplete="off"
            aria-busy={loading || undefined}
            aria-describedby="checkout-ic-dph-status"
          />
          {statusIcon ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              {statusIcon}
            </span>
          ) : null}
        </div>
      </div>
      <p
        id="checkout-ic-dph-status"
        role="status"
        className={cn(
          'text-xs',
          uiState === 'VALID'
            ? 'font-medium text-primary'
            : uiState === 'ERROR'
              ? 'text-amber-800 dark:text-amber-200'
              : uiState === 'INVALID' || uiState === 'FORMAT'
                ? 'text-destructive'
                : 'text-muted-foreground',
        )}
      >
        {statusMessage}
      </p>
      {showRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={handleRetry}
          className="h-8"
        >
          {loading ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden />
          )}
          {t('vatIdRetry')}
        </Button>
      ) : null}
    </div>
  )
}
