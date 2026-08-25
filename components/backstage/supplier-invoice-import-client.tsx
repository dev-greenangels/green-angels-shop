'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Trash2, Upload, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/lib/toast'
import {
  createSupplierInvoiceInFlexi,
  createSupplierWarehouseInFlexi,
  DEFAULT_GEMINI_INVOICE_MODEL,
  deleteSupplierInvoiceDraft,
  fetchActiveSupplierInvoiceDraft,
  fetchSupplierInvoiceDraft,
  GEMINI_INVOICE_MODEL_OPTIONS,
  getStoredDraftId,
  linesToEditablePayload,
  buildInvoiceHeaderForm,
  rematchSupplierInvoiceLines,
  updateSupplierInvoiceDraft,
  type InvoiceHeaderForm,
  type CreateInvoiceLine,
  type CreateSupplierInvoicePayload,
  type InvoiceLinePreview,
  type SupplierInvoiceDraftResponse,
  type SupplierInvoiceParseOptions,
  type WarehouseMovement,
  type WarehouseVoucherType,
  uploadSupplierInvoiceDraft,
} from '@/lib/backstage/supplier-invoices'

const SIZE_PRESETS = ['C2', 'P9', 'P11', 'C1.5', 'CUT'] as const
const STOCK_PRESETS = ['WHMAIN', 'WHGROW', 'WHMAT'] as const
const STOCK_NONE = '__none__'

type BulkField = 'abraCode' | 'batchNumber' | 'stockCode'
type DocumentKind = 'invoice' | 'warehouse'

function reindexLines(items: CreateInvoiceLine[]): CreateInvoiceLine[] {
  return items.map((line, i) => ({ ...line, lineIndex: i }))
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function roundUnitPrice(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000
}

function lineAmount(line: CreateInvoiceLine): number {
  if (line.lineTotal != null && Number.isFinite(line.lineTotal)) return line.lineTotal
  return roundMoney(line.quantity * line.unitPrice)
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words font-medium text-foreground">{value}</span>
    </div>
  )
}

