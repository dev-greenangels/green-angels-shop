'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  fetchVariantSalesPrices,
  salesPriceTierLines,
  type ProductSalesPriceRow,
} from '@/lib/backstage/product-variant-pricing'

export function VariantAbraSalesPrices({
  productId,
  variantId,
}: {
  productId?: string | null
  variantId?: string | null
}) {
  const t = useTranslations('productVariantPricing')
  const [rows, setRows] = useState<ProductSalesPriceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyDenied, setCompanyDenied] = useState(false)
  const [companyIncluded, setCompanyIncluded] = useState(false)
  const [includeCompany, setIncludeCompany] = useState(false)
  const [scopeFilter, setScopeFilter] = useState<'all' | 'ALL' | 'GROUP' | 'COMPANY'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!variantId) {
      setRows([])
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchVariantSalesPrices(variantId, {
      includeCompany: includeCompany || scopeFilter === 'COMPANY',
      scope: scopeFilter === 'all' ? undefined : scopeFilter,
      page,
      pageSize: 20,
    })
      .then((result) => {
        if (cancelled) return
        setRows(result.items)
        setCompanyDenied(result.companyDenied)
        setCompanyIncluded(result.companyIncluded)
        setTotalPages(result.totalPages)
        setTotal(result.total)
      })
      .catch((err) => {
        if (cancelled) return
        setRows([])
        setError(err instanceof Error ? err.message : t('abraLoadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [variantId, includeCompany, scopeFilter, page, t])

  if (!productId || !variantId) {
    return (
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('abraTitle')}
        </h4>
        <p className="text-xs text-muted-foreground">
          {!productId ? t('abraSaveProductFirst') : t('abraSaveVariantFirst')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('abraTitle')}
          </h4>
          <p className="text-[11px] text-muted-foreground">{t('abraHint')}</p>
        </div>
        <Link
          href="/backstage/settings"
          className="text-[11px] text-primary underline underline-offset-2"
        >
          {t('abraFlexiLink')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={scopeFilter}
          onValueChange={(v) => {
            setPage(1)
            setScopeFilter(v as typeof scopeFilter)
          }}
        >
          <SelectTrigger className="h-8 w-[9.5rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('scopeAll')}</SelectItem>
            <SelectItem value="ALL">ALL</SelectItem>
            <SelectItem value="GROUP">GROUP</SelectItem>
            <SelectItem value="COMPANY">COMPANY</SelectItem>
          </SelectContent>
        </Select>
        {!companyDenied ? (
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <input
              type="checkbox"
              checked={includeCompany}
              onChange={(e) => {
                setPage(1)
                setIncludeCompany(e.target.checked)
              }}
            />
            {t('includeCompany')}
          </label>
        ) : (
          <p className="text-[11px] text-muted-foreground">{t('companyDeniedHint')}</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('loading')}
        </div>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : !rows.length ? (
        <p className="text-xs text-muted-foreground">{t('abraEmpty')}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-md border border-border/50 bg-background/80 px-2.5 py-2 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {row.scope}
                </Badge>
                <Badge
                  variant={
                    row.validityStatus === 'ACTIVE'
                      ? 'default'
                      : row.validityStatus === 'SCHEDULED'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-[10px]"
                >
                  {t(`validity_${row.validityStatus}`)}
                </Badge>
                <span className="text-muted-foreground">{row.currency}</span>
                {row.priceGroupCode ? (
                  <span className="font-mono text-[11px]">{row.priceGroupCode}</span>
                ) : null}
                {row.flexiFirmaKod ? (
                  <span className="font-mono text-[11px]">{row.flexiFirmaKod}</span>
                ) : null}
              </div>
              <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                {salesPriceTierLines(row).map((tier) => (
                  <li key={`${row.id}-${tier.minQty}`}>
                    ≥{tier.minQty}:{' '}
                    <span className="font-medium text-foreground tabular-nums">
                      {tier.unitPrice}
                    </span>
                  </li>
                ))}
              </ul>
              {(row.validFrom || row.validTo) && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {row.validFrom?.slice(0, 10) ?? '…'} — {row.validTo?.slice(0, 10) ?? '…'}
                </p>
              )}
            </div>
          ))}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-muted-foreground">
                {t('pageOf', { page, totalPages, total })}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('prev')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('next')}
                </Button>
              </div>
            </div>
          ) : null}
          {companyIncluded ? (
            <p className="text-[10px] text-muted-foreground">{t('companyIncludedHint')}</p>
          ) : null}
        </div>
      )}
    </div>
  )
}
