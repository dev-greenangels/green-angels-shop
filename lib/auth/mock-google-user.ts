/** Фейковий профіль Google для dev / демо чекауту. */
export const MOCK_GOOGLE_CHECKOUT_USER = {
  email: 'olena.kovalenko@gmail.com',
  firstName: 'Олена',
  lastName: 'Коваленко',
  phone: '0631768178',
  personalDiscountPercent: 10,
} as const

export type MockGoogleCheckoutProfile = typeof MOCK_GOOGLE_CHECKOUT_USER
