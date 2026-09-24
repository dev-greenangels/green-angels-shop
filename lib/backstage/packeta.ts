export type PacketaAdminSettings = {
  enabled: boolean
  configured: boolean
  senderLabel: string
  includeZbox: boolean
  includeCarrierPoints?: boolean
  carrierPointIds?: number[]
  zboxMaxLongestSideCm: number
  zboxMaxSideSumCm: number
  branchMaxLongestSideCm: number
  branchMaxSideSumCm: number
  apiKeyConfigured: boolean
  apiKeyMasked: string
  apiPasswordConfigured: boolean
}

export type PacketaSettingsPatch = {
  enabled?: boolean
  senderLabel?: string
  includeZbox?: boolean
  zboxMaxLongestSideCm?: number
  zboxMaxSideSumCm?: number
  branchMaxLongestSideCm?: number
  branchMaxSideSumCm?: number
  /** Leave blank to keep the stored key. */
  apiKey?: string
  /** Leave blank to keep the stored password. */
  apiPassword?: string
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; error?: string }
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.error === 'string') return data.error
  return 'Не вдалося виконати запит Packeta.'
}

export type PacketaBdsStatus = 'confirmed' | 'possible' | 'no' | 'unknown'

export type PacketaCarrier = {
  id: number
  name: string
  country: string
  currency: string | null
  available: boolean | null
  apiAllowed: boolean | null
  pickupPoints: boolean | null
  maxWeightKg: number | null
  disallowsCod: boolean | null
  codAllowed: boolean | null
  requiresSize: boolean | null
  requiresEmail: boolean | null
  requiresPhone: boolean | null
  separateHouseNumber: boolean | null
  customsDeclarations: boolean | null
  labelRouting: string | null
  labelName: string | null
  bdsStatus: PacketaBdsStatus
}

export type PacketaCarriersFeedResult = {
  configured: boolean
  fetchedAt: string | null
  fromCache: boolean
  carriers: PacketaCarrier[]
  byCountry: Record<string, PacketaCarrier[]>
  error: string | null
}

export async function fetchPacketaCarriers(options?: {
  refresh?: boolean
}): Promise<PacketaCarriersFeedResult> {
  const qs = options?.refresh ? '?refresh=1' : ''
  const res = await fetch(`/api/backstage/packeta/carriers${qs}`, {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as PacketaCarriersFeedResult
}

export async function fetchPacketaSettings(): Promise<PacketaAdminSettings> {
  const res = await fetch('/api/backstage/packeta/settings', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as PacketaAdminSettings
}

export async function updatePacketaSettings(
  payload: PacketaSettingsPatch,
): Promise<PacketaAdminSettings> {
  const res = await fetch('/api/backstage/packeta/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as PacketaAdminSettings
}
