export type PlantStockSettings = {
  integrationEnabled: boolean
  serviceReservationCompanyCode: string
  serviceReservationComment: string
  serviceReservationDateMode: 'today'
  allowedWarehouseCodes: string[]
  inventoryTypDoklId: string | null
  inventoryPostingEnabled: boolean
  legacyCreateSizeEnabled: boolean
  lastCatalogSyncAt: string | null
  lastStockSyncAt: string | null
  lastSyncMessage: string | null
  lastSyncOk: boolean | null
}

export type PlantStockSyncStatus = {
  lastCatalogSyncAt: string | null
  lastStockSyncAt: string | null
  lastSyncMessage: string | null
  lastSyncOk: boolean | null
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string
    error?: string
  }
  if (!res.ok) {
    const detail =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.error === 'string' && data.error) ||
      `PlantStock API ${res.status}`
    throw new Error(detail)
  }
  return data
}

export async function fetchPlantStockSettings(): Promise<PlantStockSettings> {
  const res = await fetch('/api/backstage/plant-stock/settings', { credentials: 'include' })
  return readJson(res)
}

export async function updatePlantStockSettings(
  patch: Partial<PlantStockSettings>,
): Promise<PlantStockSettings> {
  const res = await fetch('/api/backstage/plant-stock/settings', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return readJson(res)
}

export async function fetchPlantStockSyncStatus(): Promise<PlantStockSyncStatus> {
  const res = await fetch('/api/backstage/plant-stock/sync-status', {
    credentials: 'include',
  })
  return readJson(res)
}

export async function syncPlantStockCatalog(): Promise<{
  ok: boolean
  upserted: number
  pages: number
  linked?: number
  singletons?: number
  warehouses?: number
  message: string
}> {
  const res = await fetch('/api/backstage/plant-stock/catalog/sync', {
    method: 'POST',
    credentials: 'include',
  })
  return readJson(res)
}

export async function syncPlantStockWarehouses(): Promise<{
  ok: boolean
  upserted: number
  items: Array<{ kod: string; nazev: string }>
  message?: string
}> {
  const res = await fetch('/api/backstage/plant-stock/warehouses/sync', {
    method: 'POST',
    credentials: 'include',
  })
  return readJson(res)
}

export async function syncPlantStockStock(): Promise<{
  ok: boolean
  warehouses: number
  rows: number
  message: string
}> {
  const res = await fetch('/api/backstage/plant-stock/stock/sync', {
    method: 'POST',
    credentials: 'include',
  })
  return readJson(res)
}

export function formatSyncAt(iso: string | null | undefined): string {
  if (!iso) return 'ще не було'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('uk-UA', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}
