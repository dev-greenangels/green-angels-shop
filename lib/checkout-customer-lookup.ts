export type CustomerLookupResult = {
  found: boolean
  firstName?: string
  lastName?: string
  personalDiscountPercent?: number
}

/** Нормалізація до 9 цифр після коду UA (631768178). */
function normalizeToLocal9(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('380') && digits.length >= 12) return digits.slice(-9)
  if (digits.startsWith('0') && digits.length === 10) return digits.slice(1)
  if (digits.length === 9) return digits
  return digits.slice(-9)
}

/** Мок: лише цей номер — «є в БД». */
const MOCK_EXISTING_LOCAL = '631768178'

const MOCK_EXISTING_PROFILE = {
  firstName: 'Олена',
  lastName: 'Коваленко',
  personalDiscountPercent: 10,
}

function isMockExistingCustomer(phone: string): boolean {
  const local = normalizeToLocal9(phone)
  return local.length === 9 && local === MOCK_EXISTING_LOCAL
}

/** Заглушка: 0631768178 — постійний клієнт, інші — новий. */
export async function lookupCustomerByPhone(phone: string): Promise<CustomerLookupResult> {
  await new Promise((r) => setTimeout(r, 400))

  if (!isMockExistingCustomer(phone)) {
    return { found: false }
  }

  return {
    found: true,
    firstName: MOCK_EXISTING_PROFILE.firstName,
    lastName: MOCK_EXISTING_PROFILE.lastName,
    personalDiscountPercent: MOCK_EXISTING_PROFILE.personalDiscountPercent,
  }
}

/** Мок SMS-коду для постійного клієнта. */
export const MOCK_SMS_CODE = '1234'

export async function sendCheckoutSmsCode(_phone: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 600))
}

export function verifyCheckoutSmsCode(code: string): boolean {
  return code.replace(/\D/g, '') === MOCK_SMS_CODE
}
