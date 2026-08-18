import { LegalPageSections, type LegalPageSection } from '@/components/legal/legal-page-sections'
import { LegalSellerDetails } from '@/components/legal/legal-seller-details'
import {
  firstSellerIdentity,
  type LegalDocumentView,
  type LegalSellerIdentity,
} from '@/lib/legal/documents'
import { formatDateTime } from '@/lib/i18n/format-datetime'

export async function LegalRevisionBody({
  document,
  locale,
  versionLabel,
  fallbackSeller,
}: {
  document: LegalDocumentView
  locale: string
  versionLabel: string
  fallbackSeller?: LegalSellerIdentity | null
}) {
  return (
    <>
      {versionLabel ? <p className="text-muted-foreground text-lg">{versionLabel}</p> : null}
      <p className="text-muted-foreground text-sm">
        {formatDateTime(document.effectiveAt, locale, 'dateLong')}
      </p>
      <LegalSellerDetails seller={firstSellerIdentity(document.seller, fallbackSeller)} />
      {document.intro ? <p className="text-muted-foreground">{document.intro}</p> : null}
      <LegalPageSections sections={document.sections as LegalPageSection[]} />
    </>
  )
}
