'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  fetchAccountWithdrawalMeta,
  submitAccountContractWithdrawal,
  type AccountWithdrawalMeta,
  type AccountWithdrawalMetaItem,
} from '@/lib/contract-withdrawals/api'
import { formatDateTime } from '@/lib/i18n/format-datetime'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

type LineSelection = Record<string, { checked: boolean; quantity: number }>

function buildInitialSelection(items: AccountWithdrawalMetaItem[]): LineSelection {
  return Object.fromEntries(
    items.map((item) => [item.id, { checked: true, quantity: item.quantity }]),
  )
}

type ContractWithdrawalAccountDialogProps = {
  orderId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ContractWithdrawalAccountDialog({
  orderId,
  open: controlledOpen,
  onOpenChange,
}: ContractWithdrawalAccountDialogProps) {
  const t = useTranslations('contractWithdrawal.account')
  const locale = useLocale()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<AccountWithdrawalMeta | null>(null)
  const [scope, setScope] = useState<'ENTIRE_ORDER' | 'PARTIAL'>('ENTIRE_ORDER')
  const [selection, setSelection] = useState<LineSelection>({})
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ referenceNumber: string; submittedAt: string } | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setStep('form')
    setResult(null)
    void fetchAccountWithdrawalMeta(orderId)
      .then((data) => {
        if (cancelled) return
        setMeta(data)
        setSelection(buildInitialSelection(data.items))
        setScope('ENTIRE_ORDER')
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof Error ? err.message : t('loadError'))
        setOpen(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, orderId, t])

  const selectedLines = useMemo(() => {
    if (!meta) return []
    return meta.items
      .filter((item) => selection[item.id]?.checked)
      .map((item) => ({
        orderItemId: item.id,
        quantity: Math.min(selection[item.id]?.quantity ?? item.quantity, item.quantity),
      }))
      .filter((line) => line.quantity > 0)
  }, [meta, selection])

  const canProceed =
    scope === 'ENTIRE_ORDER' || (scope === 'PARTIAL' && selectedLines.length > 0)

  const onConfirm = async () => {
    if (!meta) return
    setSubmitting(true)
    try {
      const response = await submitAccountContractWithdrawal({
        orderId,
        scope,
        lineItems: scope === 'PARTIAL' ? selectedLines : undefined,
        locale,
      })
      setResult(response)
      setStep('done')
      toast.success(t('successTitle'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setStep('form')
          setResult(null)
        }
      }}
    >
      {controlledOpen === undefined ? (
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            {t('cta')}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[min(90dvh,40rem)] overflow-y-auto sm:max-w-lg">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('loading')}
          </div>
        ) : step === 'done' && result ? (
          <div className="space-y-4" aria-live="polite">
            <DialogHeader>
              <DialogTitle>{t('successTitle')}</DialogTitle>
              <DialogDescription>{t('successBody')}</DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('referenceLabel')}</dt>
                <dd className="font-medium tabular-nums">{result.referenceNumber}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{t('submittedAtLabel')}</dt>
                <dd className="font-medium">
                  {formatDateTime(result.submittedAt, locale, 'datetime')}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">{t('successDisclaimer')}</p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                {t('close')}
              </Button>
            </DialogFooter>
          </div>
        ) : step === 'confirm' && meta ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t('confirmTitle')}</DialogTitle>
              <DialogDescription>{t('confirmHint')}</DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('orderLabel')}</dt>
                <dd className="font-medium">{meta.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('emailLabel')}</dt>
                <dd className="font-medium">{meta.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('scopeLabel')}</dt>
                <dd className="font-medium">
                  {scope === 'ENTIRE_ORDER' ? t('scopeEntire') : t('scopePartial')}
                </dd>
              </div>
              {scope === 'PARTIAL' ? (
                <div>
                  <dt className="text-muted-foreground">{t('itemsLabel')}</dt>
                  <dd className="mt-1 space-y-1">
                    {selectedLines.map((line) => {
                      const item = meta.items.find((row) => row.id === line.orderItemId)
                      if (!item) return null
                      return (
                        <p key={line.orderItemId} className="font-medium">
                          {item.label} — {line.quantity}
                        </p>
                      )
                    })}
                  </dd>
                </div>
              ) : null}
            </dl>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setStep('form')} disabled={submitting}>
                {t('back')}
              </Button>
              <Button type="button" onClick={() => void onConfirm()} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('confirmSubmit')}
              </Button>
            </DialogFooter>
          </div>
        ) : meta ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t('title')}</DialogTitle>
              <DialogDescription>
                {t('subtitle', { orderNumber: meta.orderNumber })}
              </DialogDescription>
            </DialogHeader>

            <RadioGroup
              value={scope}
              onValueChange={(value) => setScope(value as 'ENTIRE_ORDER' | 'PARTIAL')}
              className="grid gap-3"
            >
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-[border-color,background-color,box-shadow]',
                  scope === 'ENTIRE_ORDER'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-background hover:border-primary/45',
                )}
              >
                <RadioGroupItem
                  value="ENTIRE_ORDER"
                  className="mt-0.5 size-[1.125rem] border-2 border-foreground/40 text-primary shadow-none data-[state=checked]:border-primary"
                />
                <span className="font-medium">{t('scopeEntire')}</span>
              </label>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-[border-color,background-color,box-shadow]',
                  scope === 'PARTIAL'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-background hover:border-primary/45',
                )}
              >
                <RadioGroupItem
                  value="PARTIAL"
                  className="mt-0.5 size-[1.125rem] border-2 border-foreground/40 text-primary shadow-none data-[state=checked]:border-primary"
                />
                <span className="font-medium">{t('scopePartial')}</span>
              </label>
            </RadioGroup>

            {scope === 'PARTIAL' ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">{t('selectItems')}</p>
                <ul className="space-y-3">
                  {meta.items.map((item) => {
                    const row = selection[item.id] ?? { checked: false, quantity: item.quantity }
                    return (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 p-3"
                      >
                        <Checkbox
                          checked={row.checked}
                          onCheckedChange={(checked) =>
                            setSelection((current) => ({
                              ...current,
                              [item.id]: {
                                ...row,
                                checked: checked === true,
                              },
                            }))
                          }
                          aria-label={item.label}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('maxQty', { qty: item.quantity })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`cw-qty-${item.id}`} className="sr-only">
                            {t('quantity')}
                          </Label>
                          <Input
                            id={`cw-qty-${item.id}`}
                            type="number"
                            min={1}
                            max={item.quantity}
                            disabled={!row.checked}
                            className="w-20"
                            value={row.quantity}
                            onChange={(e) => {
                              const qty = Number(e.target.value)
                              setSelection((current) => ({
                                ...current,
                                [item.id]: {
                                  ...row,
                                  quantity: Number.isFinite(qty)
                                    ? Math.min(Math.max(1, qty), item.quantity)
                                    : 1,
                                },
                              }))
                            }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" onClick={() => setStep('confirm')} disabled={!canProceed}>
                {t('submit')}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
