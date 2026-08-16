'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2, X } from 'lucide-react'

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

type ViesResult = {
  valid: boolean | null
  countryCode: string
  vatNumber: string
  name?: string | null
  address?: string | null
  message?: string | null
}

const EU_VAT_COUNTRIES = [
  'AT',
  'BE',
  'BG',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'EL',
  'ES',
  'FI',
  'FR',
  'HR',
  'HU',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SE',
  'SI',
  'SK',
] as const

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

export function CheckoutVatIdField({
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  onViesResult,
}: {
  countryCode: string
  onCountryCodeChange?: (code: string) => void
  value: string
  onChange: (value: string) => void
  onViesResult?: (result: ViesResult | null) => void
}) {
  const t = useTranslations('checkout')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ViesResult | null>(null)
  const lastValidatedRef = useRef<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countryRef = useRef(countryCode)
  countryRef.current = countryCode

  const validate = useCallback(
    async (cc: string, vatNumber: string) => {
      const digits = vatNumber.replace(/\D/g, '').trim()
      if (digits.length < MIN_VAT_DIGITS) {
        setResult(null)
        onViesResult?.(null)
        lastValidatedRef.current = ''
        return
      }

      const key = `${cc.toUpperCase()}:${digits}`
      if (lastValidatedRef.current === key) return

      setLoading(true)
      try {
        const res = await fetch('/api/checkout/vies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ countryCode: cc, vatNumber: digits }),
        })
        const data = (await res.json()) as ViesResult & { error?: string }
        if (!res.ok) throw new Error(data.error || data.message || 'VIES error')
        lastValidatedRef.current = key
        setResult(data)
        onViesResult?.(data)
      } catch (err) {
        const fallback: ViesResult = {
          valid: null,
          countryCode: cc,
          vatNumber: digits,
          message: err instanceof Error ? err.message : 'VIES unavailable',
        }
        lastValidatedRef.current = ''
        setResult(fallback)
        onViesResult?.(fallback)
      } finally {
        setLoading(false)
      }
    },
    [onViesResult],
  )

  const scheduleValidate = useCallback(
    (cc: string, vatNumber: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        void validate(cc, vatNumber)
      }, DEBOUNCE_MS)
    },
    [validate],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleInputChange = (raw: string) => {
    const parsed = parseVatInput(raw, countryRef.current)
    if (parsed.countryChanged) {
      onCountryCodeChange?.(parsed.countryCode)
    }
    onChange(parsed.vatNumber)
    if (parsed.vatNumber !== value.replace(/\D/g, '')) {
      setResult(null)
      lastValidatedRef.current = ''
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
    setResult(null)
    lastValidatedRef.current = ''
    scheduleValidate(code, value)
  }

  const statusIcon = loading ? (
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
  ) : result?.valid === true ? (
    <Check className="h-4 w-4 text-primary" aria-hidden />
  ) : result?.valid === false || (result && result.valid === null) ? (
    <X className="h-4 w-4 text-destructive" aria-hidden />
  ) : null

  const statusMessage = (() => {
    if (loading) return null
    if (result?.valid === true) {
      if (countryCode.toUpperCase() !== 'SK') {
        return t('vatIdConfirmedWithZeroDph')
      }
      return t('vatIdConfirmed')
    }
    if (result?.valid === false) return t('vatIdInvalid')
    if (result?.valid === null) return result.message || t('vatIdUnavailable')
    return t('vatIdHint')
  })()

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-muted p-4">
      <Label htmlFor="checkout-ic-dph">{t('vatIdLabel')}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onCountryCodeChange ? (
          <Select value={countryCode} onValueChange={handleCountryChange}>
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
            className={cn('pr-10', result?.valid === true && 'border-primary/50')}
            autoComplete="off"
          />
          {statusIcon ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              {statusIcon}
            </span>
          ) : null}
        </div>
      </div>
      {statusMessage ? (
        <p
          className={cn(
            'text-xs',
            result?.valid === true
              ? 'font-medium text-primary'
              : result?.valid === false || result?.valid === null
                ? 'text-destructive'
                : 'text-muted-foreground',
          )}
        >
          {statusMessage}
        </p>
      ) : null}
    </div>
  )
}
