'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CheckoutBankDetails } from '@/lib/settings/types'

type CompanyBankDetailsFieldsProps = {
  value: CheckoutBankDetails
  onChange: (next: CheckoutBankDetails) => void
  marketRegion?: 'ua' | 'sk'
  disabled?: boolean
}

export function CompanyBankDetailsFields({
  value,
  onChange,
  marketRegion = 'ua',
  disabled = false,
}: CompanyBankDetailsFieldsProps) {
  const isSk = marketRegion === 'sk'
  const patch = (partial: Partial<CheckoutBankDetails>) => onChange({ ...value, ...partial })

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label>{isSk ? 'Obchodné meno / názov firmy' : 'Назва організації / ФОП'}</Label>
        <Input
          disabled={disabled}
          value={value.organizationName ?? ''}
          onChange={(e) => patch({ organizationName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>{isSk ? 'IČO' : 'ЄДРПОУ / ІПН'}</Label>
        <Input
          disabled={disabled}
          value={value.edrpou ?? ''}
          onChange={(e) => patch({ edrpou: e.target.value })}
        />
      </div>
      {isSk ? (
        <>
          <div className="space-y-2">
            <Label>DIČ</Label>
            <Input
              disabled={disabled}
              value={value.dic ?? ''}
              onChange={(e) => patch({ dic: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>IČ DPH</Label>
            <Input
              disabled={disabled}
              value={value.icDph ?? ''}
              onChange={(e) => patch({ icDph: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>BIC / SWIFT</Label>
            <Input
              disabled={disabled}
              value={value.bic ?? ''}
              onChange={(e) => patch({ bic: e.target.value })}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>МФО</Label>
          <Input
            disabled={disabled}
            value={value.mfo ?? ''}
            onChange={(e) => patch({ mfo: e.target.value })}
          />
        </div>
      )}
      <div className="space-y-2 sm:col-span-2">
        <Label>IBAN</Label>
        <Input
          disabled={disabled}
          value={value.iban ?? ''}
          onChange={(e) => patch({ iban: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>{isSk ? 'Banka' : 'Банк'}</Label>
        <Input
          disabled={disabled}
          value={value.bankName ?? ''}
          onChange={(e) => patch({ bankName: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>{isSk ? 'Sídlo (právna adresa)' : 'Юридична адреса'}</Label>
        <Input
          disabled={disabled}
          value={value.legalAddress ?? ''}
          onChange={(e) => patch({ legalAddress: e.target.value })}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>{isSk ? 'Daňový status' : 'Податковий статус'}</Label>
        <Input
          disabled={disabled}
          placeholder={isSk ? 'Platca DPH / Neplatca DPH' : 'напр. Платник ПДВ / Не платник ПДВ'}
          value={value.taxStatus ?? ''}
          onChange={(e) => patch({ taxStatus: e.target.value })}
        />
      </div>
    </div>
  )
}
