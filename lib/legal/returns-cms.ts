import type { LegalDocumentSection } from '@/lib/legal/documents'

export const RETURNS_WITHDRAWAL_FORMS_MARKER = '---WITHDRAWAL_FORMS---'

export type ReturnsCmsVars = {
  returnAddress: string
  supportEmail: string
}

export function interpolateReturnsCmsText(text: string, vars: ReturnsCmsVars): string {
  return text
    .replaceAll('{returnAddress}', vars.returnAddress)
    .replaceAll('{supportEmail}', vars.supportEmail)
}

export function splitReturnsDocumentSections(sections: LegalDocumentSection[]): {
  beforeForms: LegalDocumentSection[]
  afterForms: LegalDocumentSection[]
} {
  const markerIndex = sections.findIndex(
    (section) => section.heading.trim() === RETURNS_WITHDRAWAL_FORMS_MARKER,
  )
  if (markerIndex < 0) {
    return { beforeForms: sections, afterForms: [] }
  }
  return {
    beforeForms: sections.slice(0, markerIndex),
    afterForms: sections.slice(markerIndex + 1),
  }
}

export function mapReturnsSections(
  sections: LegalDocumentSection[],
  vars: ReturnsCmsVars,
): LegalDocumentSection[] {
  return sections.map((section) => ({
    heading: interpolateReturnsCmsText(section.heading, vars),
    body: section.body.map((paragraph) => interpolateReturnsCmsText(paragraph, vars)),
  }))
}
