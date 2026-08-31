export type WithdrawalReturnAddressMode = 'store' | 'custom'

export type WithdrawalStructuredAddress = {
  organizationName: string
  street: string
  city: string
  postalCode: string
  country: string
}

export type WithdrawalAcknowledgementTemplate = {
  subject: string
  body: string
}

export type WithdrawalPublicSettings = {
  returnAddressMode: WithdrawalReturnAddressMode
  customReturnAddress: WithdrawalStructuredAddress
  accountWithdrawalWindowDays: number
}

export type WithdrawalSettings = WithdrawalPublicSettings & {
  acknowledgementTemplates: Partial<Record<string, WithdrawalAcknowledgementTemplate>>
}

export const DEFAULT_WITHDRAWAL_STRUCTURED_ADDRESS: WithdrawalStructuredAddress = {
  organizationName: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
}

export const DEFAULT_WITHDRAWAL_PUBLIC_SETTINGS: WithdrawalPublicSettings = {
  returnAddressMode: 'store',
  customReturnAddress: { ...DEFAULT_WITHDRAWAL_STRUCTURED_ADDRESS },
  accountWithdrawalWindowDays: 14,
}
