export type TranslationFieldTarget =
  | { kind: 'characteristic-name'; characteristicId: string }
  | { kind: 'characteristic-option-label'; characteristicId: string; optionId: string }
  | { kind: 'variant-attribute-name'; attributeId: string }
  | { kind: 'variant-attribute-description'; attributeId: string }
  | { kind: 'variant-attribute-value-label'; attributeId: string; valueId: string }
  | { kind: 'product-name'; productId: string }
  | { kind: 'product-description'; productId: string }
  | { kind: 'product-meta-title'; productId: string }
  | { kind: 'product-meta-desc'; productId: string }
  | { kind: 'category-name'; categoryId: string }
  | { kind: 'category-description'; categoryId: string }
  | { kind: 'category-footer-description'; categoryId: string }
  | { kind: 'category-meta-title'; categoryId: string }
  | { kind: 'category-meta-desc'; categoryId: string }

function targetPath(target: TranslationFieldTarget): { get: string; patch: string } {
  switch (target.kind) {
    case 'characteristic-name':
      return {
        get: `/api/backstage/characteristics/${target.characteristicId}/translations/name`,
        patch: `/api/backstage/characteristics/${target.characteristicId}/translations/name`,
      }
    case 'characteristic-option-label':
      return {
        get: `/api/backstage/characteristics/${target.characteristicId}/options/${target.optionId}/translations/label`,
        patch: `/api/backstage/characteristics/${target.characteristicId}/options/${target.optionId}/translations/label`,
      }
    case 'variant-attribute-name':
      return {
        get: `/api/backstage/variant-attributes/${target.attributeId}/translations/name`,
        patch: `/api/backstage/variant-attributes/${target.attributeId}/translations/name`,
      }
    case 'variant-attribute-description':
      return {
        get: `/api/backstage/variant-attributes/${target.attributeId}/translations/description`,
        patch: `/api/backstage/variant-attributes/${target.attributeId}/translations/description`,
      }
    case 'variant-attribute-value-label':
      return {
        get: `/api/backstage/variant-attributes/${target.attributeId}/values/${target.valueId}/translations/label`,
        patch: `/api/backstage/variant-attributes/${target.attributeId}/values/${target.valueId}/translations/label`,
      }
    case 'product-name':
      return {
        get: `/api/backstage/products/${target.productId}/translations/name`,
        patch: `/api/backstage/products/${target.productId}/translations/name`,
      }
    case 'product-description':
      return {
        get: `/api/backstage/products/${target.productId}/translations/description`,
        patch: `/api/backstage/products/${target.productId}/translations/description`,
      }
    case 'product-meta-title':
      return {
        get: `/api/backstage/products/${target.productId}/translations/meta-title`,
        patch: `/api/backstage/products/${target.productId}/translations/meta-title`,
      }
    case 'product-meta-desc':
      return {
        get: `/api/backstage/products/${target.productId}/translations/meta-desc`,
        patch: `/api/backstage/products/${target.productId}/translations/meta-desc`,
      }
    case 'category-name':
      return {
        get: `/api/backstage/categories/${target.categoryId}/translations/name`,
        patch: `/api/backstage/categories/${target.categoryId}/translations/name`,
      }
    case 'category-description':
      return {
        get: `/api/backstage/categories/${target.categoryId}/translations/description`,
        patch: `/api/backstage/categories/${target.categoryId}/translations/description`,
      }
    case 'category-footer-description':
      return {
        get: `/api/backstage/categories/${target.categoryId}/translations/footer-description`,
        patch: `/api/backstage/categories/${target.categoryId}/translations/footer-description`,
      }
    case 'category-meta-title':
      return {
        get: `/api/backstage/categories/${target.categoryId}/translations/meta-title`,
        patch: `/api/backstage/categories/${target.categoryId}/translations/meta-title`,
      }
    case 'category-meta-desc':
      return {
        get: `/api/backstage/categories/${target.categoryId}/translations/meta-desc`,
        patch: `/api/backstage/categories/${target.categoryId}/translations/meta-desc`,
      }
  }
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchTranslationField(
  target: TranslationFieldTarget,
): Promise<Record<string, string>> {
  const { get } = targetPath(target)
  const res = await fetch(get, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error(await parseError(res))
  const data = (await res.json()) as { translations: Record<string, string> }
  return data.translations ?? {}
}

export async function patchTranslationField(
  target: TranslationFieldTarget,
  translations: Record<string, string>,
): Promise<void> {
  const { patch } = targetPath(target)
  const res = await fetch(patch, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ translations }),
  })
  if (!res.ok) throw new Error(await parseError(res))
}
