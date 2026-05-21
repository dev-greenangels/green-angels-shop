import { isValidEmail, sanitizeEmail } from '@/lib/validation/register-form'

export type LoginFormValues = {
  email: string
  password: string
  remember: boolean
}

export type LoginFieldKey = 'email' | 'password'

export { sanitizeEmail }

export function isLoginFormValid(values: LoginFormValues): boolean {
  const email = values.email.trim()
  return email.length > 0 && isValidEmail(email) && values.password.length > 0
}

export function getLoginFieldError(
  field: LoginFieldKey,
  values: LoginFormValues
): string | null {
  switch (field) {
    case 'email':
      if (!values.email.trim()) return 'Обовʼязкове поле'
      if (!isValidEmail(values.email)) return 'Невірний формат email'
      return null
    case 'password':
      if (!values.password) return 'Обовʼязкове поле'
      return null
    default:
      return null
  }
}
