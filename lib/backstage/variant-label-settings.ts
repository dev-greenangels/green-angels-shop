import type { VariantAttributeType } from '@/lib/backstage/variant-attributes'

export const DEFAULT_VARIANT_LABEL_TYPE_ORDER: VariantAttributeType[] = [
  'CONTAINER',
  'RANGE',
  'NUMBER',
  'COLOR',
  'UNIVERSAL',
]

export type VariantLabelSettings = {
  labelTypeOrder: VariantAttributeType[]
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchVariantLabelSettings(): Promise<VariantLabelSettings> {
  const res = await fetch('/api/backstage/settings/variant-labels', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateVariantLabelSettings(
  payload: VariantLabelSettings,
): Promise<VariantLabelSettings> {
  const res = await fetch('/api/backstage/settings/variant-labels', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function normalizeVariantLabelTypeOrder(
  order: VariantAttributeType[] | undefined,
): VariantAttributeType[] {
  const seen = new Set<VariantAttributeType>()
  const normalized: VariantAttributeType[] = []
  for (const type of order ?? []) {
    if (!DEFAULT_VARIANT_LABEL_TYPE_ORDER.includes(type) || seen.has(type)) continue
    seen.add(type)
    normalized.push(type)
  }
  for (const type of DEFAULT_VARIANT_LABEL_TYPE_ORDER) {
    if (!seen.has(type)) normalized.push(type)
  }
  return normalized
}
