export type FetchResult<T> = {
  data: T
  unavailable: boolean
}

export const SERVICE_UNAVAILABLE_MESSAGE =
  'Сервіс тимчасово недоступний. Оновіть сторінку або спробуйте пізніше.'

export const CATALOG_UNAVAILABLE_MESSAGE =
  'Каталог тимчасово недоступний. Спробуйте оновити сторінку пізніше.'

export class ProductNotFoundError extends Error {
  constructor() {
    super('Товар не знайдено')
    this.name = 'ProductNotFoundError'
  }
}

export function unavailableResult<T>(fallback: T): FetchResult<T> {
  return { data: fallback, unavailable: true }
}

export function availableResult<T>(data: T): FetchResult<T> {
  return { data, unavailable: false }
}
