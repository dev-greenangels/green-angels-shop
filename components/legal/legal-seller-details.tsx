import { getTranslations } from 'next-intl/server'

import type { LegalSellerIdentity } from '@/lib/legal/documents'
import { legalSubsectionHeadingClassName } from '@/lib/legal/storefront-typography'
import { cn } from '@/lib/utils'

function hasSellerIdentity(seller?: LegalSellerIdentity | null): seller is LegalSellerIdentity {
  if (!seller) return false
  return Boolean(
    seller.organizationName || seller.ico || seller.dic || seller.icDph || seller.legalAddress,
  )
}

export async function LegalSellerDetails({
  seller,
  identityKind = 'seller',
}: {
  seller?: LegalSellerIdentity | null
  /** GDPR pages use prevádzkovateľ; VOP uses predávajúci. */
  identityKind?: 'seller' | 'controller'
}) {
  if (!hasSellerIdentity(seller)) return null
  const t = await getTranslations('legalPages')
  const titleKey = identityKind === 'controller' ? 'controllerTitle' : 'sellerTitle'

  const rows: Array<{ label: string; value: string }> = [
    seller.ico ? { label: t('sellerIco'), value: seller.ico } : null,
    seller.dic ? { label: t('sellerDic'), value: seller.dic } : null,
    seller.icDph ? { label: t('sellerVat'), value: seller.icDph } : null,
    seller.legalAddress ? { label: t('sellerAddress'), value: seller.legalAddress } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row))

  return (
    <section className="mb-8 rounded-lg border border-border/60 bg-card/40 p-4">
      <h2 className={cn('mb-3', legalSubsectionHeadingClassName)}>{t(titleKey)}</h2>
      {seller.organizationName ? (
        <p className="font-medium text-foreground">{seller.organizationName}</p>
      ) : null}
      <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-foreground/80">{row.label}:</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
