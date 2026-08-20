export type UserRole = 'customer' | 'admin'

export type AccountType = 'retail' | 'wholesale'

/** Публічні дані сесії (без токена), безпечно передавати в клієнт з сервера. */
export type PublicSession = {
  email?: string | null
  role: UserRole
  /** Роздріб vs гурт (коли відомий з бекенду) */
  accountType?: AccountType
  id?: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
}

export type SessionJwtPayload = {
  email: string
  role: UserRole
  /** Версія формату токена */
  v: 1
}

export type GoogleCheckoutProfile = {
  firstName: string
  lastName: string
  phone: string
  personalDiscountPercent: number
}
