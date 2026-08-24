export type MatchConfidence = 'exact' | 'fuzzy' | 'none'
export type MatchSource = 'site-db' | 'flexi-cenik' | 'none'

export type SupplierInvoiceParseOptions = {
  defaultSizeLabel: string
  targetStockCode: string
  priceIncludesVat: boolean
  locale: string
  geminiModel?: string
}

export type ParsedSupplierInfo = {
  name: string
  ico?: string
  dic?: string
  vatId?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  email?: string
  phone?: string
  bankAccount?: string
  iban?: string
  swift?: string
  bankName?: string
}

export type ParsedInvoiceHeader = {
  invoiceNumber: string
  deliveryNoteNumber?: string
  orderReference?: string
  issueDate: string
  dueDate?: string
  taxDate?: string
  currency: string
  paymentTerms?: string
}

export type ParsedInvoiceItem = {
  lineIndex: number
  rawName: string
  sku?: string
  ean?: string
  quantity: number
  unit?: string
  unitPrice: number
  lineTotal?: number
  vatRate?: number
  batchNumber?: string
  serialNumber?: string
  countryOfOrigin?: string
  hsCode?: string
  notes?: string
}

export type MatchedProductSummary = {
  productId: string
  variantId: string
  slug: string
  name: string
  sku: string | null
  ean: string | null
}

export type MatchedFlexiCenikSummary = {
  id: string
  kod: string
  nazev: string
}

export type InvoiceLinePreview = ParsedInvoiceItem & {
  matchedProduct: MatchedProductSummary | null
  matchedFlexiCenik: MatchedFlexiCenikSummary | null
  matchConfidence: MatchConfidence
  matchSource: MatchSource
  suggestedAbraId: string | null
  fuzzyCandidates: MatchedFlexiCenikSummary[]
  stockCode?: string
}

export type GeminiParsedInvoice = {
  supplier: ParsedSupplierInfo
  invoice: ParsedInvoiceHeader
  items: ParsedInvoiceItem[]
  totals: { subtotal?: number; vatAmount?: number; total: number }
  unmappedFields?: string[]
}

export type SupplierInvoiceDraftMeta = {
  draftId: string
  userId: string
  fileName: string
  parseOptions: SupplierInvoiceParseOptions
  parsed: GeminiParsedInvoice | null
  lines: InvoiceLinePreview[] | null
  editedLines: InvoiceLinePreview[] | null
  supplierMatch: { abraRef: string | null; matchConfidence: MatchConfidence } | null
  status: 'uploaded' | 'parsed' | 'submitted'
  createdAt: string
  parsedAt: string | null
}

export type CreateInvoiceLine = {
  lineIndex: number
  rawName: string
  abraCode: string
  productId?: string
  variantId?: string
  quantity: number
  unitPrice: number
  lineTotal?: number
  batchNumber?: string
  stockCode?: string
  vatRate?: number
  sku?: string
  hsCode?: string
  displayName?: string
}

export type CreateSupplierInvoicePayload = {
  lines: CreateInvoiceLine[]
  invoiceNumber: string
  issueDate: string
  dueDate?: string
  taxDate?: string
  currency: string
  variableSymbol?: string
  orderReference?: string
  deliveryNoteNumber?: string
  targetStockCode: string
  priceIncludesVat: boolean
  supplierName: string
  supplierIco?: string
  supplierDic?: string
  supplierVatId?: string
  supplierAddress?: string
}

export type InvoiceHeaderForm = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  taxDate: string
  currency: string
  variableSymbol: string
  orderReference: string
  deliveryNoteNumber: string
}

export function buildInvoiceHeaderForm(
  parsed: GeminiParsedInvoice,
  payload?: CreateSupplierInvoicePayload | null,
): InvoiceHeaderForm {
  const inv = parsed.invoice
  const digits = inv.invoiceNumber.replace(/\D/g, '').slice(0, 20)
  const defaultVarSym = digits || inv.invoiceNumber.trim().slice(0, 20)
  return {
    invoiceNumber: payload?.invoiceNumber ?? inv.invoiceNumber,
    issueDate: payload?.issueDate ?? inv.issueDate,
    dueDate: payload?.dueDate ?? inv.dueDate ?? inv.taxDate ?? inv.issueDate,
    taxDate: payload?.taxDate ?? inv.taxDate ?? '',
    currency: payload?.currency ?? inv.currency,
    variableSymbol: payload?.variableSymbol ?? defaultVarSym,
    orderReference: payload?.orderReference ?? inv.orderReference ?? '',
    deliveryNoteNumber: payload?.deliveryNoteNumber ?? inv.deliveryNoteNumber ?? '',
  }
}

export type SupplierInvoiceDraftResponse = {
  meta: SupplierInvoiceDraftMeta
  pdfBase64: string
  createPayload: CreateSupplierInvoicePayload | null
  warnings?: string[]
}

export type CreateFakturaPrijataResult = {
  ok: boolean
  externalId?: string
  nativeId?: string
  nativeKod?: string
  attachmentOk: boolean
  message: string
}

const DRAFT_STORAGE_KEY = 'supplierInvoiceDraftId'

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export function getStoredDraftId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DRAFT_STORAGE_KEY)
}

