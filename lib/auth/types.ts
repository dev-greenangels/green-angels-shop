export type UserRole = 'customer' | 'admin'

/** Публічні дані сесії (без токена), безпечно передавати в клієнт з сервера. */
export type PublicSession = {
  email: string
  role: UserRole
}

export type SessionJwtPayload = PublicSession & {
  /** Версія формату токена */
  v: 1
}