export function SupplierInvoiceImportClient() {
  const t = useTranslations('supplierInvoices')

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [draft, setDraft] = useState<SupplierInvoiceDraftResponse | null>(null)
  const [lines, setLines] = useState<CreateInvoiceLine[]>([])
  const [payload, setPayload] = useState<CreateSupplierInvoicePayload | null>(null)
  const [header, setHeader] = useState<InvoiceHeaderForm | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [bulkField, setBulkField] = useState<BulkField>('abraCode')
  const [bulkValue, setBulkValue] = useState('')
  const [documentKind, setDocumentKind] = useState<DocumentKind>('invoice')
  const [voucherType, setVoucherType] = useState<WarehouseVoucherType>('STANDARD')
  const [movement, setMovement] = useState<WarehouseMovement>('prijem')
  const [warehouseIssueDate, setWarehouseIssueDate] = useState('')
  const [targetStockCode, setTargetStockCode] = useState('WHMAIN')
  const [rematchSize, setRematchSize] = useState('CUT')
  const [rematching, setRematching] = useState(false)

  const [options, setOptions] = useState<SupplierInvoiceParseOptions>({
    defaultSizeLabel: 'C2',
    targetStockCode: 'WHGROW',
    priceIncludesVat: true,
    locale: 'en',
    geminiModel: DEFAULT_GEMINI_INVOICE_MODEL,
  })

  const pdfUrl = useMemo(() => {
    if (!draft?.pdfBase64) return null
    const binary = atob(draft.pdfBase64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    return URL.createObjectURL(blob)
  }, [draft?.pdfBase64])

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const hydrateDraft = useCallback((data: SupplierInvoiceDraftResponse) => {
    setDraft(data)
    setOptions({
      ...data.meta.parseOptions,
      locale: data.meta.parseOptions.locale || 'en',
      geminiModel: data.meta.parseOptions.geminiModel || DEFAULT_GEMINI_INVOICE_MODEL,
    })
    const defaultStock = data.meta.parseOptions.targetStockCode
    const fromMeta = linesToEditablePayload(
      data.meta.editedLines ?? data.meta.lines ?? [],
      defaultStock,
    )
    const fromPayload = data.createPayload?.lines
    if (fromPayload?.length) {
      setLines(
        fromPayload.map((line, i) => ({
          ...line,
          hsCode: line.hsCode ?? fromMeta[i]?.hsCode,
          sku: line.sku ?? fromMeta[i]?.sku,
          batchNumber: line.batchNumber ?? fromMeta[i]?.batchNumber,
          stockCode: line.stockCode ?? fromMeta[i]?.stockCode,
        })),
      )
    } else {
      setLines(fromMeta)
    }
    setPayload(data.createPayload)
    if (data.meta.parsed) {
      setHeader(buildInvoiceHeaderForm(data.meta.parsed, data.createPayload))
      setWarehouseIssueDate(
        data.createPayload?.issueDate ?? data.meta.parsed.invoice.issueDate ?? '',
      )
    } else {
      setHeader(null)
    }
    setSelectedIndices(new Set())
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const storedId = getStoredDraftId()
        const active = await fetchActiveSupplierInvoiceDraft()
        if (cancelled) return
        if (active) {
          hydrateDraft(active)
        } else if (storedId) {
          try {
            const byId = await fetchSupplierInvoiceDraft(storedId)
            if (!cancelled) hydrateDraft(byId)
          } catch {
            /* expired */
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrateDraft, t])

  const handleUpload = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadSupplierInvoiceDraft(file, options)
      hydrateDraft(result)
      if (result.warnings?.length) {
        toast.error(result.warnings.join('; '))
      } else {
        toast.success(t('parsedOk'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('uploadError'))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!draft?.meta.draftId) return
    setDeleting(true)
    try {
      await deleteSupplierInvoiceDraft(draft.meta.draftId)
      setDraft(null)
      setLines([])
      setPayload(null)
      setHeader(null)
      toast.success(t('deletedOk'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const updateLine = (index: number, patch: Partial<CreateInvoiceLine>) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line
        const next = { ...line, ...patch }
        if (patch.lineTotal != null) {
          next.lineTotal = roundMoney(patch.lineTotal)
          if (next.quantity > 0) {
            next.unitPrice = roundUnitPrice(next.lineTotal / next.quantity)
          }
        } else if (patch.quantity != null || patch.unitPrice != null) {
          next.lineTotal = roundMoney(next.quantity * next.unitPrice)
        }
        return next
      }),
    )
  }

  const allSelected = lines.length > 0 && selectedIndices.size === lines.length
  const someSelected = selectedIndices.size > 0

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIndices(new Set(lines.map((_, i) => i)))
    else setSelectedIndices(new Set())
  }

  const toggleSelectLine = (index: number, checked: boolean) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (checked) next.add(index)
      else next.delete(index)
      return next
    })
  }

  const applyBulkEdit = () => {
    if (selectedIndices.size === 0) return
    setLines((prev) =>
      reindexLines(
        prev.map((line, i) => {
          if (!selectedIndices.has(i)) return line
          if (bulkField === 'abraCode') {
            return { ...line, abraCode: bulkValue.trim() }
          }
          if (bulkField === 'batchNumber') {
            return { ...line, batchNumber: bulkValue.trim() || undefined }
          }
          if (bulkField === 'stockCode') {
            const code =
              bulkValue === STOCK_NONE || !bulkValue.trim() ? '' : bulkValue.trim()
            return { ...line, stockCode: code }
          }
          return line
        }),
      ),
    )
    toast.success(t('bulkApplied', { count: selectedIndices.size }))
  }

  const deleteSelectedLines = () => {
    if (selectedIndices.size === 0) return
    const count = selectedIndices.size
    setLines((prev) => reindexLines(prev.filter((_, i) => !selectedIndices.has(i))))
    setSelectedIndices(new Set())
    toast.success(t('linesDeleted', { count }))
  }

  const persistLines = async () => {
    if (!draft?.meta.draftId) return
    await updateSupplierInvoiceDraft(draft.meta.draftId, lines)
  }

  const handleRematch = async () => {
    if (!draft?.meta.draftId) return
    const size = rematchSize.trim()
    if (!size) {
      toast.error(t('rematchSizeRequired'))
      return
    }
    setRematching(true)
    try {
      await persistLines()
      const indexes =
        selectedIndices.size > 0 ? Array.from(selectedIndices).sort((a, b) => a - b) : undefined
      const result = await rematchSupplierInvoiceLines(draft.meta.draftId, size, indexes)
      hydrateDraft(result)
      setOptions((o) => ({ ...o, defaultSizeLabel: size }))
      toast.success(
        t('rematchOk', {
          count: indexes?.length ?? result.meta.editedLines?.length ?? 0,
          size,
        }),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('rematchError'))
    } finally {
      setRematching(false)
    }
  }

  const refreshDraftAfterSend = async (draftId: string) => {
    try {
      const fresh = await fetchSupplierInvoiceDraft(draftId)
      hydrateDraft(fresh)
    } catch {
      /* draft may still be usable from memory */
    }
  }

  const handleSubmit = async () => {
    if (!draft?.meta.draftId || !payload) return
    const draftId = draft.meta.draftId

    if (documentKind === 'warehouse') {
      if (!warehouseIssueDate.trim()) {
        toast.error(t('warehouseIssueDateRequired'))
        return
      }
      if (voucherType === 'PREVODKA' && !targetStockCode.trim()) {
        toast.error(t('prevodkaTargetRequired'))
        return
      }
      if (lines.some((l) => !l.abraCode.trim())) {
        toast.error(t('abraCodeRequired'))
        return
      }
      setSubmitting(true)
      try {
        const result = await createSupplierWarehouseInFlexi(draftId, {
          voucherType,
          movement,
          issueDate: warehouseIssueDate.trim(),
          stockCode: options.targetStockCode,
          targetStockCode: voucherType === 'PREVODKA' ? targetStockCode : undefined,
          lines,
        })
        if (result.ok) {
          toast.success(result.message)
          await refreshDraftAfterSend(draftId)
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('submitError'))
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!header) return
    const nextPayload: CreateSupplierInvoicePayload = {
      ...payload,
      invoiceNumber: header.invoiceNumber.trim(),
      issueDate: header.issueDate.trim(),
      dueDate: header.dueDate.trim(),
      taxDate: header.taxDate.trim() || undefined,
      currency: header.currency.trim().toUpperCase(),
      variableSymbol: header.variableSymbol.trim() || undefined,
      orderReference: header.orderReference.trim() || undefined,
      deliveryNoteNumber: header.deliveryNoteNumber.trim() || undefined,
      targetStockCode: options.targetStockCode,
      priceIncludesVat: options.priceIncludesVat,
      lines,
    }
    setSubmitting(true)
    try {
      const result = await createSupplierInvoiceInFlexi(draftId, nextPayload)
      if (result.ok) {
        toast.success(result.message)
        await refreshDraftAfterSend(draftId)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const parsed = draft?.meta.parsed
  const sends = draft?.meta.sends ?? []
  const totals = useMemo(() => {
    const quantity = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0), 0)
    const amount = lines.reduce((sum, line) => sum + lineAmount(line), 0)
    return { quantity, amount: roundMoney(amount) }
  }, [lines])

  const canSubmitInvoice = Boolean(
    draft &&
      payload &&
      header &&
      lines.length > 0 &&
      header.issueDate.trim() &&
      header.dueDate.trim() &&
      header.invoiceNumber.trim() &&
      !lines.some((l) => !l.abraCode.trim()),
  )

  const canSubmitWarehouse = Boolean(
    draft &&
      lines.length > 0 &&
      warehouseIssueDate.trim() &&
      !lines.some((l) => !l.abraCode.trim()) &&
      (voucherType !== 'PREVODKA' || targetStockCode.trim()),
  )

  const canSubmit = documentKind === 'invoice' ? canSubmitInvoice : canSubmitWarehouse

  return (
    <AdminLayout>
      <div className={`mx-auto max-w-[1600px] space-y-6 p-4 md:p-6 ${draft && parsed ? 'pb-52 md:pb-48' : ''}`}>
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('optionsTitle')}</CardTitle>
            <CardDescription>{t('optionsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-2">
              <Label>{t('defaultSize')}</Label>
              <Select
                value={options.defaultSizeLabel}
                onValueChange={(value) => setOptions((o) => ({ ...o, defaultSizeLabel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_PRESETS.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={options.defaultSizeLabel}
                onChange={(e) => setOptions((o) => ({ ...o, defaultSizeLabel: e.target.value }))}
                placeholder={t('customSize')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('targetStock')}</Label>
              <Select
                value={options.targetStockCode}
                onValueChange={(value) => setOptions((o) => ({ ...o, targetStockCode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_PRESETS.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('locale')}</Label>
              <Select
                value={options.locale}
                onValueChange={(value) =>
                  setOptions((o) => ({ ...o, locale: value as SupplierInvoiceParseOptions['locale'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['en', 'sk', 'uk'] as const).map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('geminiModel')}</Label>
              <Select
                value={options.geminiModel || DEFAULT_GEMINI_INVOICE_MODEL}
                onValueChange={(value) => setOptions((o) => ({ ...o, geminiModel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GEMINI_INVOICE_MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('geminiModelHint')}</p>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <Checkbox
                id="priceIncludesVat"
                checked={options.priceIncludesVat}
                onCheckedChange={(checked) =>
                  setOptions((o) => ({ ...o, priceIncludesVat: checked === true }))
                }
              />
              <Label htmlFor="priceIncludesVat">{t('priceIncludesVat')}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t('uploadTitle')}</CardTitle>
              <CardDescription>{t('uploadDescription')}</CardDescription>
            </div>
            {draft && (
              <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                {t('deleteDraft')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-3 text-sm hover:bg-muted/50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {draft ? t('replacePdf') : t('selectPdf')}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
              />
            </label>
            {draft && <p className="mt-2 text-sm text-muted-foreground">{draft.meta.fileName}</p>}
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </div>
        )}

        {!loading && draft && parsed && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{t('pdfPreview')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:px-6 sm:pb-6">
                  {pdfUrl ? (
                    <iframe
                      title={t('pdfPreview')}
                      src={`${pdfUrl}#navpanes=0&scrollbar=1&view=FitH&toolbar=1`}
                      className="h-[min(85vh,1100px)] min-h-[640px] w-full rounded border bg-muted/20"
                    />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('supplierTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <DetailRow label={t('fieldName')} value={parsed.supplier.name} />
                  <DetailRow label="IČO" value={parsed.supplier.ico} />
                  <DetailRow label="DIČ" value={parsed.supplier.dic} />
                  <DetailRow label="VAT" value={parsed.supplier.vatId} />
                  <DetailRow
                    label={t('address')}
                    value={[parsed.supplier.address, parsed.supplier.postalCode, parsed.supplier.city, parsed.supplier.country]
                      .filter(Boolean)
                      .join(', ')}
                  />
                  <DetailRow label={t('phone')} value={parsed.supplier.phone} />
                  <DetailRow label="Email" value={parsed.supplier.email} />
                  <DetailRow label={t('bank')} value={parsed.supplier.bankName} />
                  <DetailRow label="IBAN" value={parsed.supplier.iban} />
                  <DetailRow label="SWIFT" value={parsed.supplier.swift} />
                  <div className="my-2 border-t" />
                  <DetailRow label={t('paymentTerms')} value={parsed.invoice.paymentTerms} />
                  <DetailRow label={t('subtotal')} value={parsed.totals.subtotal} />
                  <DetailRow label={t('vatAmount')} value={parsed.totals.vatAmount} />
                  <DetailRow label={t('total')} value={parsed.totals.total} />
                  {parsed.unmappedFields && parsed.unmappedFields.length > 0 && (
                    <div className="mt-3 space-y-1 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground">{t('extraFields')}</p>
                      {parsed.unmappedFields.map((field) => (
                        <p key={field} className="text-xs text-foreground/80">
                          {field}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {header && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('abraHeaderTitle')}</CardTitle>
                  <CardDescription>{t('abraHeaderDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="header-invoice-number">{t('invoiceNumber')} (cisDosle)</Label>
                    <Input
                      id="header-invoice-number"
                      value={header.invoiceNumber}
                      onChange={(e) => setHeader((h) => (h ? { ...h, invoiceNumber: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-currency">{t('currency')} (mena)</Label>
                    <Input
                      id="header-currency"
                      value={header.currency}
                      maxLength={8}
                      onChange={(e) => setHeader((h) => (h ? { ...h, currency: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-var-sym">{t('variableSymbol')} (varSym)</Label>
                    <Input
                      id="header-var-sym"
                      value={header.variableSymbol}
                      maxLength={20}
                      onChange={(e) => setHeader((h) => (h ? { ...h, variableSymbol: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-issue-date">{t('issueDate')} (datVyst)</Label>
                    <Input
                      id="header-issue-date"
                      type="date"
                      value={header.issueDate}
                      onChange={(e) => setHeader((h) => (h ? { ...h, issueDate: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-due-date">{t('dueDate')} (datSplat) *</Label>
                    <Input
                      id="header-due-date"
                      type="date"
                      value={header.dueDate}
                      required
                      onChange={(e) => setHeader((h) => (h ? { ...h, dueDate: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-tax-date">{t('taxDate')} (datZdPln)</Label>
                    <Input
                      id="header-tax-date"
                      type="date"
                      value={header.taxDate}
                      onChange={(e) => setHeader((h) => (h ? { ...h, taxDate: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header-order">{t('orderReference')} (cisObj)</Label>
                    <Input
                      id="header-order"
                      value={header.orderReference}
                      onChange={(e) => setHeader((h) => (h ? { ...h, orderReference: e.target.value } : h))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="header-delivery-note">{t('deliveryNote')}</Label>
                    <Input
                      id="header-delivery-note"
                      value={header.deliveryNoteNumber}
                      onChange={(e) =>
                        setHeader((h) => (h ? { ...h, deliveryNoteNumber: e.target.value } : h))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{t('linesTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-lines-top"
                      checked={allSelected}
                      onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    />
                    <Label htmlFor="select-all-lines-top" className="text-sm whitespace-nowrap">
                      {t('selectAll')}
                    </Label>
                  </div>
                  {someSelected && (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('selectedCount', { count: selectedIndices.size })}
                      </span>
                      <Select
                        value={bulkField}
                        onValueChange={(v) => {
                          setBulkField(v as BulkField)
                          setBulkValue(v === 'stockCode' ? STOCK_NONE : '')
                        }}
                      >
                        <SelectTrigger className="h-9 w-[140px]">
                          <SelectValue placeholder={t('bulkColumn')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="abraCode">{t('abraCode')}</SelectItem>
                          <SelectItem value="batchNumber">{t('batchNumber')}</SelectItem>
                          <SelectItem value="stockCode">{t('lineStock')}</SelectItem>
                        </SelectContent>
                      </Select>
                      {bulkField === 'stockCode' ? (
                        <Select value={bulkValue || STOCK_NONE} onValueChange={setBulkValue}>
                          <SelectTrigger className="h-9 w-[140px]">
                            <SelectValue placeholder={t('bulkValue')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={STOCK_NONE}>{t('noStock')}</SelectItem>
                            {STOCK_PRESETS.map((code) => (
                              <SelectItem key={code} value={code}>
                                {code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-9 w-[160px]"
                          value={bulkValue}
                          placeholder={
                            bulkField === 'batchNumber'
                              ? t('batchNumberPlaceholder')
                              : t('abraCodePlaceholder')
                          }
                          onChange={(e) => setBulkValue(e.target.value)}
                        />
                      )}
                      <Button type="button" variant="secondary" size="sm" className="h-9" onClick={applyBulkEdit}>
                        {t('bulkApply')}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-9"
                        onClick={deleteSelectedLines}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('deleteSelected')}
                      </Button>
                    </div>
                  )}
                </div>

                {lines.map((line, index) => {
                  const preview = (draft.meta.editedLines ?? draft.meta.lines ?? [])[
                    index
                  ] as InvoiceLinePreview | undefined
                  const unmatched = !line.abraCode.trim()
                  const isSelected = selectedIndices.has(index)
                  return (
                    <div
                      key={`${line.lineIndex}-${index}`}
                      className={
                        unmatched
                          ? 'space-y-2 rounded border border-destructive/60 bg-destructive/5 p-3 ring-1 ring-destructive/30'
                          : isSelected
                            ? 'space-y-2 rounded border border-primary/40 bg-primary/5 p-3'
                            : 'space-y-2 rounded border p-3'
                      }
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        <Checkbox
                          className="mt-1"
                          checked={isSelected}
                          onCheckedChange={(checked) => toggleSelectLine(index, checked === true)}
                          aria-label={t('selectLine')}
                        />
                        <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="text-sm font-medium">{line.rawName}</div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {line.sku || preview?.sku ? (
                            <span>
                              {t('supplierSku')}: {line.sku || preview?.sku}
                            </span>
                          ) : null}
                          <span>
                            CN: {line.hsCode || preview?.hsCode || '—'}
                          </span>
                          {preview?.notes ? <span>{preview.notes}</span> : null}
                        </div>
                      </div>
                      {unmatched && (
                        <p className="text-xs font-medium text-destructive">{t('unmatchedHint')}</p>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <div>
                          <Label className={`text-xs ${unmatched ? 'text-destructive' : ''}`}>
                            {t('abraCode')}
                          </Label>
                          <Input
                            value={line.abraCode}
                            className={unmatched ? 'border-destructive focus-visible:ring-destructive' : ''}
                            placeholder={t('abraCodePlaceholder')}
                            onChange={(e) => updateLine(index, { abraCode: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('quantity')}</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, { quantity: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('unitPrice')}</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('batchNumber')}</Label>
                          <Input
                            value={line.batchNumber ?? ''}
                            placeholder={t('batchNumberPlaceholder')}
                            onChange={(e) =>
                              updateLine(index, {
                                batchNumber: e.target.value.trim() || undefined,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">{t('lineStock')}</Label>
                          <Select
                            value={line.stockCode?.trim() ? line.stockCode : STOCK_NONE}
                            onValueChange={(value) =>
                              updateLine(index, {
                                stockCode: value === STOCK_NONE ? '' : value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={STOCK_NONE}>{t('noStock')}</SelectItem>
                              {STOCK_PRESETS.map((code) => (
                                <SelectItem key={code} value={code}>
                                  {code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">{t('lineTotal')}</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={lineAmount(line)}
                            onChange={(e) => updateLine(index, { lineTotal: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      {preview && (
                        <p className="text-xs text-muted-foreground">
                          {t('match')}: {preview.matchSource} / {preview.matchConfidence}
                          {preview.matchedFlexiCenik?.nazev
                            ? ` — ${preview.matchedFlexiCenik.nazev}`
                            : preview.matchedProduct?.name
                              ? ` — ${preview.matchedProduct.name}`
                              : ''}
                        </p>
                      )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 px-4 py-3 text-sm font-medium">
                  <span>
                    {t('totalQuantity')}: {totals.quantity}
                  </span>
                  <span>
                    {t('totalAmount')}: {totals.amount}
                    {parsed.invoice.currency ? ` ${parsed.invoice.currency}` : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {!loading && draft && parsed && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:left-64">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-x-4 gap-y-2 px-4 py-3 md:px-6">
            <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:ml-auto sm:w-auto">
              <div className="hidden text-sm text-muted-foreground lg:block">
                {t('totalQuantity')}: {totals.quantity} · {t('totalAmount')}: {totals.amount}
                {parsed.invoice.currency ? ` ${parsed.invoice.currency}` : ''}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('documentKind')}</Label>
                <Select
                  value={documentKind}
                  onValueChange={(v) => setDocumentKind(v as DocumentKind)}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">{t('documentInvoice')}</SelectItem>
                    <SelectItem value="warehouse">{t('documentWarehouse')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {documentKind === 'warehouse' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('voucherType')}</Label>
                    <Select
                      value={voucherType}
                      onValueChange={(v) => {
                        const next = v as WarehouseVoucherType
                        setVoucherType(next)
                        if (next === 'PREVODKA') setMovement('vydej')
                      }}
                    >
                      <SelectTrigger className="h-9 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">STANDARD</SelectItem>
                        <SelectItem value="VYROBA">VÝROBA</SelectItem>
                        <SelectItem value="PREVODKA">PŘEVODKA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('movement')}</Label>
                    <Select
                      value={movement}
                      onValueChange={(v) => setMovement(v as WarehouseMovement)}
                      disabled={voucherType === 'PREVODKA'}
                    >
                      <SelectTrigger className="h-9 w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prijem">{t('movementIn')}</SelectItem>
                        <SelectItem value="vydej">{t('movementOut')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('warehouseIssueDate')}</Label>
                    <Input
                      type="date"
                      className="h-9 w-[150px]"
                      value={warehouseIssueDate}
                      onChange={(e) => setWarehouseIssueDate(e.target.value)}
                    />
                  </div>
                  {voucherType === 'PREVODKA' && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t('targetStockCil')}</Label>
                      <Select value={targetStockCode} onValueChange={setTargetStockCode}>
                        <SelectTrigger className="h-9 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STOCK_PRESETS.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
              <div className="space-y-1">
                <Label className="text-xs">{t('rematchSize')}</Label>
                <div className="flex gap-2">
                  <Select value={rematchSize} onValueChange={setRematchSize}>
                    <SelectTrigger className="h-9 w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZE_PRESETS.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-9 w-[90px]"
                    value={rematchSize}
                    onChange={(e) => setRematchSize(e.target.value)}
                    placeholder="C2"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9"
                    disabled={rematching || !draft}
                    onClick={() => void handleRematch()}
                  >
                    {rematching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {t('rematchSelected')}
                  </Button>
                </div>
              </div>
              <Button
                className="w-full sm:w-auto sm:min-w-[200px]"
                size="lg"
                disabled={submitting || !canSubmit}
                onClick={() => void handleSubmit()}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {documentKind === 'warehouse' ? t('submitWarehouse') : t('submitToAbra')}
              </Button>
            </div>
          </div>
          {sends.length > 0 && (
            <div className="mx-auto max-w-[1600px] border-t border-border/60 px-4 py-2 md:px-6">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('sendHistory')}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {sends
                  .slice()
                  .reverse()
                  .slice(0, 5)
                  .map((send, i) => (
                    <li key={`${send.at}-${i}`}>
                      {send.ok ? '✓' : '✗'} {send.kind}
                      {send.voucherType ? `/${send.voucherType}` : ''}
                      {send.nativeKod ? ` · ${send.nativeKod}` : ''} ·{' '}
                      {new Date(send.at).toLocaleString()}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