export function setStoredDraftId(draftId: string | null): void {
  if (typeof window === 'undefined') return
  if (draftId) localStorage.setItem(DRAFT_STORAGE_KEY, draftId)
  else localStorage.removeItem(DRAFT_STORAGE_KEY)
}

export async function fetchActiveSupplierInvoiceDraft(): Promise<SupplierInvoiceDraftResponse | null> {
  const res = await fetch('/api/backstage/supplier-invoices/drafts/active', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { draft: SupplierInvoiceDraftMeta | null; pdfBase64?: string; createPayload?: CreateSupplierInvoicePayload | null }
  if (!data.draft || !data.pdfBase64) return null
  setStoredDraftId(data.draft.draftId)
  return {
    meta: data.draft,
    pdfBase64: data.pdfBase64,
    createPayload: data.createPayload ?? null,
  }
}

export async function fetchSupplierInvoiceDraft(draftId: string): Promise<SupplierInvoiceDraftResponse> {
  const res = await fetch(`/api/backstage/supplier-invoices/drafts/${encodeURIComponent(draftId)}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as SupplierInvoiceDraftResponse
  setStoredDraftId(data.meta.draftId)
  return data
}

export async function uploadSupplierInvoiceDraft(
  file: File,
  options: SupplierInvoiceParseOptions,
): Promise<SupplierInvoiceDraftResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('options', JSON.stringify(options))

  const res = await fetch('/api/backstage/supplier-invoices/drafts', {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as SupplierInvoiceDraftResponse
  setStoredDraftId(data.meta.draftId)
  return data
}

export async function updateSupplierInvoiceDraft(
  draftId: string,
  editedLines: CreateInvoiceLine[],
): Promise<SupplierInvoiceDraftResponse> {
  const res = await fetch(`/api/backstage/supplier-invoices/drafts/${encodeURIComponent(draftId)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editedLines }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { meta: SupplierInvoiceDraftMeta; createPayload: CreateSupplierInvoicePayload | null }
  const existing = await fetchSupplierInvoiceDraft(draftId)
  return {
    meta: data.meta,
    pdfBase64: existing.pdfBase64,
    createPayload: data.createPayload,
  }
}

export async function deleteSupplierInvoiceDraft(draftId: string): Promise<void> {
  const res = await fetch(`/api/backstage/supplier-invoices/drafts/${encodeURIComponent(draftId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  setStoredDraftId(null)
}

export async function createSupplierInvoiceInFlexi(
  draftId: string,
  payload: CreateSupplierInvoicePayload,
): Promise<CreateFakturaPrijataResult> {
  // Nest ValidationPipe forbidNonWhitelisted — only send create DTO fields
  const body: CreateSupplierInvoicePayload = {
    invoiceNumber: payload.invoiceNumber,
    issueDate: payload.issueDate,
    dueDate: payload.dueDate,
    taxDate: payload.taxDate,
    currency: payload.currency,
    variableSymbol: payload.variableSymbol,
    orderReference: payload.orderReference,
    deliveryNoteNumber: payload.deliveryNoteNumber,
    targetStockCode: payload.targetStockCode,
    priceIncludesVat: payload.priceIncludesVat,
    supplierName: payload.supplierName,
    supplierIco: payload.supplierIco,
    supplierDic: payload.supplierDic,
    supplierVatId: payload.supplierVatId,
    supplierAddress: payload.supplierAddress,
    lines: payload.lines.map((line) => ({
      lineIndex: line.lineIndex,
      rawName: line.rawName,
      abraCode: line.abraCode,
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
      batchNumber: line.batchNumber,
      stockCode: line.stockCode,
      vatRate: line.vatRate,
      displayName: line.displayName,
    })),
  }

  const res = await fetch(
    `/api/backstage/supplier-invoices/drafts/${encodeURIComponent(draftId)}/create`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const data = (await res.json()) as CreateFakturaPrijataResult & { message?: string }
  if (!res.ok) throw new Error(typeof data.message === 'string' ? data.message : await parseError(res))
  if (data.ok) setStoredDraftId(null)
  return data
}

export function linesToEditablePayload(
  lines: InvoiceLinePreview[],
  defaultStockCode?: string,
): CreateInvoiceLine[] {
  const stockDefault = defaultStockCode?.trim() || undefined
  return lines.map((line) => ({
    lineIndex: line.lineIndex,
    rawName: line.rawName,
    // Never fall back to supplier Index/SKU — only a real Abra match fills the code.
    abraCode: line.suggestedAbraId?.trim() || '',
    productId: line.matchedProduct?.productId,
    variantId: line.matchedProduct?.variantId,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal ?? roundMoney(line.quantity * line.unitPrice),
    batchNumber: line.batchNumber,
    stockCode: line.stockCode ?? stockDefault,
    vatRate: line.vatRate,
    sku: line.sku,
    hsCode: line.hsCode,
    displayName: line.rawName,
  }))
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** Models available in UI (must match backend GEMINI_INVOICE_MODELS). */
export const GEMINI_INVOICE_MODEL_OPTIONS = [
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
] as const

export const DEFAULT_GEMINI_INVOICE_MODEL = 'gemini-3.6-flash'
