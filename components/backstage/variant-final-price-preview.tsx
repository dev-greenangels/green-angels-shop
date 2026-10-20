'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { PromoUserPicker } from '@/components/backstage/promo-user-picker'
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
  previewVariantPrice,
} from '@/lib/backstage/product-variant-pricing'
import type {
  DiscountRulePreviewResult,
  PromoEligibleAudience,
} from '@/lib/backstage/pricing'

type PreviewMode = 'GUEST' | 'REGISTERED' | 'WHOLESALER'

export function VariantFinalPricePreview({
  variantId,
}: {
  variantId?: string | null
}) {
  const t = useTranslations('productVariantPricing')
  const [qty, setQty] = useState('1')
  const [mode, setMode] = useState<PreviewMode>('GUEST')
  const [userIds, setUserIds] = useState<string[]>([])
  const [users, setUsers] = useState<
    Array<{
      id: string
      firstName: string | null
      lastName: string | null
      phone: string | null
      email: string | null
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DiscountRulePreviewResult | null>(null)

  const run = async () => {
    if (!variantId) return
    setLoading(true)
    setError(null)
    try {
      const audience: PromoEligibleAudience =
        mode === 'WHOLESALER' ? 'WHOLESALER' : 'RETAIL'
      const data = await previewVariantPrice({
        productVariantId: variantId,
        quantity: Math.max(1, Number(qty) || 1),
        audience,
        registrationPreview: mode === 'GUEST' ? 'GUEST' : 'REGISTERED',
        previewUserId: mode === 'WHOLESALER' ? userIds[0] : undefined,
      })
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : t('previewError'))
    } finally {
      setLoading(false)
    }
  }

  if (!variantId) {
    return (
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('previewTitle')}
        </h4>
        <p className="text-xs text-muted-foreground">{t('previewSaveFirst')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('previewTitle')}
        </h4>
        <p className="text-[11px] text-muted-foreground">{t('previewHint')}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">{t('previewQty')}</Label>
          <Input
            type="number"
            min={1}
            className="h-8 text-sm"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">{t('previewAudience')}</Label>
          <Select
            value={mode}
            onValueChange={(v) => {
              setMode(v as PreviewMode)
              if (v !== 'WHOLESALER') {
                setUserIds([])
                setUsers([])
              }
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GUEST">{t('audienceGuest')}</SelectItem>
              <SelectItem value="REGISTERED">{t('audienceRegistered')}</SelectItem>
              <SelectItem value="WHOLESALER">{t('audienceWholesale')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {mode === 'WHOLESALER' ? (
        <div className="space-y-1">
          <PromoUserPicker
            label={t('previewWholesaler')}
            roleFilter="WHOLESALER"
            maxSelected={1}
            selectedIds={userIds}
            selectedUsers={users}
            onChange={(ids, nextUsers) => {
              setUserIds(ids.slice(0, 1))
              setUsers(nextUsers.slice(0, 1))
            }}
          />
          {!userIds[0] ? (
            <p className="text-[11px] text-muted-foreground">{t('previewNoCompanyHint')}</p>
          ) : null}
        </div>
      ) : null}

      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="h-8"
        disabled={loading}
        onClick={() => void run()}
      >
        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
        {t('runPreview')}
      </Button>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {result ? (
        <div className="space-y-1 rounded-md border border-border/50 bg-background/80 p-2.5 text-xs">
          <p>
            <span className="text-muted-foreground">{t('resultCard')}: </span>
            <span className="tabular-nums">{result.productCardUnitPrice ?? '—'}</span>
          </p>
          <p>
            <span className="text-muted-foreground">{t('resultSales')}: </span>
            {result.salesPrice ? (
              <span className="tabular-nums">
                {result.salesPrice.unitPrice} ({result.salesPrice.scope}
                {result.salesPrice.appliedMinQuantity > 1
                  ? ` ≥${result.salesPrice.appliedMinQuantity}`
                  : ''}
                {!result.companyPriceExact && result.salesPrice.scope === 'COMPANY'
                  ? ` · ${t('notCompanyExact')}`
                  : ''}
                )
              </span>
            ) : (
              '—'
            )}
          </p>
          {result.retailOffer ? (
            <p>
              <span className="text-muted-foreground">{t('resultRetail')}: </span>
              <span className="tabular-nums">{result.retailOffer.unitPrice}</span>
              <span className="text-muted-foreground">
                {' '}
                ({result.retailOffer.appliedSource}
                {result.retailOffer.appliedLabel
                  ? ` · ${result.retailOffer.appliedLabel}`
                  : ''}
                )
              </span>
            </p>
          ) : null}
          {result.wholesaleOffer ? (
            <p>
              <span className="text-muted-foreground">{t('resultWholesale')}: </span>
              <span className="tabular-nums">{result.wholesaleOffer.unitPrice}</span>
              <span className="text-muted-foreground">
                {' '}
                ({result.wholesaleOffer.appliedSource}
                {result.wholesaleOffer.appliedLabel
                  ? ` · ${result.wholesaleOffer.appliedLabel}`
                  : ''}
                )
              </span>
            </p>
          ) : null}
          <p className="font-medium">
            {t('resultFinal')}:{' '}
            <span className="tabular-nums">{result.finalUnitPrice}</span>
            <span className="font-normal text-muted-foreground">
              {' '}
              ({result.winner}
              {result.companyPriceExact ? ` · ${t('companyExact')}` : ''})
            </span>
          </p>
        </div>
      ) : !loading && !error ? (
        <p className="text-[11px] text-muted-foreground">{t('previewEmpty')}</p>
      ) : null}
    </div>
  )
}
