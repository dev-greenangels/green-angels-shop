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

export function StoreCompanyDetailsDisplay({
  company,
  marketRegion = 'ua',
  className,
  title = 'Реквізити компанії',
  textClassName,
  mutedClassName,
}: StoreCompanyDetailsDisplayProps) {
  if (!hasCompanyBankDetails(company)) return null

  const isSk = marketRegion === 'sk'

  return (
    <div className={cn('space-y-3', className)}>
      {title ? <p className={cn('font-medium', textClassName)}>{title}</p> : null}
      <div className="space-y-2">
        <Row
          label={isSk ? 'Obchodné meno' : 'Назва організації / ФОП'}
          value={company.organizationName}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={isSk ? 'IČO' : 'ЄДРПОУ / ІПН'}
          value={company.edrpou}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        {isSk ? (
          <>
            <Row
              label="DIČ"
              value={company.dic}
              textClassName={textClassName}
              mutedClassName={mutedClassName}
            />
            <Row
              label="IČ DPH"
              value={company.icDph}
              textClassName={textClassName}
              mutedClassName={mutedClassName}
            />
            <Row
              label="BIC / SWIFT"
              value={company.bic}
              textClassName={textClassName}
              mutedClassName={mutedClassName}
            />
          </>
        ) : (
          <Row
            label="МФО"
            value={company.mfo}
            textClassName={textClassName}
            mutedClassName={mutedClassName}
          />
        )}
        <Row
          label="IBAN"
          value={company.iban}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={isSk ? 'Banka' : 'Банк'}
          value={company.bankName}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={isSk ? 'Sídlo' : 'Юридична адреса'}
          value={company.legalAddress}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
        <Row
          label={isSk ? 'Daňový status' : 'Податковий статус'}
          value={company.taxStatus}
          textClassName={textClassName}
          mutedClassName={mutedClassName}
        />
      </div>
    </div>
  )
}
