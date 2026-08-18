import {
  isValidEmail,
  isValidLatinName,
  sanitizeEmail,
  sanitizeLatinName,
} from '@/lib/validation/register-form'
import { isValidPhoneForPolicy, type PhonePolicy } from '@/lib/settings/market'
import type { MarketRegion } from '@/lib/settings/market'

export type WholesaleInquiryFormValues = {
  fullName: string
  companyName: string
  phone: string
  email: string
  city: string
  website: string
  message: string
  companyIco: string
  companyVatId: string
  consent: boolean
  fax: string
}

export const EMPTY_WHOLESALE_INQUIRY_FORM: WholesaleInquiryFormValues = {
  fullName: '',
  companyName: '',
  phone: '',
  email: '',
  city: '',
  website: '',
  message: '',
  companyIco: '',
  companyVatId: '',
  consent: false,
  fax: '',
}

const NAME_FILTER =
  /[^A-Za-zÀ-ÖØ-öø-ÿĀ-žĄąĆćČčĎďĐđĘęĚěĹĺĽľŁłŃńŇňŐőŘřŚśŠšŤťŮůŰűŹźŻżŽžА-Яа-яІіЇїЄєҐґЁё'ʼ\- ]/g

export function sanitizePersonName(value: string): string {
  return value.replace(NAME_FILTER, '').replace(/\s+/g, ' ').slice(0, 120)
}

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.length < 2 || trimmed.length > 120) return false
  return /[A-Za-zÀ-ÖØ-öø-ÿĀ-žА-Яа-яІіЇїЄєҐґЁё]/.test(trimmed)
}

export function sanitizeCompanyName(value: string): string {
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').slice(0, 200)
}

export function sanitizeCity(value: string): string {
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').slice(0, 120)
}

export function sanitizeWebsiteInput(value: string): string {
  return value.replace(/[<>]/g, '').trim().slice(0, 300)
}

export function sanitizeMessage(value: string): string {
  return value.replace(/[<>]/g, '').slice(0, 2000)
}

export function sanitizeIco(value: string): string {
  return value.replace(/\D/g, '').slice(0, 12)
}

export function sanitizeVatId(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 32)
}

export function isValidWebsite(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return false
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withProto)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

export function isValidIco(value: string, required: boolean): boolean {
  const digits = value.replace(/\D/g, '')
  if (!digits) return !required
  return digits.length >= 6 && digits.length <= 12
}

export function isValidVatId(value: string): boolean {
  const compact = value.replace(/\s+/g, '').toUpperCase()
  if (!compact) return true
  return /^[A-Z]{0,2}\d{6,12}$/.test(compact)
}

export type WholesaleFormErrors = Partial<Record<keyof WholesaleInquiryFormValues, string>>

export function validateWholesaleInquiryForm(
  values: WholesaleInquiryFormValues,
  options: { region: MarketRegion; phonePolicy: PhonePolicy; messages: Record<string, string> },
): WholesaleFormErrors {
  const t = options.messages
  const errors: WholesaleFormErrors = {}
  const sk = options.region === 'sk'

  if (!isValidPersonName(values.fullName)) errors.fullName = t.fullName
  if (values.companyName.trim().length < 2) errors.companyName = t.companyName
  if (!isValidPhoneForPolicy(values.phone, options.phonePolicy)) errors.phone = t.phone
  if (!values.email.trim() || !isValidEmail(values.email)) errors.email = t.email
  if (values.city.trim().length < 2) errors.city = t.city
  if (values.website.trim() && !isValidWebsite(values.website)) errors.website = t.website
  if (values.message.trim().length > 2000) errors.message = t.message
  if (!isValidIco(values.companyIco, sk)) errors.companyIco = t.companyIco
  if (!isValidVatId(values.companyVatId)) errors.companyVatId = t.companyVatId
  if (sk && !values.consent) errors.consent = t.consent

  return errors
}

export {
  isValidEmail,
  isValidLatinName,
  sanitizeEmail,
  sanitizeLatinName,
}
