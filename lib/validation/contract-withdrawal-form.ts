import { isValidEmail, sanitizeEmail } from '@/lib/validation/register-form'
import { sanitizePersonName } from '@/lib/validation/wholesale-inquiry-form'

export { sanitizeEmail, sanitizePersonName }

export type ContractWithdrawalFormValues = {
  customerName: string
  email: string
  orderNumber: string
  scope: 'ENTIRE_ORDER' | 'PARTIAL'
  phone: string
  partialItemsText: string
  fax: string
}

export const EMPTY_CONTRACT_WITHDRAWAL_FORM: ContractWithdrawalFormValues = {
  customerName: '',
  email: '',
  orderNumber: '',
  scope: 'ENTIRE_ORDER',
  phone: '',
  partialItemsText: '',
  fax: '',
}

export function sanitizePartialItemsText(value: string): string {
  return value.replace(/[<>]/g, '').slice(0, 4000)
}

export function sanitizeOrderNumber(value: string): string {
  return value.replace(/[^\dA-Za-z#\-/]/g, '').slice(0, 64)
}

export function sanitizeOptionalPhone(value: string): string {
  return value.replace(/[<>]/g, '').trim().slice(0, 32)
}

export type ContractWithdrawalFormErrors = Partial<Record<keyof ContractWithdrawalFormValues, string>>

export function validateContractWithdrawalForm(
  values: ContractWithdrawalFormValues,
  messages: {
    customerName: string
    email: string
    orderNumber: string
    partialItemsText: string
  },
): ContractWithdrawalFormErrors {
  const errors: ContractWithdrawalFormErrors = {}
  const name = sanitizePersonName(values.customerName)
  if (name.length < 2) errors.customerName = messages.customerName
  const email = sanitizeEmail(values.email)
  if (!email || !isValidEmail(email)) errors.email = messages.email
  const orderNumber = sanitizeOrderNumber(values.orderNumber)
  if (!orderNumber) errors.orderNumber = messages.orderNumber
  if (values.scope === 'PARTIAL' && !sanitizePartialItemsText(values.partialItemsText).trim()) {
    errors.partialItemsText = messages.partialItemsText
  }
  return errors
}
