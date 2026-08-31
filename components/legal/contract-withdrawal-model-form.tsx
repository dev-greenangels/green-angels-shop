'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import type { LegalSellerIdentity } from '@/lib/legal/documents'

type ContractWithdrawalModelFormProps = {
  locale: string
  seller?: LegalSellerIdentity | null
  contactEmail: string
}

const DEFAULT_SK_SELLER = {
  organizationName: 'Green Angels International s.r.o.',
  legalAddress: 'Bardoňovo 483, 941 49 Bardoňovo, Slovenská republika',
  email: 'info@green-angels.sk',
}

export function ContractWithdrawalModelForm({
  locale,
  seller,
  contactEmail,
}: ContractWithdrawalModelFormProps) {
  const t = useTranslations('contractWithdrawal.modelForm')
  const isSk = locale === 'sk'

  const organizationName = seller?.organizationName?.trim() || DEFAULT_SK_SELLER.organizationName
  const legalAddress = seller?.legalAddress?.trim() || DEFAULT_SK_SELLER.legalAddress
  const email = contactEmail.trim() || DEFAULT_SK_SELLER.email

  if (isSk) {
    return (
      <div className="space-y-5 rounded-xl border border-border/80 bg-background/90 p-5 text-sm leading-relaxed md:p-6 print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-semibold text-foreground">{t('title')}</h3>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
            {t('print')}
          </Button>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-foreground">{t('addresseeLabel')}</p>
          <p>{organizationName}</p>
          <p>{legalAddress}</p>
          <p>
            {t('emailLabel')}{' '}
            <a href={`mailto:${email}`} className="text-primary underline underline-offset-2">
              {email}
            </a>
          </p>
        </div>

        <p className="font-medium text-foreground">{t('declarationIntro')}</p>

        <ul className="list-none space-y-4 pl-0">
          <li className="border-b border-dashed border-border/70 pb-3">{t('fieldOrderDate')}</li>
          <li className="border-b border-dashed border-border/70 pb-3">{t('fieldConsumerName')}</li>
          <li className="border-b border-dashed border-border/70 pb-3">{t('fieldConsumerAddress')}</li>
          <li className="border-b border-dashed border-border/70 pb-3">{t('fieldSignature')}</li>
          <li className="border-b border-dashed border-border/70 pb-3">{t('fieldDate')}</li>
        </ul>

        <p className="text-xs text-muted-foreground">{t('footnote')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-background/90 p-5 text-sm leading-relaxed md:p-6 print:border-0 print:p-0">
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{t('nonSkTitle')}</p>
        <p className="text-sm text-muted-foreground">{t('nonSkBody')}</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          {t('print')}
        </Button>
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{t('addresseeLabel')}</p>
        <p>{organizationName}</p>
        <p>{legalAddress}</p>
        <p>
          {t('emailLabel')}{' '}
          <a href={`mailto:${email}`} className="text-primary underline underline-offset-2">
            {email}
          </a>
        </p>
      </div>
      <p className="font-medium text-foreground">{t('declarationIntro')}</p>
      <ul className="list-none space-y-4 pl-0">
        <li className="border-b border-dashed border-border/70 pb-3">{t('fieldOrderDate')}</li>
        <li className="border-b border-dashed border-border/70 pb-3">{t('fieldConsumerName')}</li>
        <li className="border-b border-dashed border-border/70 pb-3">{t('fieldConsumerAddress')}</li>
        <li className="border-b border-dashed border-border/70 pb-3">{t('fieldSignature')}</li>
        <li className="border-b border-dashed border-border/70 pb-3">{t('fieldDate')}</li>
      </ul>
      <p className="text-xs text-muted-foreground">{t('footnote')}</p>
    </div>
  )
}
