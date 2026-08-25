import { getTranslations } from 'next-intl/server'

import { cn } from '@/lib/utils'
import { hasCompanyBankDetails } from '@/lib/settings/company-bank-details'
import type { CheckoutBankDetails } from '@/lib/settings/types'

type StoreCompanyDetailsDisplayProps = {
  company: CheckoutBankDetails
  marketRegion?: 'ua' | 'sk'
  className?: string
  title?: string
  textClassName?: string
  mutedClassName?: string
}

function Row({
  label,
  value,
  textClassName,
  mutedClassName,
}: {
  label: string
  value?: string
  textClassName?: string
  mutedClassName?: string
}) {
  if (!value?.trim()) return null
  return (
    <div>
      <p className={cn('text-xs', mutedClassName ?? 'text-muted-foreground')}>{label}</p>
      <p className={cn('break-words text-sm', textClassName)}>{value}</p>
    </div>
  )
}

export async function StoreCompanyDetailsDisplay({
  company,
  marketRegion = 'ua',
  className,
  title,
  textClassName,
  mutedClassName,
}: StoreCompanyDetailsDisplayProps) {
  const t = await getTranslations('contactsPage')
  if (!hasCompanyBankDetails(company)) return null

  const isSk = marketRegion === 'sk'
  const heading = title ?? t('companyDetails')

  return (
    <div className={cn('space-y-3', className)}>
      {heading ? <p className={cn('font-medium', textClassName)}>{heading}</p> : null}
      <div className="space-y-2">
        <Row
          label={isSk ? t('fields.tradeName') : t('fields.organizationName')}
          value={company.organizationName}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={isSk ? t('fields.ico') : t('fields.edrpou')}
          value={company.edrpou}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        {isSk ? (
          <>
            <Row
              label={t('fields.dic')}
              value={company.dic}
              textClassName={textClassName}
              mutedClassName={mutedClassName}
            />
            <Row
              label={t('fields.icDph')}
              value={company.icDph}
              textClassName={textClassName}
              mutedClassName={mutedClassName}
            />
            <Row
              label={t('fields.bic')}
              value={company.bic}
              textClassName={textClassName}
              mutedClassName={mutedClassName}
            />
          </>
        ) : (
          <Row
            label={t('fields.mfo')}
            value={company.mfo}
            textClassName={textClassName}
            mutedClassName={mutedClassName}
          />
        )}
        <Row
          label={t('fields.iban')}
          value={company.iban}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={t('fields.bank')}
          value={company.bankName}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={t('fields.legalAddress')}
          value={company.legalAddress}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={t('fields.taxStatus')}
          value={company.taxStatus}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
      </div>
    </div>
  )
}
