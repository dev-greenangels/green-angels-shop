import type { StoreContactSettings } from '@/lib/settings/types'

/** Public company name: backoffice organization name, otherwise brand fallback. */
export function resolvePublicCompanyName(
  store: Pick<StoreContactSettings, 'companyDetails'> | null | undefined,
  fallback: string,
): string {
  const fromSettings = store?.companyDetails?.organizationName?.trim()
  return fromSettings || fallback.trim()
}
