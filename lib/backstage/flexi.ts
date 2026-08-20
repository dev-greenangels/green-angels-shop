export type FlexiDocumentSendMode = 'site' | 'abra' | 'both' | 'none'

export type FlexiScheduleMode = 'daily' | 'weekly' | 'monthly'

export type FlexiFullSyncSchedule = {
  enabled: boolean
  mode: FlexiScheduleMode
  hour: number
  minute: number
  dayOfWeek: number
  dayOfMonth: number
}

export type FlexiWebhookRegistrationStatus =
  | 'NOT_REGISTERED'
  | 'REGISTERED'
  | 'DISABLED'
  | 'UNKNOWN'
  | 'ERROR'

export type FlexiPublicSettings = {
  enabled: boolean
  configured: boolean
  baseUrl: string
  companyId: string
  defaultStockCode: string
  orderDocTypeCode: string
  centerCode: string
  orderUserStatus: string
  issuedInvoiceTypeCode: string
  shippingCenikKod: string
  boxesCenikKod: string
  codFeeCenikKod: string
  /** Website deliveryMethod slug → Flexi forma-dopravy abbreviation. */
  deliveryMethodCodes: Record<string, string>
  defaultCategoryId: string
  stromRootCode: string
  stromShopRootCode: string
  syncCategoriesFromStrom: boolean
  sizeAttributeId: string
  webhookUrl: string
  hasWebhookSecKey: boolean
  webhookAccepting: boolean
  webhookRemoteId: string
  webhookRegistrationStatus: FlexiWebhookRegistrationStatus
  webhookLastRegisterAt?: string
  webhookLastError?: string
  hasUsername: boolean
  documentSend: {
    b2b: FlexiDocumentSendMode
    b2c: FlexiDocumentSendMode
  }
  globalVersion: number
  backupPollEveryHours: number
  fullSyncSchedule: FlexiFullSyncSchedule
  fullSyncScheduleLabel: string
  apiCallsToday: number
  apiCallsWarnThreshold: number
  lastExportAt?: string
  lastSyncAt?: string
  lastSyncStatus?: 'ok' | 'error' | 'never'
  lastSyncMessage?: string
  lastImportAt?: string
  lastImportMessage?: string
  lastStromSyncAt?: string
  lastStromSyncMessage?: string
}

export type FlexiSettingsPatch = Partial<{
  enabled: boolean
  baseUrl: string
  companyId: string
  username: string
  password: string
  defaultStockCode: string
  orderDocTypeCode: string
  centerCode: string
  orderUserStatus: string
  issuedInvoiceTypeCode: string
  shippingCenikKod: string
  boxesCenikKod: string
  codFeeCenikKod: string
  deliveryMethodCodes: Record<string, string>
  defaultCategoryId: string
  stromRootCode: string
  stromShopRootCode: string
  syncCategoriesFromStrom: boolean
  sizeAttributeId: string
  webhookSecKey: string
  webhookUrl: string
  documentSend: {
    b2b: FlexiDocumentSendMode
    b2c: FlexiDocumentSendMode
  }
  backupPollEveryHours: number
  fullSyncSchedule: Partial<FlexiFullSyncSchedule>
}>

export type FlexiSyncResult = {
  ok: boolean
  itemsSynced: number
  unmatched: number
  message: string
}

export type FlexiStromSyncResult = {
  ok: boolean
  categoriesUpserted: number
  productsUpserted: number
  variantsUpserted: number
  orphansCreated: number
  message: string
  errors: string[]
}

export type FlexiImportResult = {
  ok: boolean
  created: number
  skippedExisting: number
  skippedNoSku: number
  skippedNoStock: number
  errors: string[]
  message: string
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function fetchFlexiSettings(): Promise<FlexiPublicSettings> {
  const res = await fetch('/api/backstage/flexi/settings', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function updateFlexiSettings(
  payload: FlexiSettingsPatch,
): Promise<FlexiPublicSettings> {
  const res = await fetch('/api/backstage/flexi/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function testFlexiConnection(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch('/api/backstage/flexi/test-connection', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function registerFlexiWebhook(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch('/api/backstage/flexi/register-webhook', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function disableFlexiWebhook(): Promise<{ ok: boolean; message: string }> {
  const res = await fetch('/api/backstage/flexi/disable-webhook', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function refreshFlexiWebhookStatus(): Promise<{
  ok: boolean
  status: string
  remoteId?: string
  remoteUrl?: string
  hooksCount: number
  message: string
}> {
  const res = await fetch('/api/backstage/flexi/webhook-status', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function runFlexiPollChanges(): Promise<FlexiSyncResult> {
  const res = await fetch('/api/backstage/flexi/poll-changes/run', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

/** @deprecated alias — Sync button polls Changes */
export async function runFlexiSync(): Promise<FlexiSyncResult> {
  return runFlexiPollChanges()
}

export async function runFlexiFullSync(): Promise<FlexiSyncResult> {
  const res = await fetch('/api/backstage/flexi/full-sync/run', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function runFlexiStromSync(): Promise<FlexiStromSyncResult> {
  const res = await fetch('/api/backstage/flexi/sync-strom/run', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function runFlexiImport(): Promise<FlexiImportResult> {
  const res = await fetch('/api/backstage/flexi/import-new-products/run', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export type FlexiQueueSnapshot = {
  events: Record<string, number>
  failed: Array<{
    id: string
    evidence: string
    objectId: string
    changeVersion: number
    attempts: number
    lastError: string | null
    updatedAt: string
  }>
  jobs: Record<string, number>
  cursor: number
}

export async function fetchFlexiQueue(): Promise<FlexiQueueSnapshot> {
  const res = await fetch('/api/backstage/flexi/queue', {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function retryFlexiFailedQueue(): Promise<{ ok: boolean; count: number; message: string }> {
  const res = await fetch('/api/backstage/flexi/queue/retry-failed', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function skipFlexiFailedQueue(): Promise<{ ok: boolean; count: number; message: string }> {
  const res = await fetch('/api/backstage/flexi/queue/skip-failed', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function drainFlexiQueue(): Promise<{ ok: boolean; removed: number; message: string }> {
  const res = await fetch('/api/backstage/flexi/queue/drain', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
