import 'server-only'

import { fetchBackend, readBackendJson } from '@/lib/api/backend-fetch'

export const LEGAL_DOCUMENT_TYPES = ['TERMS', 'PRIVACY', 'COOKIES', 'RETURNS'] as const
export type LegalDocumentType = (typeof LEGAL_DOCUMENT_TYPES)[number]

export type LegalDocumentSection = {
  heading: string
  body: string[]
}

export type LegalSellerIdentity = {
  organizationName: string
  ico: string
  dic: string
  icDph: string
  legalAddress: string
  iban?: string
  bankName?: string
  taxStatus?: string
}

export type LegalDocumentView = {
  id: string
  type: LegalDocumentType
  revisionId: string
  locale: string
  version: number
  title: string
  intro: string
  sections: LegalDocumentSection[]
  contentHash: string
  effectiveAt: string
  publishedAt: string | null
  seller?: LegalSellerIdentity | null
}

export function sellerFromBankDetails(bank: {
  organizationName?: string
  edrpou?: string
  dic?: string
  icDph?: string
  legalAddress?: string
  iban?: string
  bankName?: string
  taxStatus?: string
} | null | undefined): LegalSellerIdentity | null {
  if (!bank) return null
  const seller: LegalSellerIdentity = {
    organizationName: bank.organizationName?.trim() ?? '',
    ico: bank.edrpou?.trim() ?? '',
    dic: bank.dic?.trim() ?? '',
    icDph: bank.icDph?.trim() ?? '',
    legalAddress: bank.legalAddress?.trim() ?? '',
    iban: bank.iban?.trim(),
    bankName: bank.bankName?.trim(),
    taxStatus: bank.taxStatus?.trim(),
  }
  if (
    !seller.organizationName &&
    !seller.ico &&
    !seller.dic &&
    !seller.icDph &&
    !seller.legalAddress
  ) {
    return null
  }
  return seller
}

export function firstSellerIdentity(
  ...candidates: Array<LegalSellerIdentity | null | undefined>
): LegalSellerIdentity | null {
  for (const candidate of candidates) {
    if (!candidate) continue
    if (
      candidate.organizationName ||
      candidate.ico ||
      candidate.dic ||
      candidate.icDph ||
      candidate.legalAddress
    ) {
      return candidate
    }
  }
  return null
}

function isSeller(value: unknown): value is LegalSellerIdentity {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return typeof row.ico === 'string' && typeof row.organizationName === 'string'
}

function isDocument(value: unknown): value is LegalDocumentView {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  if (
    typeof row.revisionId !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.intro !== 'string' ||
    !Array.isArray(row.sections)
  ) {
    return false
  }
  if (row.seller != null && !isSeller(row.seller)) return false
  return true
}

export async function fetchCurrentLegalDocument(
  type: LegalDocumentType,
  locale: string,
): Promise<LegalDocumentView | null> {
  try {
    const res = await fetchBackend(`/legal/${type}?locale=${encodeURIComponent(locale)}`)
    if (!res.ok) return null
    const data = await readBackendJson<unknown>(res)
    return isDocument(data) ? data : null
  } catch {
    return null
  }
}
